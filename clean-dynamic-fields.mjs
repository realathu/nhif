import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  // Start a transaction
  db.prepare('BEGIN').run();

  // Remove duplicates by keeping only the earliest entry for each field_name + field_value combination
  db.prepare(`
    DELETE FROM dynamic_fields 
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM dynamic_fields
      GROUP BY field_name, field_value
    )
  `).run();

  // Add unique constraint
  db.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_dynamic_fields_unique 
    ON dynamic_fields(field_name, field_value)
  `).run();

  // Commit the transaction
  db.prepare('COMMIT').run();

  console.log('Successfully cleaned up dynamic fields and added unique constraint');
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error:', error);
} finally {
  db.close();
}
