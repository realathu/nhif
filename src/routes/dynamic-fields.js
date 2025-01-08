const express = require('express');
const { client } = require('../db/schema');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Get field values - Add authentication
router.get('/:fieldName', authMiddleware, async (req, res) => {
  try {
    const { fieldName } = req.params;
    const result = await client.execute({
      sql: 'SELECT field_value FROM dynamic_fields WHERE field_name = ? ORDER BY field_value DESC',
      args: [fieldName]
    });
    
    const values = result.rows.map(row => row.field_value);
    res.json(values);
  } catch (error) {
    console.error('Failed to fetch field values:', error);
    res.status(500).json({ error: 'Failed to fetch field values' });
  }
});

// Add new field value
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { fieldName, fieldValue } = req.body;
    
    // Validate date format for admission_date
    if (fieldName === 'admission_date') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fieldValue)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    // Check if value already exists
    const existing = await client.execute({
      sql: 'SELECT id FROM dynamic_fields WHERE field_name = ? AND field_value = ?',
      args: [fieldName, fieldValue]
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Value already exists' });
    }

    await client.execute({
      sql: 'INSERT INTO dynamic_fields (field_name, field_value) VALUES (?, ?)',
      args: [fieldName, fieldValue]
    });
    res.status(201).json({ message: 'Field value added successfully' });
  } catch (error) {
    console.error('Failed to add field value:', error);
    res.status(500).json({ error: 'Failed to add field value' });
  }
});

// Delete field value
router.delete('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { fieldName, fieldValue } = req.body;
    await client.execute({
      sql: 'DELETE FROM dynamic_fields WHERE field_name = ? AND field_value = ?',
      args: [fieldName, fieldValue]
    });
    res.status(200).json({ message: 'Field value deleted successfully' });
  } catch (error) {
    console.error('Failed to delete field value:', error);
    res.status(500).json({ error: 'Failed to delete field value' });
  }
});

module.exports = router;