// Email Confirmation Helper for Testing
// This script confirms email addresses using the admin client

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client with service role key
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
 * Confirm email for a specific user
 * @param {string} email - User email to confirm
 */
async function confirmUserEmail(email) {
  try {
    console.log(`🔄 Confirming email for: ${email}`);

    // Get user by email
    const {
      data: { users },
      error: getUserError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      throw new Error(`Failed to list users: ${getUserError.message}`);
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    // Update user to confirm email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
      },
    );

    if (error) {
      throw new Error(`Failed to confirm email: ${error.message}`);
    }

    console.log(`✅ Email confirmed for: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to confirm email for ${email}:`, error.message);
    return false;
  }
}

/**
 * Confirm emails for all test users
 */
async function confirmAllTestEmails() {
  console.log('📧 Confirming Test User Emails');
  console.log('===============================');

  const testEmails = [
    'testadmin@tws.com',
    'testmember@tws.com',
    'testinvitee@tws.com',
  ];

  let allConfirmed = true;

  for (const email of testEmails) {
    const confirmed = await confirmUserEmail(email);
    if (!confirmed) {
      allConfirmed = false;
    }
  }

  if (allConfirmed) {
    console.log('\n🎉 All test emails have been confirmed!');
    console.log('You can now proceed with login in Postman.');
  } else {
    console.log(
      '\n⚠️  Some emails could not be confirmed. Check the errors above.',
    );
  }
}

// Run if called directly
if (require.main === module) {
  confirmAllTestEmails().catch(console.error);
}

module.exports = { confirmUserEmail, confirmAllTestEmails };
