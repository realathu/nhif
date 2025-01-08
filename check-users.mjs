import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.LIBSQL_URL || 'file:local.db'
});

async function checkUsers() {
  try {
    const result = await client.execute('SELECT * FROM users');
    console.log('Users in database:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
