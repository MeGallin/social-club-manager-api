// BE-9-10 Club Invitations Test Script
// Tests the invitation functionality for clubs

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Test configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Initialize Supabase client for testing
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// Test data
const testUsers = {
  admin: {
    email: 'testadmin@example.com',
    password: 'testpass123',
    full_name: 'Test Admin',
  },
  member: {
    email: 'testmember@example.com',
    password: 'testpass123',
    full_name: 'Test Member',
  },
  invitee: {
    email: 'testinvitee@example.com',
    password: 'testpass123',
    full_name: 'Test Invitee',
  },
};

let testClubId = null;
let adminToken = null;
let memberToken = null;
let inviteeToken = null;
let testInvitationId = null;
let testInviteCode = null;

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(data && { data }),
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      );
    }
    throw error;
  }
}

/**
 * Setup test users and club
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');

  try {
    // Create test users
    for (const [role, userData] of Object.entries(testUsers)) {
      console.log(`Creating ${role} user...`);

      // Sign up user
      const { data: authData, error: signupError } = await supabase.auth.signUp(
        {
          email: userData.email,
          password: userData.password,
        },
      );

      if (signupError) {
        console.log(
          `User ${userData.email} might already exist, trying to sign in...`,
        );

        // Try to sign in existing user
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password,
          });

        if (signInError) {
          throw new Error(
            `Failed to authenticate ${role}: ${signInError.message}`,
          );
        }

        // Store token
        if (role === 'admin') adminToken = signInData.session.access_token;
        if (role === 'member') memberToken = signInData.session.access_token;
        if (role === 'invitee') inviteeToken = signInData.session.access_token;
      } else {
        // Store token for new user
        if (role === 'admin') adminToken = authData.session.access_token;
        if (role === 'member') memberToken = authData.session.access_token;
        if (role === 'invitee') inviteeToken = authData.session.access_token;
      }
    }

    // Create a test club as admin
    console.log('Creating test club...');
    const clubData = {
      name: 'Invitation Test Club',
      type: 'sports',
      description: 'A club for testing invitation functionality',
    };

    const clubResponse = await apiRequest(
      'POST',
      '/clubs',
      clubData,
      adminToken,
    );
    testClubId = clubResponse.data.id;
    console.log(`✅ Test club created with ID: ${testClubId}`);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

/**
 * Test email invitation functionality
 */
async function testEmailInvitation() {
  console.log('\n📧 Testing email invitation...');

  try {
    // Test 1: Admin invites user by email
    console.log('1. Admin inviting user by email...');
    const inviteResponse = await apiRequest(
      'POST',
      `/clubs/${testClubId}/invite-email`,
      {
        email: testUsers.invitee.email,
        role: 'member',
      },
      adminToken,
    );

    testInvitationId = inviteResponse.data.id;
    console.log('✅ Email invitation sent successfully');
    console.log(`   Invitation ID: ${testInvitationId}`);

    // Test 2: Try to invite same email again (should fail)
    console.log('2. Testing duplicate invitation prevention...');
    try {
      await apiRequest(
        'POST',
        `/clubs/${testClubId}/invite-email`,
        {
          email: testUsers.invitee.email,
          role: 'member',
        },
        adminToken,
      );
      console.log('❌ Should have failed with duplicate invitation error');
    } catch (error) {
      if (error.message.includes('already been sent')) {
        console.log('✅ Correctly prevented duplicate invitation');
      } else {
        throw error;
      }
    }

    // Test 3: Non-admin tries to invite (should fail)
    console.log('3. Testing admin permission requirement...');
    try {
      await apiRequest(
        'POST',
        `/clubs/${testClubId}/invite-email`,
        {
          email: 'another@test.com',
          role: 'member',
        },
        memberToken,
      );
      console.log('❌ Should have failed with permission error');
    } catch (error) {
      if (error.message.includes('admin')) {
        console.log('✅ Correctly enforced admin permission');
      } else {
        throw error;
      }
    }

    // Test 4: Get club invitations (admin only)
    console.log('4. Getting club invitations...');
    const invitationsResponse = await apiRequest(
      'GET',
      `/clubs/${testClubId}/invitations`,
      null,
      adminToken,
    );
    console.log(
      '✅ Retrieved club invitations:',
      invitationsResponse.data.length,
    );

    // Test 5: Get user's pending invitations
    console.log('5. Getting user pending invitations...');
    const userInvitationsResponse = await apiRequest(
      'GET',
      '/clubs/my-invitations',
      null,
      inviteeToken,
    );
    console.log(
      '✅ Retrieved user invitations:',
      userInvitationsResponse.data.length,
    );

    // Test 6: Accept email invitation
    console.log('6. Accepting email invitation...');
    const acceptResponse = await apiRequest(
      'POST',
      `/clubs/${testClubId}/accept-invitation`,
      null,
      inviteeToken,
    );
    console.log('✅ Email invitation accepted successfully');
  } catch (error) {
    console.error('❌ Email invitation test failed:', error.message);
    throw error;
  }
}

/**
 * Test invite code functionality
 */
async function testInviteCode() {
  console.log('\n🔗 Testing invite code...');

  try {
    // Test 1: Generate invite code
    console.log('1. Generating invite code...');
    const codeResponse = await apiRequest(
      'POST',
      `/clubs/${testClubId}/invite-code`,
      {
        role: 'admin',
      },
      adminToken,
    );
    testInviteCodeValue = codeResponse.data.invite_code;
    console.log('✅ Invite code generated successfully');
    console.log(`   Invite code: ${testInviteCodeValue}`);

    // Test 2: Accept invite code
    console.log('2. Accepting invite code...');
    const acceptCodeResponse = await apiRequest(
      'POST',
      `/clubs/join/${testInviteCode}`,
      null,
      memberToken,
    );
    console.log('✅ Invite code accepted successfully');
    console.log(`   New member role: ${acceptCodeResponse.data.role}`);

    // Test 3: Try to use same code again (should fail)
    console.log('3. Testing single-use code restriction...');
    try {
      await apiRequest(
        'POST',
        `/clubs/join/${testInviteCode}`,
        null,
        adminToken,
      );
      console.log('❌ Should have failed with invalid/expired code error');
    } catch (error) {
      if (error.message.includes('Invalid or expired')) {
        console.log('✅ Correctly enforced single-use restriction');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Invite code test failed:', error.message);
    throw error;
  }
}

/**
 * Test invitation management
 */
async function testInvitationManagement() {
  console.log('\n🛠️ Testing invitation management...');

  try {
    // Create a new invitation to cancel
    console.log('1. Creating invitation to cancel...');
    const inviteResponse = await apiRequest(
      'POST',
      `/clubs/${testClubId}/invite-email`,
      {
        email: 'cancel@test.com',
        role: 'member',
      },
      adminToken,
    );

    const cancelInvitationId = inviteResponse.data.id;

    // Test cancel invitation
    console.log('2. Cancelling invitation...');
    await apiRequest(
      'DELETE',
      `/clubs/invitations/${cancelInvitationId}`,
      null,
      adminToken,
    );
    console.log('✅ Invitation cancelled successfully');

    // Verify invitation is gone
    console.log('3. Verifying invitation removal...');
    const invitationsResponse = await apiRequest(
      'GET',
      `/clubs/${testClubId}/invitations`,
      null,
      adminToken,
    );
    const foundCancelled = invitationsResponse.data.find(
      (inv) => inv.id === cancelInvitationId,
    );

    if (!foundCancelled) {
      console.log('✅ Invitation successfully removed');
    } else {
      console.log('❌ Invitation should have been removed');
    }
  } catch (error) {
    console.error('❌ Invitation management test failed:', error.message);
    throw error;
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    if (testClubId && adminToken) {
      await apiRequest('DELETE', `/clubs/${testClubId}`, null, adminToken);
      console.log('✅ Test club deleted');
    }
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting BE-9-10 Club Invitations Tests\n');

  try {
    await setupTestData();
    await testEmailInvitation();
    await testInviteCode();
    await testInvitationManagement();

    console.log('\n🎉 All tests passed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  setupTestData,
  testEmailInvitation,
  testInviteCode,
  testInvitationManagement,
  cleanup,
};
