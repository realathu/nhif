/*
  # Initial Data Setup

  1. Insert default admin user
  2. Insert initial dynamic field values for:
    - Marital status options
    - Course names
*/

-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (email, password, role) 
VALUES ('dean@dmi.ac.tz', '$2a$10$6Bnv6HFC.p8yyr2jZx1RoOBjo0fq3QQk3WiCDE3YHRQIHVgxkGiXi', 'admin');

-- Insert initial marital status options
INSERT OR IGNORE INTO dynamic_fields (field_name, field_value) VALUES
('marital_status', 'Single'),
('marital_status', 'Married'),
('marital_status', 'Divorced'),
('marital_status', 'Widowed');

-- Insert initial course names
INSERT OR IGNORE INTO dynamic_fields (field_name, field_value) VALUES
('course_name', 'Shipping and Logistics'),
('course_name', 'Maritime Transport'),
('course_name', 'Port Management');