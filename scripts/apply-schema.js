const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applySchema() {
  try {
    console.log('🔧 Initializing Supabase connection...');
    console.log(
      '📍 Supabase URL:',
      process.env.SUPABASE_URL ? 'Configured' : 'Missing',
    );
    console.log(
      '🔑 Service Role Key:',
      process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing',
    );

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      },
    );
    console.log('📖 Reading schema file...');
    const schemaPath = './scripts/be-9-10-club-invitations-schema.sql';
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('🗃️ Applying database schema...');

    // Execute the entire SQL content as one transaction
    console.log('⚡ Executing schema...');

    try {
      // Try using a raw SQL query approach
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sqlContent,
      });

      if (error) {
        console.error('❌ exec_sql error:', error);

        // Fallback: Try executing statements individually
        console.log('🔄 Trying individual statement execution...');
        await executeStatementsIndividually(supabase, sqlContent);
      } else {
        console.log('✅ Schema applied successfully via exec_sql!');
      }
    } catch (err) {
      console.log('🔄 exec_sql not available, trying alternative approach...');
      await executeStatementsIndividually(supabase, sqlContent);
    }

    // Verify the schema was applied
    console.log('\n🔍 Verifying schema application...');
    await verifySchema(supabase);

    console.log('\n🎉 Schema application completed successfully!');
  } catch (error) {
    console.error('💥 Fatal error applying schema:', error.message);
    console.error('Stack trace:', error.stack);

    console.log('\n📋 Manual Application Instructions:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log(
      '2. Copy and paste the content from: scripts/be-9-10-club-invitations-schema.sql',
    );
    console.log('3. Execute the SQL script');

    process.exit(1);
  }
}

async function executeStatementsIndividually(supabase, sqlContent) {
  const statements = sqlContent
    .split(';')
    .map((stmt) => stmt.trim())
    .filter(
      (stmt) =>
        stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('//'),
    );

  console.log(
    `📋 Found ${statements.length} SQL statements to execute individually`,
  );

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length === 0) continue;

    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
    console.log(`   ${statement.substring(0, 80)}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';',
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
}

async function verifySchema(supabase) {
  try {
    // Test if the new columns exist
    const { data, error } = await supabase
      .from('club_members')
      .select('id, email, invite_status, invite_code')
      .limit(1);

    if (error) {
      console.log('⚠️  Schema verification failed:', error.message);
      if (
        error.message.includes('column') &&
        error.message.includes('does not exist')
      ) {
        console.log(
          '❌ New columns not found - schema may not have been applied',
        );
      }
    } else {
      console.log(
        '✅ Schema verification successful - new columns are accessible',
      );
    }
  } catch (err) {
    console.log('⚠️  Could not verify schema:', err.message);
  }
}

// Run the schema application
applySchema();
