#!/usr/bin/env node

/**
 * Quick script to test Airtable connection and list tables/records
 */

const Airtable = require('airtable');

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID || 'app8JaoSpgzzKFYRN';

if (!apiKey) {
  throw new Error('AIRTABLE_API_KEY is not set. Add it to .env.local or export it in your shell.');
}

Airtable.configure({ apiKey });
const base = Airtable.base(baseId);

async function listTables() {
  console.log('\n📊 Airtable Base:', baseId);
  console.log('='.repeat(50));
  
  // Airtable API doesn't have a direct way to list tables
  // We need to know table names. Let's try common ones or get schema from first record
  console.log('\n⚠️  Airtable API doesn\'t support listing tables directly.');
  console.log('You need to know the table names. Common ones might be:');
  console.log('- Jobs, Companies, Talents, Users, etc.\n');
}

async function getTableInfo(tableName) {
  try {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('-'.repeat(50));
    
    // Get first record to see schema
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      console.log(`   ⚠️  Table "${tableName}" is empty or doesn't exist`);
      return;
    }
    
    // Show fields
    const fields = Object.keys(records[0].fields);
    console.log(`   Fields (${fields.length}):`, fields.join(', '));
    
    // Get total count
    const allRecords = await base(tableName).select().all();
    console.log(`   Total Records: ${allRecords.length}`);
    
    // Show first record sample
    console.log(`\n   Sample Record:`);
    console.log(JSON.stringify(records[0].fields, null, 2));
    
  } catch (error) {
    if (error.message.includes('Could not find table')) {
      console.log(`   ❌ Table "${tableName}" not found`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function listRecords(tableName, maxRecords = 5) {
  try {
    console.log(`\n📝 Records from "${tableName}" (showing first ${maxRecords}):`);
    console.log('-'.repeat(50));
    
    const records = await base(tableName)
      .select({ maxRecords })
      .all();
    
    if (records.length === 0) {
      console.log('   No records found');
      return;
    }
    
    records.forEach((record, index) => {
      console.log(`\n   Record ${index + 1} (ID: ${record.id}):`);
      console.log(JSON.stringify(record.fields, null, 4));
    });
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  await listTables();
  
  // Try common table names
  const commonTables = ['Jobs', 'Companies', 'Talents', 'Users', 'Job Offers', 'Applications'];
  
  console.log('\n🔍 Trying to find tables...\n');
  
  for (const tableName of commonTables) {
    await getTableInfo(tableName);
  }
  
  // If user provided table name as argument, list its records
  const tableName = process.argv[2];
  if (tableName) {
    await listRecords(tableName, 10);
  }
}

main().catch(console.error);
