/**
 * Database Migration Runner Script
 * Usage: node scripts/migrate.js
 * Automatically executes supabase/schema.sql against the configured PostgreSQL database.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]')) {
  console.log('========================================================================');
  console.log('NOTICE: DATABASE_URL is not set with a real password in .env.');
  console.log('To apply the database schema:');
  console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/llexnyzdvqjgvlrvzdgr');
  console.log('2. Navigate to "SQL Editor"');
  console.log('3. Copy and paste the contents of "supabase/schema.sql"');
  console.log('4. Click "Run"');
  console.log('OR set DATABASE_URL=postgresql://postgres:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres in .env and rerun this script.');
  console.log('========================================================================');
  process.exit(0);
}

const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully. Reading schema SQL...');

    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../supabase/schema.sql'), 'utf-8');
    console.log('Executing schema migration...');
    await client.query(schemaSql);

    console.log('Schema migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

