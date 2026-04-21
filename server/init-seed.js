import { initializeDatabase, run } from './database.js';
import { seedTestData } from './seed-data.js';

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();

    // Check if database is already seeded
    const existingAdmin = await run(
      'SELECT COUNT(*) as count FROM users WHERE email = ? AND role = ?',
      ['admin@platform.ru', 'admin']
    );

    if (existingAdmin.lastID || existingAdmin.changes > 0) {
      console.log('Database already seeded. Skipping initialization.');
      process.exit(0);
    }

    console.log('Clearing existing test data...');
    await run('DELETE FROM solutions');
    await run('DELETE FROM cases');
    await run('DELETE FROM company_profiles');
    await run('DELETE FROM student_profiles');
    await run('DELETE FROM admin_profiles');
    await run('DELETE FROM users');
    await run('DELETE FROM sessions');

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