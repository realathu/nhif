import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import XLSX from 'xlsx';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database client
const db = new Database('local.db');

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Auth routes
app.get('/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    console.log('Database result:', user);
    
    if (!user) {
      console.log('No user found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison:', { isPasswordValid });

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(email, hashedPassword, 'student');

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Dynamic fields routes
app.get('/dynamic-fields/:fieldName', authMiddleware, async (req, res) => {
  try {
    const { fieldName } = req.params;
    const result = db.prepare('SELECT field_value FROM dynamic_fields WHERE field_name = ? ORDER BY field_value ASC').all(fieldName);
    
    const values = result.map(row => row.field_value);
    res.json(values);
  } catch (error) {
    console.error('Failed to fetch field values:', error);
    res.status(500).json({ error: 'Failed to fetch field values' });
  }
});

app.post('/dynamic-fields', authMiddleware, adminOnly, (req, res) => {
  try {
    const { fieldName, fieldValue } = req.body;
    
    if (!fieldName || !fieldValue) {
      return res.status(400).json({ error: 'Field name and value are required' });
    }

    // Check if the value already exists
    const existing = db.prepare('SELECT COUNT(*) as count FROM dynamic_fields WHERE field_name = ? AND field_value = ?')
      .get(fieldName, fieldValue);

    if (existing.count > 0) {
      return res.status(400).json({ error: 'This value already exists' });
    }

    // Insert the new field value
    const result = db.prepare('INSERT INTO dynamic_fields (field_name, field_value) VALUES (?, ?)')
      .run(fieldName, fieldValue);

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to add field value' });
    }

    res.status(201).json({ message: 'Field value added successfully' });
  } catch (error) {
    console.error('Failed to add field value:', error);
    res.status(500).json({ error: 'Failed to add field value' });
  }
});

// Student routes
app.post('/students/submit', authMiddleware, async (req, res) => {
  try {
    const studentInfo = req.body;
    await db.prepare(`
      INSERT INTO student_info (
        user_id, form_four_index_no, first_name, middle_name, last_name,
        date_of_birth, marital_status, gender, admission_date, mobile_no,
        course_name, year_of_study, course_duration, national_id, admission_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      studentInfo.form_four_index_no,
      studentInfo.first_name,
      studentInfo.middle_name,
      studentInfo.last_name,
      studentInfo.date_of_birth,
      studentInfo.marital_status,
      studentInfo.gender,
      studentInfo.admission_date,
      studentInfo.mobile_no,
      studentInfo.course_name,
      studentInfo.year_of_study,
      studentInfo.course_duration,
      studentInfo.national_id,
      studentInfo.admission_no
    );

    res.status(201).json({ message: 'Information submitted successfully' });
  } catch (error) {
    console.error('Failed to submit student info:', error);
    res.status(500).json({ error: 'Failed to submit information' });
  }
});

// Get student submission status
app.get('/students/submission-status', authMiddleware, async (req, res) => {
  try {
    const studentInfo = db.prepare(`
      SELECT 
        student_info.first_name,
        student_info.middle_name,
        student_info.last_name,
        student_info.created_at
      FROM student_info
      WHERE student_info.user_id = ?
    `).get(req.user.id);

    if (!studentInfo) {
      return res.json({ submitted: false });
    }

    const fullName = [studentInfo.first_name, studentInfo.middle_name, studentInfo.last_name]
      .filter(Boolean)
      .join(' ');

    res.json({
      submitted: true,
      name: fullName,
      submissionDate: studentInfo.created_at
    });
  } catch (error) {
    console.error('Failed to get submission status:', error);
    res.status(500).json({ error: 'Failed to get submission status' });
  }
});

// Protected routes
app.get('/students', authMiddleware, adminOnly, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT 
        student_info.*,
        users.email
      FROM student_info
      JOIN users ON student_info.user_id = users.id
      ORDER BY student_info.created_at DESC
    `).all();
    
    res.json(students);
  } catch (error) {
    console.error('Failed to fetch students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.get('/students/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const { id } = req.params;
    
    const student = db.prepare(`
      SELECT 
        student_info.*,
        users.email
      FROM student_info
      JOIN users ON student_info.user_id = users.id
      WHERE student_info.id = ?
    `).get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Failed to fetch student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

app.post('/students/:id/export', authMiddleware, adminOnly, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const student = db.prepare('SELECT id FROM student_info WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update the student's export status
    db.prepare(`
      UPDATE student_info 
      SET is_exported = TRUE, 
          exported_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);
    
    res.json({ message: 'Student exported successfully' });
  } catch (error) {
    console.error('Failed to export student:', error);
    res.status(500).json({ error: 'Failed to export student' });
  }
});

app.post('/students/export/batch', authMiddleware, adminOnly, (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    // Start a transaction
    db.prepare('BEGIN').run();

    try {
      // Update all students' export status
      const updateStmt = db.prepare(`
        UPDATE student_info 
        SET is_exported = TRUE, 
            exported_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      for (const id of ids) {
        updateStmt.run(id);
      }

      // Commit the transaction
      db.prepare('COMMIT').run();
      
      res.json({ message: 'Students exported successfully' });
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Failed to export students:', error);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

app.get('/students/stats/summary', authMiddleware, adminOnly, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM student_info').get().count,
      exported: db.prepare('SELECT COUNT(*) as count FROM student_info WHERE is_exported = TRUE').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM student_info WHERE is_exported = FALSE').get().count,
      byGender: db.prepare('SELECT gender, COUNT(*) as count FROM student_info GROUP BY gender').all(),
      byCourse: db.prepare('SELECT course_name, COUNT(*) as count FROM student_info GROUP BY course_name').all()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch student statistics:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

app.get('/dynamic-fields', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('SELECT * FROM dynamic_fields ORDER BY field_name ASC').all();
    
    const fields = result.map(row => ({ fieldName: row.field_name, fieldValues: row.field_value }));
    res.json(fields);
  } catch (error) {
    console.error('Failed to fetch dynamic fields:', error);
    res.status(500).json({ error: 'Failed to fetch dynamic fields' });
  }
});

app.delete('/dynamic-fields', authMiddleware, adminOnly, (req, res) => {
  try {
    const { fieldName, fieldValue } = req.body;
    
    if (!fieldName || !fieldValue) {
      return res.status(400).json({ error: 'Field name and value are required' });
    }

    // Check if the field is being used by any student
    if (fieldName === 'course_name') {
      const inUse = db.prepare('SELECT COUNT(*) as count FROM student_info WHERE course_name = ?')
        .get(fieldValue);
      
      if (inUse.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete this course as it is being used by students' 
        });
      }
    }

    // Delete the field value
    const result = db.prepare('DELETE FROM dynamic_fields WHERE field_name = ? AND field_value = ?')
      .run(fieldName, fieldValue);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Field value not found' });
    }

    res.json({ message: 'Field value deleted successfully' });
  } catch (error) {
    console.error('Failed to delete field value:', error);
    res.status(500).json({ error: 'Failed to delete field value' });
  }
});

// Helper function to generate Excel file
function generateExcelFile(students) {
  // Define the headers in the exact order
  const headers = [
    'FormFourIndexNo',
    'FirstName',
    'MiddleName',
    'LastName',
    'DateOfBirth',
    'MaritalStatus',
    'Gender',
    'AdmissionDate',
    'MobileNo',
    'CourseName',
    'CollegeFaculty',
    'YearOfStudy',
    'CourseDuration',
    'NationalID',
    'AdmissionNo'
  ];

  // Transform the data to match the exact format
  const data = students.map(student => ({
    FormFourIndexNo: student.form_four_index_no,
    FirstName: student.first_name,
    MiddleName: student.middle_name,
    LastName: student.last_name,
    DateOfBirth: new Date(student.date_of_birth).toLocaleDateString(),
    MaritalStatus: student.marital_status,
    Gender: student.gender,
    AdmissionDate: new Date(student.admission_date).toLocaleDateString(),
    MobileNo: student.mobile_no,
    CourseName: student.course_name,
    CollegeFaculty: 'DMI',
    YearOfStudy: student.year_of_study,
    CourseDuration: student.course_duration,
    NationalID: student.national_id,
    AdmissionNo: student.admission_no
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });

  // Set column widths
  const colWidths = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  
  // Generate buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Export new entries (not yet exported)
app.post('/students/export/new', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get all non-exported students with full details
    const newStudents = db.prepare(`
      SELECT 
        student_info.*,
        users.email
      FROM student_info
      JOIN users ON student_info.user_id = users.id
      WHERE student_info.is_exported = FALSE
    `).all();

    if (newStudents.length === 0) {
      return res.status(404).json({ error: 'No new students to export' });
    }

    // Generate Excel file
    const excelBuffer = generateExcelFile(newStudents);

    // Update export status within a transaction
    const updateExportStatus = db.transaction((students) => {
      const updateStmt = db.prepare(`
        UPDATE student_info 
        SET is_exported = TRUE, 
            exported_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      for (const student of students) {
        updateStmt.run(student.id);
      }
    });

    // Run the transaction
    updateExportStatus(newStudents);

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=new_students_${Date.now()}.xlsx`);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Failed to export new students:', error);
    res.status(500).json({ error: 'Failed to export new students' });
  }
});

// Export selected students
app.post('/students/export/selected', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    // Get selected students with full details
    const placeholders = ids.map(() => '?').join(',');
    const selectedStudents = db.prepare(`
      SELECT 
        student_info.*,
        users.email
      FROM student_info
      JOIN users ON student_info.user_id = users.id
      WHERE student_info.id IN (${placeholders})
    `).all(ids);

    if (selectedStudents.length !== ids.length) {
      throw new Error('Some selected students do not exist');
    }

    // Generate Excel file
    const excelBuffer = generateExcelFile(selectedStudents);

    // Update export status within a transaction
    const updateExportStatus = db.transaction((students) => {
      const updateStmt = db.prepare(`
        UPDATE student_info 
        SET is_exported = TRUE, 
            exported_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      for (const student of students) {
        updateStmt.run(student.id);
      }
    });

    // Run the transaction
    updateExportStatus(selectedStudents);

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=selected_students_${Date.now()}.xlsx`);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Failed to export selected students:', error);
    res.status(500).json({ error: 'Failed to export selected students' });
  }
});

// Export all pending students
app.post('/admin/students/export-all-pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get all pending students with full details
    const pendingStudents = db.prepare(`
      SELECT 
        student_info.*,
        users.email
      FROM student_info
      JOIN users ON student_info.user_id = users.id
      WHERE student_info.is_exported = FALSE
    `).all();

    if (pendingStudents.length === 0) {
      return res.status(400).json({ error: 'No pending students to export' });
    }

    // Generate Excel file
    const excelBuffer = generateExcelFile(pendingStudents);

    // Update export status within a transaction
    const updateExportStatus = db.transaction(() => {
      db.prepare(`
        UPDATE student_info 
        SET is_exported = TRUE, 
            exported_at = CURRENT_TIMESTAMP 
        WHERE is_exported = FALSE
      `).run();
    });

    // Run the transaction
    updateExportStatus();

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=pending_students_${Date.now()}.xlsx`);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Failed to export pending students:', error);
    res.status(500).json({ error: 'Failed to export pending students' });
  }
});

// Get dashboard statistics
app.get('/dashboard/stats', authMiddleware, adminOnly, (req, res) => {
  try {
    // Get total students count
    const totalStudents = db.prepare(`
      SELECT COUNT(*) as count 
      FROM student_info
    `).get().count;

    // Get exported and pending counts
    const exportStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN is_exported = TRUE THEN 1 ELSE 0 END) as exported,
        SUM(CASE WHEN is_exported = FALSE THEN 1 ELSE 0 END) as pending
      FROM student_info
    `).get();

    // Get gender distribution
    const genderStats = db.prepare(`
      SELECT gender, COUNT(*) as count
      FROM student_info
      GROUP BY gender
      ORDER BY count DESC
    `).all();

    // Get course distribution
    const courseStats = db.prepare(`
      SELECT course_name, COUNT(*) as count
      FROM student_info
      GROUP BY course_name
      ORDER BY count DESC
    `).all();

    // Get recent registrations (last 7 days)
    const recentRegistrations = db.prepare(`
      SELECT COUNT(*) as count
      FROM student_info
      WHERE created_at >= datetime('now', '-7 days')
    `).get().count;

    // Get recent exports (last 7 days)
    const recentExports = db.prepare(`
      SELECT COUNT(*) as count
      FROM student_info
      WHERE exported_at >= datetime('now', '-7 days')
    `).get().count;

    // Get daily registration trend (last 7 days)
    const registrationTrend = db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as count
      FROM student_info
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    // Get export trend (last 7 days)
    const exportTrend = db.prepare(`
      SELECT 
        date(exported_at) as date,
        COUNT(*) as count
      FROM student_info
      WHERE exported_at >= datetime('now', '-7 days')
      GROUP BY date(exported_at)
      ORDER BY date
    `).all();

    res.json({
      total: totalStudents,
      exported: exportStats.exported,
      pending: exportStats.pending,
      byGender: genderStats,
      byCourse: courseStats,
      recentStats: {
        registrations: recentRegistrations,
        exports: recentExports
      },
      trends: {
        registrations: registrationTrend,
        exports: exportTrend
      }
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Add this new endpoint for clearing student data
app.post('/admin/clear-student-data', authMiddleware, adminOnly, (req, res) => {
  try {
    // Start a transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // First, delete from student_info
      const deleteStudentInfo = db.prepare('DELETE FROM student_info').run();
      
      // Then, delete all users except admin
      const deleteUsers = db.prepare("DELETE FROM users WHERE role = 'student'").run();

      // Commit the transaction if both operations succeed
      db.prepare('COMMIT').run();

      res.json({
        message: 'All student data cleared successfully',
        studentsRemoved: deleteStudentInfo.changes,
        usersRemoved: deleteUsers.changes
      });
    } catch (error) {
      // If anything fails, roll back the transaction
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Failed to clear student data:', error);
    res.status(500).json({ error: 'Failed to clear student data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});