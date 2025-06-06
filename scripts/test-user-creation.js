#!/usr/bin/env node

/**
 * Test script to create a user via Supabase Auth and verify profile creation
 * Run this with: node scripts/test-user-creation.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function testUserCreation() {
  console.log('🧪 Testing Supabase User Creation and Profile Sync...\n');

  try {
    // 1. Create a new user
    console.log('1. Creating new user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'securePassword123',
      options: {
        data: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.png',
        },
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // 2. Wait a moment for the trigger to execute
    console.log('\n2. Waiting for profile creation trigger...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Check if profile was created using our API
    console.log('\n3. Checking if profile was created via API...');
    const response = await fetch(
      `http://localhost:8000/api/profiles/${authData.user.id}`,
    );
    const profileResult = await response.json();

    if (profileResult.success) {
      console.log('✅ Profile created automatically!');
      console.log(
        '   Profile data:',
        JSON.stringify(profileResult.data, null, 2),
      );
    } else {
      console.log('❌ Profile not found via API:', profileResult.error);
    }

    // 4. Test API endpoints
    console.log('\n4. Testing API endpoints...');

    // Test GET all profiles
    const allProfilesResponse = await fetch(
      'http://localhost:8000/api/profiles',
    );
    const allProfiles = await allProfilesResponse.json();
    console.log('✅ All profiles count:', allProfiles.count);

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📝 You can now use this user ID for further testing:');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Only run if called directly
if (require.main === module) {
  testUserCreation();
}

module.exports = { testUserCreation };
