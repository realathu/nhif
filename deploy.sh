#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting NHIF Application Deployment"
echo "Domain: library.dmi.ac.tz"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function for error handling
handle_error() {
    echo "❌ Error occurred in deployment script"
    echo "Error on line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "📦 Installing system dependencies..."
apt update
apt upgrade -y
apt install -y curl nginx certbot python3-certbot-nginx sqlite3

# Install Node.js 18
if ! command_exists node; then
    echo "🟢 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# Install PM2
if ! command_exists pm2; then
    echo "🟢 Installing PM2..."
    npm install -g pm2
fi

echo "📁 Setting up application directory..."
mkdir -p /var/www/nhif
chown -R $SUDO_USER:$SUDO_USER /var/www/nhif

# Create Nginx configuration
echo "🔧 Configuring Nginx..."
cat > /etc/nginx/sites-available/nhif << 'EOL'
server {
    listen 80;
    server_name library.dmi.ac.tz;

    location / {
        root /var/www/nhif/dist;
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/nhif /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email dean@dmi.ac.tz \
        -d library.dmi.ac.tz \
        --redirect

# Setup firewall
echo "🛡️ Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "y" | ufw enable

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
cat > /var/www/nhif/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'nhif-backend',
    script: 'server.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOL

# Setup automatic SSL renewal
echo "🔄 Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Setup log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/nhif << 'EOL'
/var/www/nhif/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOL

# Create backup script
echo "💾 Setting up backup script..."
mkdir -p /var/backups/nhif
cat > /etc/cron.daily/backup-nhif << 'EOL'
#!/bin/bash
DATE=$(date +%Y%m%d)
cp /var/www/nhif/local.db /var/backups/nhif/nhif-$DATE.db
find /var/backups/nhif -type f -mtime +30 -delete
EOL
chmod +x /etc/cron.daily/backup-nhif

# Restart services
echo "🔄 Restarting services..."
systemctl restart nginx

echo """
✅ Deployment script completed!

Next steps:
1. Copy your application files to /var/www/nhif/
2. Create .env file in /var/www/nhif/ with required environment variables
3. Run 'cd /var/www/nhif && npm install'
4. Run 'npm run build' to build the frontend
5. Start the application with 'pm2 start ecosystem.config.js'
6. Run 'pm2 save' to save the PM2 process list
7. Run 'pm2 startup' to enable PM2 startup script

Important paths:
- Application: /var/www/nhif/
- Nginx config: /etc/nginx/sites-available/nhif
- SSL certificates: /etc/letsencrypt/live/library.dmi.ac.tz/
- Backups: /var/backups/nhif/

To monitor:
- Application logs: pm2 logs nhif-backend
- Nginx access logs: tail -f /var/log/nginx/access.log
- Nginx error logs: tail -f /var/log/nginx/error.log

The site should now be accessible at: https://library.dmi.ac.tz
"""
