/**
 * Generate argon2 hash for test password
 * Usage: node generate-test-password.js
 */

const argon2 = require('argon2');

const password = 'Test@1234';

async function generateHash() {
  try {
    const hash = await argon2.hash(password);
    console.log('\nPassword:', password);
    console.log('Argon2 Hash:', hash);
    console.log('\nCopy this hash to seed-test-data.sql\n');
  } catch (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
}

generateHash();
