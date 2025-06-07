#!/usr/bin/env node

/**
 * BE-12 Auto-Update Integration Test
 *
 * Tests the integration of onboarding auto-updates in club invitation endpoints
 *
 * Usage: node test-be-12-auto-update-integration.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data
let testClubId = null;
let adminToken = null;
let memberToken = null;
let inviteeToken = null;

/**
 * Make API request with proper headers
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: TEST_TIMEOUT,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `${error.response.status}: ${JSON.stringify(error.response.data)}`,
      );
    }
    throw error;
  }
}

/**
 * Setup test users and create test club
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');

  const testUsers = [
    {
      email: 'testadmin@tws.com',
      password: 'testpass123',
      full_name: 'Test Admin',
      role: 'admin',
    },
    {
      email: 'testmember@tws.com',
      password: 'testpass123',
      full_name: 'Test Member',
      role: 'member',
    },
    {
      email: 'testinvitee@tws.com',
      password: 'testpass123',
      full_name: 'Test Invitee',
      role: 'invitee',
    },
  ];

  // Register or login test users
  for (const user of testUsers) {
    try {
      // Try to register
      const authData = await apiRequest('POST', '/auth/register', {
        email: user.email,
        password: user.password,
        full_name: user.full_name,
        consent: true,
      });

      if (user.role === 'admin') adminToken = authData.session.access_token;
      if (user.role === 'member') memberToken = authData.session.access_token;
      if (user.role === 'invitee') inviteeToken = authData.session.access_token;

      console.log(`✅ User ${user.role} registered successfully`);
    } catch (error) {
      if (error.message.includes('400') || error.message.includes('email')) {
        // User exists, try to sign in
        try {
          const signInData = await apiRequest('POST', '/auth/login', {
            email: user.email,
            password: user.password,
          });

          if (user.role === 'admin')
            adminToken = signInData.session.access_token;
          if (user.role === 'member')
            memberToken = signInData.session.access_token;
          if (user.role === 'invitee')
            inviteeToken = signInData.session.access_token;

          console.log(`✅ User ${user.role} signed in successfully`);
        } catch (signInError) {
          console.error(
            `❌ Failed to sign in ${user.role}:`,
            signInError.message,
          );
          throw signInError;
        }
      } else {
        console.error(`❌ Failed to register ${user.role}:`, error.message);
        throw error;
      }
    }
  }

  // Create a test club using onboarding endpoint to initialize onboarding status
  console.log('Creating test club with onboarding...');
  const clubData = {
    name: 'Auto-Update Test Club',
    type: 'sports',
    description: 'A club for testing auto-update integration',
    enabled_modules: ['events', 'discussions'],
  };

  try {
    const clubResponse = await apiRequest(
      'POST',
      '/onboarding/club',
      clubData,
      adminToken,
    );
    testClubId = clubResponse.data.id;
    console.log(`✅ Test club created with onboarding: ${testClubId}`);
  } catch (error) {
    console.error('❌ Failed to create club via onboarding:', error.message);
    // Fallback to regular club creation
    const fallbackResponse = await apiRequest(
      'POST',
      '/clubs',
      clubData,
      adminToken,
    );
    testClubId = fallbackResponse.data.id;
    console.log(`✅ Test club created (fallback): ${testClubId}`);
  }
}

/**
 * Get onboarding status
 */
async function getOnboardingStatus() {
  try {
    const response = await apiRequest(
      'GET',
      `/onboarding/status?club_id=${testClubId}`,
      null,
      adminToken,
    );
    return response.data;
  } catch (error) {
    console.warn('Warning: Could not get onboarding status:', error.message);
    return null;
  }
}

/**
 * Test email invitation auto-update
 */
async function testEmailInvitationAutoUpdate() {
  console.log('\n📧 Testing Email Invitation Auto-Update...');

  // Get initial onboarding status
  const initialStatus = await getOnboardingStatus();
  console.log(
    'Initial onboarding status:',
    JSON.stringify(initialStatus, null, 2),
  );

  // Send email invitation
  console.log('1. Sending email invitation...');
  const inviteResponse = await apiRequest(
    'POST',
    `/clubs/${testClubId}/invite-email`,
    {
      email: 'testinvitee@tws.com',
      role: 'member',
    },
    adminToken,
  );
  console.log('✅ Email invitation sent');

  // Check if onboarding status was updated
  const statusAfterInvite = await getOnboardingStatus();
  console.log(
    'Status after invite:',
    JSON.stringify(statusAfterInvite, null, 2),
  );

  if (statusAfterInvite && statusAfterInvite.invited_member) {
    console.log('✅ Auto-update worked: invited_member set to true');
  } else {
    console.log(
      '⚠️  Auto-update may not have worked or status not retrievable',
    );
  }

  // Accept email invitation
  console.log('2. Accepting email invitation...');
  const acceptResponse = await apiRequest(
    'POST',
    `/clubs/${testClubId}/accept-invitation`,
    null,
    inviteeToken,
  );
  console.log('✅ Email invitation accepted');

  // Check final onboarding status
  const finalStatus = await getOnboardingStatus();
  console.log('Final status:', JSON.stringify(finalStatus, null, 2));

  return {
    initialStatus,
    statusAfterInvite,
    finalStatus,
  };
}

/**
 * Test invite code auto-update
 */
async function testInviteCodeAutoUpdate() {
  console.log('\n🔗 Testing Invite Code Auto-Update...');

  // Generate invite code
  console.log('1. Generating invite code...');
  const codeResponse = await apiRequest(
    'POST',
    `/clubs/${testClubId}/invite-code`,
    {
      role: 'member',
    },
    adminToken,
  );
  console.log('✅ Invite code generated:', codeResponse.data.invite_code);

  // Check onboarding status after code generation
  const statusAfterCode = await getOnboardingStatus();
  console.log(
    'Status after code generation:',
    JSON.stringify(statusAfterCode, null, 2),
  );

  // Use invite code (with member token to simulate different user)
  console.log('2. Using invite code...');
  try {
    const joinResponse = await apiRequest(
      'POST',
      `/clubs/join/${codeResponse.data.invite_code}`,
      null,
      memberToken,
    );
    console.log('✅ Successfully joined via invite code');

    // Check final onboarding status
    const finalStatus = await getOnboardingStatus();
    console.log(
      'Final status after code use:',
      JSON.stringify(finalStatus, null, 2),
    );

    return {
      statusAfterCode,
      finalStatus,
    };
  } catch (error) {
    console.log(
      '⚠️  Could not test invite code usage (may already be a member):',
      error.message,
    );
    return { statusAfterCode };
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up...');

  try {
    // Delete test club
    if (testClubId) {
      await apiRequest('DELETE', `/clubs/${testClubId}`, null, adminToken);
      console.log('✅ Test club deleted');
    }
  } catch (error) {
    console.warn('Warning: Could not clean up test club:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting BE-12 Auto-Update Integration Tests\n');

  try {
    // Setup
    await setupTestData();

    // Run tests
    const emailResults = await testEmailInvitationAutoUpdate();
    const codeResults = await testInviteCodeAutoUpdate();

    // Results summary
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));

    console.log('\n📧 Email Invitation Auto-Update:');
    if (
      emailResults.statusAfterInvite &&
      emailResults.statusAfterInvite.invited_member
    ) {
      console.log('  ✅ PASS - Auto-update triggered on email invitation');
    } else {
      console.log('  ❌ FAIL - Auto-update not detected on email invitation');
    }

    console.log('\n🔗 Invite Code Auto-Update:');
    if (
      codeResults.statusAfterCode &&
      codeResults.statusAfterCode.invited_member
    ) {
      console.log(
        '  ✅ PASS - Auto-update triggered on invite code generation',
      );
    } else {
      console.log(
        '  ❌ FAIL - Auto-update not detected on invite code generation',
      );
    }

    console.log('\n🎯 Overall Integration Status:');
    const emailPass =
      emailResults.statusAfterInvite &&
      emailResults.statusAfterInvite.invited_member;
    const codePass =
      codeResults.statusAfterCode && codeResults.statusAfterCode.invited_member;

    if (emailPass && codePass) {
      console.log(
        '  ✅ ALL TESTS PASSED - Auto-update integration working correctly',
      );
    } else if (emailPass || codePass) {
      console.log('  ⚠️  PARTIAL SUCCESS - Some auto-updates working');
    } else {
      console.log(
        '  ❌ TESTS FAILED - Auto-update integration needs attention',
      );
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }

  console.log('\n✅ Tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  apiRequest,
};
