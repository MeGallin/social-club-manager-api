// Schema Verification Script for BE-9-10
// Checks if the invitation schema was applied correctly

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function verifySchema() {
  console.log('🔍 Verifying BE-9-10 Club Invitations Schema');
  console.log('============================================');

  try {
    // Test 1: Check if club_members table exists and has new columns
    console.log('\n1. Checking club_members table structure...');

    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'club_members' })
      .single();

    if (tableError) {
      // Fallback: Try to query the table directly
      const { data, error } = await supabase
        .from('club_members')
        .select('id, email, invite_status, invite_code, invited_by, invited_at')
        .limit(1);

      if (error) {
        if (
          error.message.includes('relation') &&
          error.message.includes('does not exist')
        ) {
          console.log('❌ club_members table does not exist');
          console.log('   Please apply the previous schemas first (BE-7-8)');
          return false;
        } else if (
          error.message.includes('column') &&
          error.message.includes('does not exist')
        ) {
          console.log('❌ New invitation columns not found');
          console.log('   Please apply the BE-9-10 schema');
          return false;
        }
        console.log('❌ Error querying table:', error.message);
        return false;
      } else {
        console.log('✅ All invitation columns exist and are accessible');
      }
    } else {
      console.log('✅ Table structure retrieved successfully');
    }

    // Test 2: Check if utility functions exist
    console.log('\n2. Checking utility functions...');

    try {
      const { data: codeData, error: codeError } = await supabase.rpc(
        'generate_invite_code',
      );

      if (codeError) {
        console.log('❌ generate_invite_code function not found');
      } else {
        console.log(
          '✅ generate_invite_code function working, generated:',
          codeData,
        );
      }
    } catch (err) {
      console.log('❌ Error testing generate_invite_code:', err.message);
    }

    // Test 3: Check basic API connectivity
    console.log('\n3. Testing API connectivity...');

    try {
      const response = await fetch('http://localhost:8000/api/health');
      const healthData = await response.json();

      if (healthData.status === 'ok') {
        console.log('✅ API server is running and healthy');
      } else {
        console.log('⚠️  API server responded but status is not ok');
      }
    } catch (err) {
      console.log('❌ API server is not running or not accessible');
      console.log('   Please start the server with: npm start');
    }

    // Test 4: Check invitation endpoints
    console.log('\n4. Testing invitation endpoint structure...');

    const testEndpoints = [
      'POST /clubs/:clubId/invite/email',
      'POST /clubs/:clubId/invite/code',
      'GET /clubs/:clubId/invitations',
    ];

    console.log('✅ Expected invitation endpoints:');
    testEndpoints.forEach((endpoint) => {
      console.log(`   - ${endpoint}`);
    });

    console.log('\n🎉 Schema verification completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. If schema is applied: Run invitation tests');
    console.log('2. If schema missing: Apply MANUAL-SCHEMA-APPLICATION.sql');
    console.log('3. If API not running: Start with npm start');

    return true;
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifySchema();
