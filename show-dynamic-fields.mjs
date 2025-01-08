import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  console.log('\nDynamic Fields Content:');
  console.log('====================');
  
  const fields = db.prepare(`
    SELECT field_name, field_value, created_at 
    FROM dynamic_fields 
    ORDER BY field_name, field_value
  `).all();
  
  // Group by field_name
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.field_name]) {
      acc[field.field_name] = [];
    }
    acc[field.field_name].push(field);
    return acc;
  }, {});

  // Print grouped results
  Object.entries(groupedFields).forEach(([fieldName, values]) => {
    console.log(`\n${fieldName}:`);
    console.log('-'.repeat(fieldName.length + 1));
    values.forEach(field => {
      console.log(`  - ${field.field_value} (added: ${field.created_at})`);
    });
  });

} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
