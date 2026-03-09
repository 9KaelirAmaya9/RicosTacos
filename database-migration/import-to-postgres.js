/**
 * PostgreSQL Data Import Script
 * 
 * This script imports data from JSON export files into PostgreSQL
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ricos_tacos',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Directory containing exported data
const DATA_DIR = path.join(__dirname, 'exported-data');

/**
 * Import data from a JSON file into a PostgreSQL table
 */
async function importTable(tableName, client) {
  try {
    const filepath = path.join(DATA_DIR, `${tableName}.json`);
    
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  File not found: ${tableName}.json - skipping`);
      return { tableName, status: 'skipped', reason: 'file not found' };
    }

    console.log(`\n📥 Importing table: ${tableName}...`);
    
    // Read JSON file
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const exportData = JSON.parse(fileContent);
    
    if (!exportData.data || exportData.data.length === 0) {
      console.log(`⚠️  No data to import for ${tableName}`);
      return { tableName, status: 'skipped', reason: 'no data' };
    }

    const data = exportData.data;
    console.log(`   Found ${data.length} rows to import`);

    // Get column names from first row
    const columns = Object.keys(data[0]);
    
    // Build parameterized INSERT statement
    const placeholders = columns.map((_, i) => 
      `$${i + 1}`
    ).join(', ');
    
    const insertQuery = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    // Import each row
    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const values = columns.map(col => {
          const value = row[col];
          // Handle JSON/JSONB columns
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return value;
        });
        
        await client.query(insertQuery, values);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error importing row:`, error.message);
      }
    }

    console.log(`   ✅ Imported ${successCount} rows successfully`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} rows failed to import`);
    }

    return {
      tableName,
      status: 'success',
      imported: successCount,
      failed: errorCount
    };
  } catch (error) {
    console.error(`❌ Error importing table '${tableName}':`, error.message);
    return {
      tableName,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Get list of JSON files to import
 */
function getTableFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Data directory not found: ${DATA_DIR}`);
  }

  return fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json') && !file.startsWith('schema-'))
    .map(file => file.replace('.json', ''));
}

/**
 * Main import function
 */
async function importAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting PostgreSQL data import...\n');
    console.log(`📂 Data directory: ${DATA_DIR}`);
    console.log(`🗄️  Database: ${process.env.POSTGRES_DB || 'ricos_tacos'}\n`);

    // Get list of tables to import
    const tables = getTableFiles();
    console.log(`📋 Found ${tables.length} table(s) to import\n`);

    // Begin transaction
    await client.query('BEGIN');
    console.log('🔄 Transaction started\n');

    const results = [];
    
    // Import each table
    for (const tableName of tables) {
      const result = await importTable(tableName, client);
      results.push(result);
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success');
    const skipped = results.filter(r => r.status === 'skipped');
    const failed = results.filter(r => r.status === 'error');
    
    console.log(`✅ Successfully imported: ${successful.length} tables`);
    
    if (successful.length > 0) {
      const totalRows = successful.reduce((sum, r) => sum + r.imported, 0);
      console.log(`   Total rows imported: ${totalRows}`);
    }
    
    if (skipped.length > 0) {
      console.log(`⚠️  Skipped: ${skipped.length} tables`);
      skipped.forEach(r => console.log(`   - ${r.tableName}: ${r.reason}`));
    }
    
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length} tables`);
      failed.forEach(r => console.log(`   - ${r.tableName}: ${r.error}`));
    }
    
    console.log('\n✨ Import completed!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Transaction rolled back due to error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
importAllData().catch(error => {
  console.error('❌ Fatal error during import:', error);
  process.exit(1);
});
