// Debug script to test authentication directly
const authService = require('../src/services/authService');

async function debugAuth() {
  console.log('🔍 Debugging Authentication Service\n');
  
  try {
    console.log('Testing user registration...');
    const result = await authService.registerUser({
      email: `debug${Date.now()}@test.com`,
      password: 'Password123!',
      full_name: 'Debug User',
      consent: true
    });
    
    console.log('Auth service result:', JSON.stringify(result, null, 2));
    
    if (result.session) {
      console.log('✅ Session found with access_token:', result.session.access_token);
    } else {
      console.log('❌ No session in result');
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

debugAuth().catch(console.error);
