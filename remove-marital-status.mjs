import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  // Start a transaction
  db.prepare('BEGIN').run();

  // Remove Divorced and Widowed status
  const result = db.prepare(`
    DELETE FROM dynamic_fields 
    WHERE field_name = 'marital_status' 
    AND field_value IN ('Divorced', 'Widowed')
  `).run();

  // Commit the transaction
  db.prepare('COMMIT').run();

  console.log(`Successfully removed ${result.changes} marital status values`);
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error:', error);
} finally {
  db.close();
}
