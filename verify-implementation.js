#!/usr/bin/env node

/**
 * Verification Script for Deferred/Rejected Status Implementation
 * Run this to check if the database migration and code changes are working
 */

const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function verify() {
  console.log('\n' + colors.blue + '🔍 Starting Verification...' + colors.reset + '\n');

  const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL || "", {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test 1: Check if database connection works
    console.log('📡 Test 1: Database Connection');
    const connectionTest = await sql`SELECT NOW() as current_time`;
    console.log(colors.green + '✓ Database connection successful' + colors.reset);
    console.log(`  Current time: ${connectionTest[0].current_time}\n`);

    // Test 2: Check if new columns exist
    console.log('📋 Test 2: Check New Columns');
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'goodhive'
        AND table_name = 'users'
        AND (
          column_name LIKE '%deferred%'
          OR column_name LIKE '%status_reason%'
          OR column_name LIKE '%status_updated%'
        )
      ORDER BY column_name
    `;

    if (columns.length > 0) {
      console.log(colors.green + `✓ Found ${columns.length} new columns:` + colors.reset);
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log(colors.yellow + '⚠ No new columns found - migration may not be applied yet' + colors.reset);
      console.log(colors.yellow + '  Run: psql $DATABASE_URL -f database/migrations/add_deferred_rejected_statuses.sql' + colors.reset);
    }
    console.log('');

    // Test 3: Check if constraints allow new statuses
    console.log('🔒 Test 3: Check Status Constraints');
    const constraints = await sql`
      SELECT
        constraint_name,
        check_clause
      FROM information_schema.check_constraints
      WHERE constraint_schema = 'goodhive'
        AND constraint_name LIKE 'check_%_status'
      ORDER BY constraint_name
    `;

    if (constraints.length > 0) {
      constraints.forEach(c => {
        const hasDeferred = c.check_clause.includes('deferred');
        const hasRejected = c.check_clause.includes('rejected');
        const status = hasDeferred && hasRejected ? colors.green + '✓' : colors.yellow + '⚠';
        console.log(`${status} ${c.constraint_name}${colors.reset}`);
        if (!hasDeferred || !hasRejected) {
          console.log(colors.yellow + `  Missing: ${!hasDeferred ? 'deferred ' : ''}${!hasRejected ? 'rejected' : ''}` + colors.reset);
        }
      });
    } else {
      console.log(colors.red + '✗ No status constraints found' + colors.reset);
    }
    console.log('');

    // Test 4: Check sample data with new fields
    console.log('📊 Test 4: Sample Data with New Fields');
    const sampleData = await sql`
      SELECT
        t.first_name,
        t.last_name,
        t.mentor,
        u.mentor_status,
        u.mentor_deferred_until,
        u.mentor_status_reason
      FROM goodhive.talents t
      LEFT JOIN goodhive.users u ON t.user_id = u.userid
      WHERE t.mentor = true
      LIMIT 5
    `;

    if (sampleData.length > 0) {
      console.log(colors.green + `✓ Found ${sampleData.length} mentor applicants:` + colors.reset);
      sampleData.forEach(user => {
        const statusColor =
          user.mentor_status === 'approved' ? colors.green :
          user.mentor_status === 'pending' ? colors.yellow :
          user.mentor_status === 'deferred' ? colors.blue :
          user.mentor_status === 'rejected' ? colors.red :
          colors.reset;
        console.log(`  ${user.first_name} ${user.last_name}: ${statusColor}${user.mentor_status || 'null'}${colors.reset}`);
      });
    } else {
      console.log(colors.yellow + '⚠ No mentor applicants found in database' + colors.reset);
    }
    console.log('');

    // Test 5: Count users by status
    console.log('📈 Test 5: User Status Distribution');
    const statusCounts = await sql`
      SELECT
        mentor_status,
        COUNT(*) as count
      FROM goodhive.users
      WHERE mentor_status IS NOT NULL
      GROUP BY mentor_status
      ORDER BY count DESC
    `;

    if (statusCounts.length > 0) {
      console.log(colors.green + '✓ Status distribution:' + colors.reset);
      statusCounts.forEach(s => {
        const statusColor =
          s.mentor_status === 'approved' ? colors.green :
          s.mentor_status === 'pending' ? colors.yellow :
          s.mentor_status === 'deferred' ? colors.blue :
          s.mentor_status === 'rejected' ? colors.red :
          colors.reset;
        console.log(`  ${statusColor}${s.mentor_status}: ${s.count}${colors.reset}`);
      });
    }
    console.log('');

    // Summary
    console.log(colors.blue + '━'.repeat(50) + colors.reset);
    console.log(colors.green + '✅ Verification Complete!' + colors.reset);
    console.log(colors.blue + '━'.repeat(50) + colors.reset);

    if (columns.length === 0) {
      console.log('\n' + colors.yellow + '⚠️  ACTION REQUIRED:' + colors.reset);
      console.log('   The database migration has NOT been applied yet.');
      console.log('   Please run:');
      console.log(colors.blue + '   psql "$DATABASE_URL" -f database/migrations/add_deferred_rejected_statuses.sql' + colors.reset);
    } else {
      console.log('\n' + colors.green + '✓ Everything looks good! The implementation is ready to use.' + colors.reset);
      console.log('\nNext steps:');
      console.log('1. Start dev server: npm run dev');
      console.log('2. Navigate to: http://localhost:3000/admin/talents');
      console.log('3. Check the "Mentor Status" filter for new options');
    }

  } catch (error) {
    console.error(colors.red + '\n❌ Verification failed:' + colors.reset);
    console.error(error);

    if (error.message?.includes('connect')) {
      console.log('\n' + colors.yellow + '💡 Tip: Make sure your .env.local file has DATABASE_URL or POSTGRES_URL set' + colors.reset);
    }
  } finally {
    await sql.end();
  }
}

// Run verification
verify().catch(console.error);
