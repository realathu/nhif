import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database('local.db');

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        form_four_index_no TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        marital_status TEXT NOT NULL,
        gender TEXT NOT NULL,
        admission_date DATE NOT NULL,
        mobile_no TEXT NOT NULL,
        course_name TEXT NOT NULL,
        year_of_study INTEGER NOT NULL,
        course_duration INTEGER NOT NULL,
        national_id TEXT NOT NULL,
        admission_no TEXT NOT NULL,
        is_exported BOOLEAN DEFAULT FALSE,
        exported_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS dynamic_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_name TEXT NOT NULL,
        field_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_student_info_user_id ON student_info(user_id);
      CREATE INDEX IF NOT EXISTS idx_student_info_exported ON student_info(is_exported);
      CREATE INDEX IF NOT EXISTS idx_dynamic_fields_name ON dynamic_fields(field_name);
    `);

    // Insert initial data
    const adminPassword = await bcrypt.hash('admin123', 10);
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)');
    insertUser.run('dean@dmi.ac.tz', adminPassword, 'admin');

    const insertDynamicField = db.prepare('INSERT OR IGNORE INTO dynamic_fields (field_name, field_value) VALUES (?, ?)');

    // Insert marital status options
    ['Single', 'Married', 'Divorced', 'Widowed'].forEach(status => {
      insertDynamicField.run('marital_status', status);
    });

    // Insert course names
    ['Shipping and Logistics', 'Maritime Transport', 'Port Management'].forEach(course => {
      insertDynamicField.run('course_name', course);
    });

    // Insert admission dates
    ['2024-01-15', '2024-02-01', '2024-03-01'].forEach(date => {
      insertDynamicField.run('admission_date', date);
    });

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();