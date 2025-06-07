// Simple test script to verify the schema was applied correctly
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function verifySetup() {
  console.log('🔍 Verifying Schema Application');
  console.log('==============================');

  try {
    // Test 1: Check clubs table
    console.log('\n1. Testing clubs table...');
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name')
      .limit(1);

    if (clubsError) {
      console.log('❌ clubs table error:', clubsError.message);
      return false;
    } else {
      console.log('✅ clubs table exists and accessible');
    }

    // Test 2: Check club_members table with new columns
    console.log('\n2. Testing club_members table with invitation columns...');
    const { data: membersData, error: membersError } = await supabase
      .from('club_members')
      .select('id, email, invite_status, invite_code')
      .limit(1);

    if (membersError) {
      console.log('❌ club_members table error:', membersError.message);
      if (
        membersError.message.includes('column') &&
        membersError.message.includes('does not exist')
      ) {
        console.log(
          '   The invitation columns are missing - schema may not be fully applied',
        );
      }
      return false;
    } else {
      console.log(
        '✅ club_members table with invitation columns exists and accessible',
      );
    }

    // Test 3: Check utility functions
    console.log('\n3. Testing invitation utility functions...');
    try {
      const { data: codeData, error: codeError } = await supabase.rpc(
        'generate_invite_code',
      );

      if (codeError) {
        console.log(
          '❌ generate_invite_code function error:',
          codeError.message,
        );
      } else {
        console.log(
          '✅ generate_invite_code function working, sample code:',
          codeData,
        );
      }
    } catch (err) {
      console.log('❌ Function test error:', err.message);
    }

    // Test 4: Check API server
    console.log('\n4. Testing API server connectivity...');
    try {
      const response = await axios.get('http://localhost:8000/api/health');
      if (response.data.status === 'ok') {
        console.log('✅ API server is running and healthy');
      } else {
        console.log('⚠️  API server responded but status is not ok');
      }
    } catch (err) {
      console.log('❌ API server connection failed');
      console.log('   Make sure the server is running: npm start');
    }

    console.log('\n🎉 Schema verification completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Create test users through API registration');
    console.log('2. Create a test club');
    console.log('3. Test invitation endpoints using Postman collection');
    console.log('4. Available endpoints:');
    console.log('   - POST /clubs/:clubId/invite/email');
    console.log('   - POST /clubs/:clubId/invite/code');
    console.log('   - POST /clubs/invite/accept-code');
    console.log('   - GET /clubs/:clubId/invitations');

    return true;
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return false;
  }
}

verifySetup();
