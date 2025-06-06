const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if environment variables are set
let supabase = null;
let supabaseAdmin = null;

if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key'
) {
  try {
    // Create regular client with anon key for frontend operations
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // We'll handle sessions on the frontend
        detectSessionInUrl: false,
      },
    });

    // Create admin client with service role key for backend operations
    if (
      supabaseServiceKey &&
      supabaseServiceKey !== 'your_supabase_service_role_key' &&
      supabaseServiceKey !== 'your_actual_service_role_key_here'
    ) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log(
        '✅ Supabase client and admin client initialized successfully',
      );
      console.log('   • Regular client: For auth and user-scoped operations');
      console.log('   • Admin client: For backend operations with full access');
    } else {
      console.log('✅ Supabase client initialized successfully');
      console.warn(
        '⚠️  Service role key not configured. Some backend operations may fail.',
      );
      console.warn(
        '   Add SUPABASE_SERVICE_ROLE_KEY to .env for full functionality.',
      );
    }
  } catch (error) {
    console.warn('⚠️  Failed to initialize Supabase client:', error.message);
  }
} else {
  console.warn(
    '⚠️  Supabase environment variables not set. Supabase features will be disabled.',
  );
  console.warn(
    '   Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file to enable Supabase integration.',
  );
}

// Export both clients
module.exports = supabaseAdmin || supabase;
