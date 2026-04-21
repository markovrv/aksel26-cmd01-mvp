import { initializeDatabase, run } from './database.js';
import { seedTestData } from './seed-data.js';

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();

    // Check if database is already seeded
    const existingAdmin = await run(
      'SELECT COUNT(*) as count FROM admins WHERE email = ?',
      ['admin@platform.ru']
    );

    if (existingAdmin.count > 0) {
      console.log('Database already seeded. Skipping initialization.');
      process.exit(0);
    }

    console.log('Seeding test data...');
    await seedTestData();

    console.log('Done! Test data seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();