// Quick test script for BE-9-10 invitation endpoints
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:8000/api';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function quickTest() {
  console.log('🧪 Quick Test for BE-9-10 Club Invitations');
  console.log('==========================================');

  try {
    // Test 1: Check if API is running
    console.log('1. Testing API health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ API is healthy:', healthResponse.data.status);

    // Test 2: Check if Supabase connection works
    console.log('\n2. Testing Supabase connection...');
    const { data, error } = await supabase
      .from('clubs')
      .select('count')
      .limit(1);
    if (error) {
      console.log('⚠️  Supabase connection issue:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Test 3: Check club_members table structure (to see if schema was applied)
    console.log('\n3. Checking club_members table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('club_members')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Error accessing club_members table:', tableError.message);
      if (
        tableError.message.includes('column') ||
        tableError.message.includes('does not exist')
      ) {
        console.log(
          '🔧 This indicates the database schema may not be applied yet',
        );
        console.log(
          '   Please apply the schema manually through Supabase Dashboard',
        );
        console.log(
          '   or run the SQL script: scripts/be-9-10-club-invitations-schema.sql',
        );
      }
    } else {
      console.log('✅ club_members table accessible');
      console.log('   Available columns will be visible in actual queries');
    }

    // Test 4: List available club endpoints
    console.log('\n4. Testing invitation endpoints availability...');

    // Test endpoints without authentication (should get auth errors, not 404)
    const testEndpoints = [
      '/clubs/123/invite/email',
      '/clubs/123/invite/code',
      '/clubs/123/invitations',
    ];

    for (const endpoint of testEndpoints) {
      try {
        await axios.post(`${API_BASE_URL}${endpoint}`, {});
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(`✅ ${endpoint} - Endpoint exists (auth required)`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${endpoint} - Endpoint not found`);
        } else {
          console.log(
            `⚠️  ${endpoint} - ${error.response?.status}: ${error.response?.data?.error || error.message}`,
          );
        }
      }
    }

    console.log('\n🎉 Quick test completed!');
    console.log('\nNext steps:');
    console.log('1. Apply database schema through Supabase Dashboard');
    console.log('2. Create test users and clubs');
    console.log('3. Run full invitation tests');
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

quickTest();
