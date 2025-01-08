-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student info table
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

-- Dynamic fields table
CREATE TABLE IF NOT EXISTS dynamic_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_student_info_user_id ON student_info(user_id);
CREATE INDEX IF NOT EXISTS idx_student_info_exported ON student_info(is_exported);
CREATE INDEX IF NOT EXISTS idx_dynamic_fields_name ON dynamic_fields(field_name);

-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (email, password, role) 
VALUES ('dean@dmi.ac.tz', '$2a$10$6Bnv6HFC.p8yyr2jZx1RoOBjo0fq3QQk3WiCDE3YHRQIHVgxkGiXi', 'admin');
