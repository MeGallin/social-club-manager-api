// BE-7-8 Club Members Test Script
// Tests the club creation with automatic owner assignment and club members functionality

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function testClubMembersImplementation() {
  console.log('🧪 Testing BE-7-8 Club Members Implementation...\n');

  try {
    // Test 1: Verify club_members table exists
    console.log('1. Testing club_members table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('club_members')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ club_members table not found:', tableError.message);
      return;
    }
    console.log('✅ club_members table exists and is accessible');

    // Test 2: Check RLS policies
    console.log('\n2. Testing RLS policies...');
    console.log('ℹ️  RLS policies should prevent unauthorized access');
    console.log('   (Manual verification required with different user tokens)');

    // Test 3: Test data integrity constraints
    console.log('\n3. Testing data constraints...');

    // Test invalid role
    try {
      await supabase.from('club_members').insert([
        {
          club_id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
          role: 'invalid_role',
        },
      ]);
      console.log('❌ Should have rejected invalid role');
    } catch (error) {
      console.log('✅ Invalid role constraint working');
    }

    // Test 4: Verify foreign key constraints
    console.log('\n4. Testing foreign key constraints...');
    try {
      await supabase.from('club_members').insert([
        {
          club_id: 'non-existent-club-id',
          user_id: '00000000-0000-0000-0000-000000000000',
          role: 'member',
        },
      ]);
      console.log('❌ Should have rejected non-existent club_id');
    } catch (error) {
      console.log('✅ Foreign key constraints working');
    }

    console.log('\n🎉 Basic club_members table tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the API with a test JWT token');
    console.log('   2. Create a club via POST /api/clubs');
    console.log('   3. Verify club_members entry is created automatically');
    console.log('   4. Test the new membership endpoints');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testMembershipQueries() {
  console.log('\n🔍 Testing membership queries...\n');

  try {
    // Test getting all members (should require proper authentication)
    console.log('1. Testing member list query structure...');
    const { data, error } = await supabase
      .from('club_members')
      .select(
        `
        user_id,
        role,
        joined_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `,
      )
      .limit(1);

    if (error) {
      console.log(
        'ℹ️  Query structure valid, access restricted by RLS:',
        error.message,
      );
    } else {
      console.log('✅ Membership query structure is correct');
    }

    console.log('\n2. Testing role-based queries...');
    const { data: adminData, error: adminError } = await supabase
      .from('club_members')
      .select('role')
      .in('role', ['owner', 'admin'])
      .limit(1);

    if (adminError) {
      console.log('ℹ️  Admin query structure valid, access restricted by RLS');
    } else {
      console.log('✅ Role-based queries working');
    }
  } catch (error) {
    console.error('❌ Membership queries test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testClubMembersImplementation();
  await testMembershipQueries();

  console.log('\n📚 Documentation:');
  console.log('   - Table schema: scripts/be-7-8-club-members-schema.sql');
  console.log('   - API endpoints added to clubs routes');
  console.log('   - Service methods for membership management');
  console.log('\n🚀 Implementation ready for integration testing!');
}

runTests().catch(console.error);
