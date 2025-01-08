import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  // Get all student records with their email addresses
  const students = db.prepare(`
    SELECT 
      s.*,
      u.email
    FROM student_info s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `).all();

  console.log('\nStudent Records:');
  console.log('================\n');

  students.forEach((student, index) => {
    if (index > 0) console.log('-'.repeat(50) + '\n');
    
    console.log('Personal Information:');
    console.log(`Name: ${student.first_name} ${student.middle_name} ${student.last_name}`);
    console.log(`Email: ${student.email}`);
    console.log(`Date of Birth: ${student.date_of_birth}`);
    console.log(`Gender: ${student.gender}`);
    console.log(`Marital Status: ${student.marital_status}`);
    console.log(`National ID: ${student.national_id}`);
    console.log(`Mobile: ${student.mobile_no}`);
    
    console.log('\nAcademic Information:');
    console.log(`Form Four Index No: ${student.form_four_index_no}`);
    console.log(`Admission No: ${student.admission_no}`);
    console.log(`Course: ${student.course_name}`);
    console.log(`Year of Study: ${student.year_of_study}`);
    console.log(`Course Duration: ${student.course_duration} year(s)`);
    console.log(`Admission Date: ${student.admission_date}`);
    
    console.log('\nStatus Information:');
    console.log(`Exported: ${student.is_exported ? 'Yes' : 'No'}`);
    console.log(`Export Date: ${student.exported_at || 'Not exported'}`);
    console.log(`Record Created: ${student.created_at}`);
  });

  if (students.length === 0) {
    console.log('No student records found.');
  }

} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
