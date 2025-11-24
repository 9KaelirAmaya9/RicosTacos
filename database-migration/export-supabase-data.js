/**
 * Supabase Data Export Script
 * 
 * This script exports all data from Supabase tables to JSON files
 * for migration to PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kivdqjyvahabsgqtszie.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmRxanl2YWhhYnNncXRzemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjgxNzUsImV4cCI6MjA3NzM0NDE3NX0.lA2GvgQJOad0iORWwOg2if_r7QX0CnkH3S8uzWECKfo';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Output directory for exported data
const OUTPUT_DIR = path.join(__dirname, 'exported-data');

// Tables to export (add more as needed)
const TABLES_TO_EXPORT = [
  'orders',
  'admin_users',
  'user_roles',
  'profiles',
  'coupons',
  // Add any other tables you have
];

/**
 * Create output directory if it doesn't exist
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Export data from a specific table
 */
async function exportTable(tableName) {
  try {
    console.log(`\n📊 Exporting table: ${tableName}...`);
    
    // Fetch all data from the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    if (error) {
      // If table doesn't exist, skip it
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log(`⚠️  Table '${tableName}' does not exist - skipping`);
        return { tableName, status: 'skipped', reason: 'table not found' };
      }
      throw error;
    }

    // Save data to JSON file
    const filename = `${tableName}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const exportData = {
      table: tableName,
      exported_at: new Date().toISOString(),
      row_count: data?.length || 0,
      total_count: count,
      data: data || []
    };

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Exported ${data?.length || 0} rows from '${tableName}' to ${filename}`);
    
    return {
      tableName,
      status: 'success',
      rowCount: data?.length || 0,
      filepath
    };
  } catch (error) {
    console.error(`❌ Error exporting table '${tableName}':`, error.message);
    return {
      tableName,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Export database schema information
 */
async function exportSchema() {
  try {
    console.log(`\n📋 Exporting schema information...`);
    
    // You can enhance this to get actual schema from Supabase
    // For now, we'll create a basic schema file based on migrations
    const schemaInfo = {
      exported_at: new Date().toISOString(),
      database_url: SUPABASE_URL,
      tables: TABLES_TO_EXPORT,
      notes: [
        'This is a data export from Supabase',
        'Migration files contain the full schema',
        'Review supabase/migrations/*.sql for complete table definitions',
        'Ensure all foreign key constraints are handled during import'
      ]
    };

    const filepath = path.join(OUTPUT_DIR, 'schema-info.json');
    fs.writeFileSync(filepath, JSON.stringify(schemaInfo, null, 2));
    
    console.log(`✅ Schema information saved to schema-info.json`);
  } catch (error) {
    console.error(`❌ Error exporting schema:`, error.message);
  }
}

/**
 * Create import SQL script for PostgreSQL
 */
function createImportScript(results) {
  const successfulExports = results.filter(r => r.status === 'success');
  
  let sqlScript = `-- PostgreSQL Import Script
-- Generated: ${new Date().toISOString()}
-- 
-- Instructions:
-- 1. Ensure your PostgreSQL database has the correct schema (run migration files first)
-- 2. Run this script to import the data
-- 3. Adjust paths to JSON files as needed
--

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

BEGIN;

`;

  successfulExports.forEach(result => {
    sqlScript += `
-- Import ${result.tableName} data
-- You'll need to write custom COPY or INSERT statements based on your table structure
-- Example for ${result.tableName}:
-- COPY ${result.tableName} FROM '${result.filepath}' WITH (FORMAT json);
-- Or use a tool like pg_restore or custom import script

`;
  });

  sqlScript += `
COMMIT;

-- Note: This is a template. You'll need to create proper INSERT statements
-- or use a PostgreSQL JSON import tool to load the data from JSON files.
`;

  const filepath = path.join(OUTPUT_DIR, 'import-template.sql');
  fs.writeFileSync(filepath, sqlScript);
  console.log(`\n📝 Import template saved to import-template.sql`);
}

/**
 * Create README for the export
 */
function createReadme(results) {
  const successfulExports = results.filter(r => r.status === 'success');
  const skippedTables = results.filter(r => r.status === 'skipped');
  const failedExports = results.filter(r => r.status === 'error');

  let readme = `# Supabase Data Export

Export Date: ${new Date().toISOString()}
Source: ${SUPABASE_URL}

## Export Summary

- **Successful Exports:** ${successfulExports.length} tables
- **Skipped Tables:** ${skippedTables.length} (table not found)
- **Failed Exports:** ${failedExports.length}

## Exported Tables

${successfulExports.map(r => `- **${r.tableName}**: ${r.rowCount} rows → \`${path.basename(r.filepath)}\``).join('\n')}

${skippedTables.length > 0 ? `## Skipped Tables\n\n${skippedTables.map(r => `- ${r.tableName}: ${r.reason}`).join('\n')}\n` : ''}

${failedExports.length > 0 ? `## Failed Exports\n\n${failedExports.map(r => `- ${r.tableName}: ${r.error}`).join('\n')}\n` : ''}

## Migration Steps

### 1. Prepare PostgreSQL Database

\`\`\`bash
# Create a new PostgreSQL database
createdb ricos_tacos_production

# Run schema migrations
psql ricos_tacos_production < ../supabase/migrations/*.sql
\`\`\`

### 2. Import Data

You have several options for importing the JSON data:

#### Option A: Using a Node.js Import Script (Recommended)

\`\`\`bash
# Create and run an import script
node import-to-postgres.js
\`\`\`

#### Option B: Manual Import with Custom SQL

Convert JSON to INSERT statements or use COPY with JSON format.

#### Option C: Use a Database Tool

Tools like DBeaver, pgAdmin, or DataGrip can import JSON data.

### 3. Verify Data

\`\`\`sql
-- Check row counts
SELECT 'orders' as table_name, COUNT(*) FROM orders
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;

-- Verify data integrity
SELECT * FROM orders LIMIT 5;
\`\`\`

### 4. Update Application Configuration

Update your application's database connection settings to point to the new PostgreSQL database.

## Important Notes

- ⚠️ **Backup First**: Always backup your data before migration
- 🔐 **Security**: Keep these JSON files secure as they contain sensitive data
- 🔄 **Foreign Keys**: Ensure foreign key relationships are maintained
- 📅 **Timestamps**: Verify timezone handling during import
- 🔍 **Validation**: Test thoroughly before switching production traffic

## Files in This Export

- \`schema-info.json\`: Database schema information
- \`import-template.sql\`: Template SQL script for importing
- \`*.json\`: Individual table data exports
- \`README.md\`: This file

## Next Steps

1. Review all exported JSON files
2. Create/run migration scripts on your PostgreSQL database
3. Import the data using the method of your choice
4. Validate data integrity
5. Update application configuration
6. Test thoroughly in staging environment
7. Plan production cutover

## Support

If you encounter issues during migration:
- Check PostgreSQL logs for detailed error messages
- Verify schema matches between Supabase and PostgreSQL
- Ensure all required extensions are installed
- Review foreign key constraints and sequences
`;

  const filepath = path.join(OUTPUT_DIR, 'README.md');
  fs.writeFileSync(filepath, readme);
  console.log(`📚 README created: README.md`);
}

/**
 * Main export function
 */
async function exportAllData() {
  console.log('🚀 Starting Supabase data export...\n');
  console.log(`📂 Output directory: ${OUTPUT_DIR}\n`);
  
  // Ensure output directory exists
  ensureOutputDirectory();

  // Export schema information
  await exportSchema();

  // Export all tables
  const results = [];
  for (const tableName of TABLES_TO_EXPORT) {
    const result = await exportTable(tableName);
    results.push(result);
  }

  // Create import script template
  createImportScript(results);

  // Create README
  createReadme(results);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXPORT SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'success');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'error');
  
  console.log(`✅ Successfully exported: ${successful.length} tables`);
  if (skipped.length > 0) {
    console.log(`⚠️  Skipped: ${skipped.length} tables (not found)`);
  }
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length} tables`);
  }
  
  console.log(`\n📁 All data exported to: ${OUTPUT_DIR}`);
  console.log('📚 See README.md for migration instructions\n');
}

// Run the export
exportAllData().catch(error => {
  console.error('❌ Fatal error during export:', error);
  process.exit(1);
});
