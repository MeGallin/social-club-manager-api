// Simple user creation for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function createTestUser(email, password, fullName) {
  console.log(`\nCreating user: ${email}`);

  try {
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.log(`❌ Signup failed: ${error.message}`);

      // Try to sign in if user already exists
      if (
        error.message.includes('already') ||
        error.message.includes('exists')
      ) {
        console.log(`Trying to sign in existing user...`);
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

        if (signInError) {
          console.log(`❌ Sign in failed: ${signInError.message}`);
          return null;
        }

        console.log(`✅ Successfully signed in: ${email}`);
        return signInData.session.access_token;
      }
      return null;
    }

    if (data.session) {
      console.log(`✅ Successfully created: ${email}`);
      return data.session.access_token;
    } else {
      console.log(
        `⚠️ User created but email confirmation may be required: ${email}`,
      );

      // Try to sign in to get token
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (signInError) {
        console.log(`❌ Sign in after creation failed: ${signInError.message}`);
        return null;
      }

      console.log(`✅ Successfully signed in after creation: ${email}`);
      return signInData.session.access_token;
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🔄 Creating test users for BE-9-10 invitation tests...\n');

  const users = [
    {
      email: 'testadmin@example.com',
      password: 'testpass123',
      fullName: 'Test Admin',
    },
    {
      email: 'testmember@example.com',
      password: 'testpass123',
      fullName: 'Test Member',
    },
    {
      email: 'testinvitee@example.com',
      password: 'testpass123',
      fullName: 'Test Invitee',
    },
  ];

  const tokens = {};

  for (const user of users) {
    const token = await createTestUser(
      user.email,
      user.password,
      user.fullName,
    );
    if (token) {
      tokens[user.email] = token;
    }
  }

  console.log('\n📊 Summary:');
  console.log(
    `Created/authenticated ${Object.keys(tokens).length} out of ${users.length} users`,
  );

  if (Object.keys(tokens).length === users.length) {
    console.log(
      '\n✅ All test users ready! You can now run the invitation tests.',
    );
    console.log('Run: node scripts/test-be-9-10-invitations.js');
  } else {
    console.log(
      '\n❌ Some users failed to create. Check Supabase configuration.',
    );
  }
}

main().catch(console.error);
