/**
 * Test password verification
 */

const argon2 = require('argon2');

const password = 'Test@1234';
const hash = '$argon2id$v=19$m=65536,t=3,p=4$a3eGdYL8Uc5SLNrZUmJW7A$fL5lSKpIY3JyAfXFe1bxj2BGvgfEnabWVU8teaR5G6I';

async function testVerify() {
  try {
    const isValid = await argon2.verify(hash, password);
    console.log('\nPassword:', password);
    console.log('Hash:', hash);
    console.log('Verification result:', isValid);
    
    if (isValid) {
      console.log('✓ Password verification successful!');
    } else {
      console.log('✗ Password verification failed!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testVerify();
