// Test script for BE-8 Onboarding API validation
// This tests the validation logic without requiring actual JWT authentication

const express = require('express');
const {
  createClubOnboarding,
} = require('../src/controllers/onboardingController');

// Mock request/response objects for testing
function createMockReq(body, userId = 'test-user-123') {
  return {
    body,
    user: { id: userId },
  };
}

function createMockRes() {
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.data = data;
      return this;
    },
  };
  return res;
}

// Test Cases
async function runTests() {
  console.log('🧪 Testing BE-8 Onboarding API Validation\n');

  // Test 1: Missing name
  console.log('Test 1: Missing name field');
  const req1 = createMockReq({ type: 'hobby', enabled_modules: ['events'] });
  const res1 = createMockRes();

  try {
    await createClubOnboarding(req1, res1, () => {});
    console.log(`✅ Status: ${res1.statusCode}`);
    console.log(`✅ Response: ${JSON.stringify(res1.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: Missing enabled_modules
  console.log('Test 2: Missing enabled_modules field');
  const req2 = createMockReq({ name: 'Test Club', type: 'hobby' });
  const res2 = createMockRes();

  try {
    await createClubOnboarding(req2, res2, () => {});
    console.log(`✅ Status: ${res2.statusCode}`);
    console.log(`✅ Response: ${JSON.stringify(res2.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Empty enabled_modules array
  console.log('Test 3: Empty enabled_modules array');
  const req3 = createMockReq({
    name: 'Test Club',
    type: 'hobby',
    enabled_modules: [],
  });
  const res3 = createMockRes();

  try {
    await createClubOnboarding(req3, res3, () => {});
    console.log(`✅ Status: ${res3.statusCode}`);
    console.log(`✅ Response: ${JSON.stringify(res3.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 4: Invalid invite_emails format
  console.log('Test 4: Invalid invite_emails format (should be array)');
  const req4 = createMockReq({
    name: 'Test Club',
    type: 'hobby',
    enabled_modules: ['events'],
    invite_emails: 'not-an-array',
  });
  const res4 = createMockRes();

  try {
    await createClubOnboarding(req4, res4, () => {});
    console.log(`✅ Status: ${res4.statusCode}`);
    console.log(`✅ Response: ${JSON.stringify(res4.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  console.log('🎉 Validation tests completed!');
}

// Run the tests
runTests().catch(console.error);
