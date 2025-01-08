const express = require('express');
const { client } = require('../db/schema');
const XLSX = require('xlsx');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware, adminOnly);

// Get students with search, sort, and pagination
router.post('/students', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortField = 'created_at', 
      sortOrder = 'desc',
      filter = 'all'
    } = req.body;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT * FROM student_info 
      WHERE (
        LOWER(first_name) LIKE LOWER(?) OR 
        LOWER(last_name) LIKE LOWER(?) OR 
        LOWER(admission_no) LIKE LOWER(?)
      )
    `;
    
    const searchParam = `%${search}%`;
    const params = [searchParam, searchParam, searchParam];

    if (filter !== 'all') {
      query += ` AND is_exported = ?`;
      params.push(filter === 'exported');
    }

    query += ` ORDER BY ${sortField} ${sortOrder}
               LIMIT ? OFFSET ?`;
    
    params.push(limit, offset);

    const result = await client.execute({
      sql: query,
      args: params
    });

    res.json({ 
      students: result.rows,
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Export all pending students
router.post('/students/export-all-pending', async (req, res) => {
  try {
    // Get all pending students
    const result = await client.execute({
      sql: `SELECT * FROM student_info WHERE is_exported = false`
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No pending students to export' });
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows.map(student => ({
      'First Name': student.first_name,
      'Middle Name': student.middle_name,
      'Last Name': student.last_name,
      'Form Four Index': student.form_four_index_no,
      'Date of Birth': student.date_of_birth,
      'Marital Status': student.marital_status,
      'Gender': student.gender,
      'Admission Date': student.admission_date,
      'Mobile Number': student.mobile_no,
      'Course': student.course_name,
      'Year of Study': student.year_of_study,
      'Course Duration': student.course_duration,
      'National ID': student.national_id,
      'Admission Number': student.admission_no
    })));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Update exported status for all students
    await client.execute({
      sql: `UPDATE student_info 
            SET is_exported = true, 
                exported_at = CURRENT_TIMESTAMP 
            WHERE is_exported = false`,
    });

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

// Export endpoints remain the same
// ... rest of the file remains unchanged