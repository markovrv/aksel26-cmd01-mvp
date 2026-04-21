import { initializeDatabase, get } from './database.js';
import { seedTestData } from './seed-data.js';

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();

    // Check if admin already exists
    const existingAdmin = await get(
      'SELECT id FROM admins WHERE email = ?',
      ['admin@platform.ru']
    );

    if (existingAdmin) {
      console.log('Admin already exists. Skipping initialization.');
      console.log('Done! You can now start the server.');
      process.exit(1);
    }

    console.log('Seeding test data...');
    await seedTestData();

    console.log('Done! You can now start the server.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
