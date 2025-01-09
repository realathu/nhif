import { createClient } from '@libsql/client';
import * as bcryptjs from 'bcryptjs';

const client = createClient({
  url: process.env.LIBSQL_URL || 'file:local.db',
  authToken: process.env.LIBSQL_AUTH_TOKEN,
});

export async function initializeDatabase() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
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
      college_faculty TEXT NOT NULL DEFAULT 'DMI',
      year_of_study INTEGER NOT NULL,
      course_duration INTEGER NOT NULL,
      national_id TEXT NOT NULL,
      admission_no TEXT NOT NULL,
      is_exported BOOLEAN DEFAULT FALSE,
      exported_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS dynamic_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_name TEXT NOT NULL,
      field_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize admin user
  const initializeAdmin = async (db: any) => {
    const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('dean@dmi.ac.tz');
    
    if (!adminExists) {
      const hashedPassword = await bcryptjs.hash('pass123#', 10);
      db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
        'dean@dmi.ac.tz',
        hashedPassword,
        'admin'
      );
    }
  };

  await initializeAdmin(client);
}

export { client };