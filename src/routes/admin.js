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

// Export endpoints remain the same
// ... rest of the file remains unchanged