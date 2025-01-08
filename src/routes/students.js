const express = require('express');
const { client } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Submit student information
router.post('/submit', async (req, res) => {
  try {
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