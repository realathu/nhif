const express = require('express');
const { client } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Check submission status
router.get('/status', async (req, res) => {
  try {
    // Only allow student role
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Only students can check submission status.' });
    }

    const result = await client.execute({
      sql: 'SELECT * FROM student_info WHERE user_id = ?',
      args: [req.user.id]
    });

    if (result.rows.length > 0) {
      const student = result.rows[0];
      res.json({
        submitted: true,
        name: `${student.first_name} ${student.middle_name} ${student.last_name}`.trim(),
        submissionDate: student.created_at
      });
    } else {
      res.json({
        submitted: false
      });
    }
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({ error: 'Failed to check submission status' });
  }
});

// Submit student information
router.post('/submit', async (req, res) => {
  try {
    // Only allow student role
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit information' });
    }

    // Check if student has already submitted
    const existingSubmission = await client.execute({
      sql: 'SELECT id FROM student_info WHERE user_id = ?',
      args: [req.user.id]
    });

    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({ error: 'Student information already submitted' });
    }

    const studentInfo = req.body;
    const result = await client.execute({
      sql: `INSERT INTO student_info (
        user_id, form_four_index_no, first_name, middle_name, last_name,
        date_of_birth, marital_status, gender, admission_date,
        mobile_no, course_name, year_of_study, course_duration,
        national_id, admission_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
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
      ]
    });

    res.status(201).json({ message: 'Information submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit information' });
  }
});

module.exports = router;