import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  // Get all tables
  const tables = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();

  console.log('\nDatabase Tables:');
  console.log('================\n');

  // For each table, show its schema and content
  tables.forEach(({name}) => {
    // Get table schema
    const schema = db.prepare(`
      SELECT sql 
      FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(name);

    console.log(`Table: ${name}`);
    console.log('-'.repeat(name.length + 7));
    console.log('Schema:');
    console.log(schema.sql);
    
    // Get row count
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
    console.log(`\nRow count: ${count.count}`);

    // Show table content
    const rows = db.prepare(`SELECT * FROM ${name}`).all();
    if (rows.length > 0) {
      console.log('\nContent:');
      console.table(rows);
    }
    console.log('\n' + '='.repeat(50) + '\n');
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
