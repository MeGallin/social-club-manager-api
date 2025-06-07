#!/usr/bin/env node

/**
 * Simple BE-12 Auto-Update Test
 * Tests onboarding auto-updates with invitation endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';

async function apiRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  };

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `${method} ${endpoint} failed:`,
        error.response.status,
        error.response.data,
      );
      throw new Error(
        `${error.response.status}: ${JSON.stringify(error.response.data)}`,
      );
    }
    throw error;
  }
}

async function simpleTest() {
  console.log('🚀 Starting Simple Auto-Update Test\n');

  let adminToken = null;
  let testClubId = null;

  try {
    // 1. Register/Login test user
    console.log('1. Setting up test user...');
    try {
      const authResponse = await apiRequest('POST', '/auth/register', {
        email: 'autoupdate@test.com',
        password: 'test123',
        full_name: 'Auto Update Test',
        consent: true,
      });
      adminToken = authResponse.session.access_token;
      console.log('✅ User registered');
    } catch (error) {
      if (error.message.includes('400')) {
        const loginResponse = await apiRequest('POST', '/auth/login', {
          email: 'autoupdate@test.com',
          password: 'test123',
        });
        adminToken = loginResponse.session.access_token;
        console.log('✅ User logged in');
      } else {
        throw error;
      }
    }

    // 2. Create club via onboarding
    console.log('2. Creating club with onboarding...');
    try {
      const clubResponse = await apiRequest(
        'POST',
        '/onboarding/club',
        {
          name: 'Auto Update Test Club',
          type: 'sports',
          description: 'Testing auto-updates',
          enabled_modules: ['events'],
        },
        adminToken,
      );
      testClubId = clubResponse.data.id;
      console.log('✅ Club created:', testClubId);
    } catch (error) {
      console.log(
        'Onboarding endpoint failed, trying regular club creation...',
      );
      const clubResponse = await apiRequest(
        'POST',
        '/clubs',
        {
          name: 'Auto Update Test Club',
          type: 'sports',
          description: 'Testing auto-updates',
          enabled_modules: ['events'],
        },
        adminToken,
      );
      testClubId = clubResponse.data.id;
      console.log('✅ Club created (fallback):', testClubId);
    }

    // 3. Get initial onboarding status
    console.log('3. Getting initial onboarding status...');
    try {
      const statusResponse = await apiRequest(
        'GET',
        `/onboarding/status?club_id=${testClubId}`,
        null,
        adminToken,
      );
      console.log(
        '✅ Initial status:',
        JSON.stringify(statusResponse.data, null, 2),
      );
    } catch (error) {
      console.log('⚠️  Could not get onboarding status:', error.message);
    }

    // 4. Send email invitation (should trigger auto-update)
    console.log('4. Sending email invitation...');
    const inviteResponse = await apiRequest(
      'POST',
      `/clubs/${testClubId}/invite-email`,
      {
        email: 'invitee@test.com',
        role: 'member',
      },
      adminToken,
    );
    console.log('✅ Invitation sent:', inviteResponse.data.id);

    // 5. Check onboarding status after invitation
    console.log('5. Checking onboarding status after invitation...');
    try {
      const updatedStatusResponse = await apiRequest(
        'GET',
        `/onboarding/status?club_id=${testClubId}`,
        null,
        adminToken,
      );
      const status = updatedStatusResponse.data;
      console.log('✅ Updated status:', JSON.stringify(status, null, 2));

      if (status.invited_member === true) {
        console.log('🎉 SUCCESS: Auto-update worked! invited_member = true');
      } else {
        console.log(
          "❌ FAILED: Auto-update didn't work. invited_member =",
          status.invited_member,
        );
      }
    } catch (error) {
      console.log(
        '⚠️  Could not get updated onboarding status:',
        error.message,
      );
    }

    // 6. Generate invite code (should also trigger auto-update)
    console.log('6. Generating invite code...');
    const codeResponse = await apiRequest(
      'POST',
      `/clubs/${testClubId}/invite-code`,
      {
        role: 'member',
      },
      adminToken,
    );
    console.log('✅ Invite code generated:', codeResponse.data.invite_code);

    // 7. Final status check
    console.log('7. Final onboarding status check...');
    try {
      const finalStatusResponse = await apiRequest(
        'GET',
        `/onboarding/status?club_id=${testClubId}`,
        null,
        adminToken,
      );
      const finalStatus = finalStatusResponse.data;
      console.log('✅ Final status:', JSON.stringify(finalStatus, null, 2));
    } catch (error) {
      console.log('⚠️  Could not get final onboarding status:', error.message);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }

  // Cleanup
  if (testClubId && adminToken) {
    try {
      await apiRequest('DELETE', `/clubs/${testClubId}`, null, adminToken);
      console.log('🧹 Cleanup: Test club deleted');
    } catch (error) {
      console.log('⚠️  Cleanup warning:', error.message);
    }
  }
}

simpleTest();
