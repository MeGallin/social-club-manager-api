#!/usr/bin/env node

/**
 * BE-5 Consent Handling Test Script
 * Tests the GDPR consent functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const TEST_EMAIL = 'test-consent@tws.com';
const TEST_PASSWORD = 'TestPass123!';

async function testConsentHandling() {
  console.log('🧪 Testing BE-5 GDPR/Privacy Consent Handling\n');

  try {
    // Test 1: Registration without consent (should fail)
    console.log('1. Testing registration WITHOUT consent...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: `no-consent-${Date.now()}@tws.com`,
        password: TEST_PASSWORD,
        full_name: 'No Consent User',
      });
      console.log('❌ FAIL: Registration should have been blocked');
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes('consent')
      ) {
        console.log('✅ PASS: Registration correctly blocked without consent');
      } else {
        console.log('❌ FAIL: Unexpected error:', error.response?.data);
      }
    }

    // Test 2: Registration with consent = false (should fail)
    console.log('\n2. Testing registration with consent = false...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: `false-consent-${Date.now()}@tws.com`,
        password: TEST_PASSWORD,
        full_name: 'False Consent User',
        consent: false,
      });
      console.log('❌ FAIL: Registration should have been blocked');
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes('consent')
      ) {
        console.log(
          '✅ PASS: Registration correctly blocked with consent = false',
        );
      } else {
        console.log('❌ FAIL: Unexpected error:', error.response?.data);
      }
    }

    // Test 3: Registration with consent = true (should succeed)
    console.log('\n3. Testing registration with consent = true...');
    const uniqueEmail = `consent-${Date.now()}@tws.com`;
    let accessToken = null;

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: uniqueEmail,
        password: TEST_PASSWORD,
        full_name: 'Consent User',
        consent: true,
      });

      if (response.status === 201 && response.data.success) {
        accessToken = response.data.data.access_token;
        console.log('✅ PASS: Registration successful with consent = true');
      } else {
        console.log('❌ FAIL: Unexpected response:', response.data);
      }
    } catch (error) {
      console.log(
        '❌ FAIL: Registration failed:',
        error.response?.data || error.message,
      );
    }

    // Test 4: Get consent status (requires JWT)
    if (accessToken) {
      console.log('\n4. Testing GET consent status...');
      try {
        const response = await axios.get(`${BASE_URL}/api/profile/consent`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 200 && response.data.data.consent === true) {
          console.log('✅ PASS: Consent status retrieved correctly');
        } else {
          console.log('❌ FAIL: Unexpected consent status:', response.data);
        }
      } catch (error) {
        console.log(
          '❌ FAIL: Get consent failed:',
          error.response?.data || error.message,
        );
      }

      // Test 5: Update consent status
      console.log('\n5. Testing PUT consent status...');
      try {
        const response = await axios.put(
          `${BASE_URL}/api/profile/consent`,
          { consent: false },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (response.status === 200 && response.data.data.consent === false) {
          console.log('✅ PASS: Consent status updated successfully');
        } else {
          console.log('❌ FAIL: Unexpected update response:', response.data);
        }
      } catch (error) {
        console.log(
          '❌ FAIL: Update consent failed:',
          error.response?.data || error.message,
        );
      }
    }

    // Test 6: Access consent endpoint without JWT (should fail)
    console.log('\n6. Testing consent endpoint without JWT...');
    try {
      await axios.get(`${BASE_URL}/api/profile/consent`);
      console.log('❌ FAIL: Should have been unauthorized');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PASS: Correctly requires authentication');
      } else {
        console.log('❌ FAIL: Unexpected error:', error.response?.data);
      }
    }

    console.log('\n🎉 BE-5 Consent Handling Tests Complete!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if server is available
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running, starting tests...\n');
    await testConsentHandling();
  } catch (error) {
    console.log('❌ Server is not running on port 8000');
    console.log('Please start the server with: npm start');
  }
}

checkServer();
