# Supabase to PostgreSQL Migration Guide

This directory contains scripts and tools to migrate data from Supabase to a self-hosted PostgreSQL database.

## 📋 Overview

- **Export Script**: Exports all data from Supabase to JSON files
- **Import Script**: Imports JSON data into PostgreSQL
- **Schema Files**: Located in `../supabase/migrations/` directory

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd database-migration
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual credentials
nano .env  # or use your preferred editor
```

### 3. Export Data from Supabase

```bash
npm run export
```

This will:
- Connect to your Supabase database
- Export all tables to JSON files in `exported-data/`
- Generate schema information and import templates

### 4. Set Up PostgreSQL Database

```bash
# Create a new database
createdb ricos_tacos

# Run all migration files to create schema
psql ricos_tacos -f ../supabase/migrations/20251029232720_40de5a3a-9378-4adb-9012-c6a61bedb402.sql
# ... run other migration files in order
```

**Tip**: You can run all migrations at once:
```bash
for file in ../supabase/migrations/*.sql; do
  echo "Running $file..."
  psql ricos_tacos -f "$file"
done
```

### 5. Import Data to PostgreSQL

```bash
npm run import
```

This will:
- Connect to your PostgreSQL database
- Import all data from JSON files
- Use transactions for data integrity
- Provide detailed progress and summary

## 📁 Directory Structure

```
database-migration/
├── export-supabase-data.js   # Export script
├── import-to-postgres.js     # Import script
├── package.json              # Node.js dependencies
├── .env.example              # Environment template
├── .env                      # Your credentials (gitignored)
├── README.md                 # This file
└── exported-data/            # Generated after export
    ├── orders.json           # Orders table data
    ├── admin_users.json      # Admin users data
    ├── coupons.json          # Coupons data
    ├── schema-info.json      # Schema metadata
    ├── import-template.sql   # SQL template
    └── README.md             # Export-specific docs
```

## 🔧 Configuration

### Environment Variables

Edit `.env` with your configuration:

```bash
# PostgreSQL (Target Database)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ricos_tacos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Supabase (Source Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here
```

### Tables to Export

Edit `export-supabase-data.js` to add/remove tables:

```javascript
const TABLES_TO_EXPORT = [
  'orders',
  'admin_users',
  'user_roles',
  'profiles',
  'coupons',
  // Add your tables here
];
```

## 🔍 Verification Steps

### After Export

```bash
# Check exported data
ls -lh exported-data/
cat exported-data/schema-info.json
```

### After Import

```bash
# Connect to PostgreSQL
psql ricos_tacos

# Verify row counts
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons;

# Check sample data
SELECT * FROM orders LIMIT 5;
SELECT * FROM admin_users;
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Table does not exist" during export

**Cause**: Table doesn't exist in Supabase or name is incorrect

**Solution**: 
- Check table names in Supabase dashboard
- Update `TABLES_TO_EXPORT` array
- Verify RLS policies allow reading

#### 2. "Connection refused" during import

**Cause**: PostgreSQL not running or wrong credentials

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Verify connection manually
psql -h localhost -U postgres -d ricos_tacos
```

#### 3. "Duplicate key error" during import

**Cause**: Data already exists in PostgreSQL

**Solution**:
```sql
-- Clear existing data if needed
TRUNCATE orders, admin_users, coupons CASCADE;
```

The import script uses `ON CONFLICT DO NOTHING` to skip duplicates by default.

#### 4. "JSON parse error"

**Cause**: Corrupted export file

**Solution**:
- Delete `exported-data/` directory
- Run export again
- Check disk space

## 📊 Data Validation

After migration, validate data integrity:

```sql
-- Check for NULL values in required fields
SELECT COUNT(*) FROM orders WHERE customer_name IS NULL;
SELECT COUNT(*) FROM orders WHERE total IS NULL;

-- Verify JSON columns
SELECT items FROM orders WHERE jsonb_typeof(items::jsonb) != 'array' LIMIT 5;

-- Check foreign key relationships (if any)
SELECT o.id, o.customer_email, p.email 
FROM orders o 
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.user_id IS NOT NULL AND p.id IS NULL;

-- Verify date ranges
SELECT MIN(created_at), MAX(created_at) FROM orders;
```

## 🔐 Security Considerations

1. **Sensitive Data**: Export files contain sensitive customer data
   - Keep `exported-data/` secure
   - Add to `.gitignore` (already done)
   - Delete after successful migration

2. **Credentials**: Never commit `.env` file
   - Only commit `.env.example`
   - Use strong passwords for PostgreSQL

3. **Backup**: Always backup before migration
```bash
# Backup Supabase (before migration)
npm run export

# Backup PostgreSQL (after migration)
pg_dump ricos_tacos > backup-$(date +%Y%m%d).sql
```

## 🔄 Rollback Procedure

If migration fails:

### 1. From JSON Backup
```bash
# Re-import from exported JSON files
npm run import
```

### 2. From SQL Backup
```bash
# Restore from pg_dump
psql ricos_tacos < backup-20231119.sql
```

### 3. Revert to Supabase
- Update application connection strings back to Supabase
- Supabase data remains unchanged

## 📈 Migration Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env` file
- [ ] Run export script
- [ ] Verify exported data
- [ ] Set up PostgreSQL database
- [ ] Run schema migrations
- [ ] Run import script
- [ ] Validate data integrity
- [ ] Update application database config
- [ ] Test application with new database
- [ ] Monitor for errors
- [ ] Backup both databases
- [ ] Document any issues
- [ ] Plan cutover window
- [ ] Communicate with team

## 🚦 Production Migration Strategy

### Pre-Migration
1. Schedule maintenance window
2. Notify users of downtime
3. Create full Supabase backup
4. Test migration on staging environment
5. Prepare rollback plan

### During Migration
1. Put application in maintenance mode
2. Export latest data from Supabase
3. Import to PostgreSQL
4. Validate data
5. Update application connection strings
6. Restart application services

### Post-Migration
1. Monitor application logs
2. Verify all features work
3. Check performance metrics
4. Keep Supabase data for 30 days
5. Document lessons learned

## 📞 Support

For issues or questions:
1. Check this README first
2. Review error messages carefully
3. Check PostgreSQL and Node.js logs
4. Verify all prerequisites are met

## 📝 Notes

- Export script can be run multiple times safely
- Import script uses transactions (all-or-nothing)
- UUIDs and timestamps are preserved
- JSONB columns are handled automatically
- Foreign key constraints must be satisfied

## 🎯 Next Steps After Migration

1. **Update Application Code**
   ```javascript
   // Old (Supabase)
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(url, key)
   
   // New (PostgreSQL with pg or Prisma)
   import pg from 'pg'
   const pool = new pg.Pool({ connectionString })
   ```

2. **Update Environment Variables**
   - Remove Supabase variables
   - Add PostgreSQL connection string

3. **Test All Features**
   - User authentication
   - Data CRUD operations
   - File uploads (if any)
   - Real-time features (needs different solution)

4. **Monitor Performance**
   - Query response times
   - Connection pool usage
   - Database size growth

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase to Self-Hosted Guide](https://supabase.com/docs/guides/self-hosting)
- [Node.js pg Library](https://node-postgres.com/)
- [Database Migration Best Practices](https://www.postgresql.org/docs/current/backup.html)

---

**Last Updated**: November 19, 2025
**Version**: 1.0.0
