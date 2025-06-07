// Test Registration Helper with Auto Email Confirmation
// This script registers users and immediately confirms their emails

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:8000/api';

// Create admin client for email confirmation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Register user and automatically confirm email
 * @param {Object} userData - User registration data
 */
async function registerAndConfirmUser(userData) {
  const { email, password, full_name } = userData;

  try {
    console.log(`🔄 Registering and confirming: ${email}`);

    // Step 1: Register user via API
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      full_name,
      consent: true,
    });

    console.log(`✅ User registered: ${email}`);

    // Step 2: Confirm email using admin client
    const {
      data: { users },
      error: getUserError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      throw new Error(`Failed to list users: ${getUserError.message}`);
    }

    const user = users.find((u) => u.email === email);

    if (user) {
      const { error: confirmError } =
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });

      if (confirmError) {
        console.warn(
          `⚠️  Could not confirm email for ${email}: ${confirmError.message}`,
        );
      } else {
        console.log(`✅ Email confirmed for: ${email}`);
      }
    }

    // Step 3: Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    console.log(`✅ Login successful for: ${email}`);

    return {
      success: true,
      user: loginResponse.data.data.user,
      token: loginResponse.data.data.access_token,
      registerData: registerResponse.data,
      loginData: loginResponse.data,
    };
  } catch (error) {
    console.error(
      `❌ Failed for ${email}:`,
      error.response?.data?.error || error.message,
    );
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Register all test users with confirmation
 */
async function registerAllTestUsers() {
  console.log('👤 Registering Test Users with Email Confirmation');
  console.log('=================================================');

  const testUsers = [
    {
      email: 'testadmin@tws.com',
      password: 'testpass123',
      full_name: 'Test Admin',
    },
    {
      email: 'testmember@tws.com',
      password: 'testpass123',
      full_name: 'Test Member',
    },
    {
      email: 'testinvitee@tws.com',
      password: 'testpass123',
      full_name: 'Test Invitee',
    },
  ];

  const results = {};

  for (const userData of testUsers) {
    const result = await registerAndConfirmUser(userData);
    results[userData.email] = result;
    console.log(''); // Add spacing
  }

  // Display summary
  console.log('📊 Registration Summary');
  console.log('========================');

  for (const [email, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${email} - Ready for testing`);
      console.log(`   Token: ${result.token.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${email} - Failed: ${result.error}`);
    }
  }

  const successCount = Object.values(results).filter((r) => r.success).length;
  console.log(
    `\n🎯 ${successCount}/${testUsers.length} users ready for testing`,
  );

  if (successCount === testUsers.length) {
    console.log(
      '🎉 All test users are ready! You can now proceed with the Postman testing guide.',
    );
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  registerAllTestUsers().catch(console.error);
}

module.exports = { registerAndConfirmUser, registerAllTestUsers };
