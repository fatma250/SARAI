# SARAI Database Migration Guide

## 🎯 Quick Start

This guide will walk you through migrating your SARAI database from the old schema to the new refactored schema.

---

## ⚠️ IMPORTANT: Before You Start

### 1. Backup Your Database

**PostgreSQL:**
```bash
pg_dump -U postgres -d SARAI_DB > backup_$(date +%Y%m%d_%H%M%S).sql
```

**SQLite:**
```bash
cp backend/sarai.db backend/sarai_backup_$(date +%Y%m%d_%H%M%S).db
```

### 2. Verify Python Environment

```bash
cd backend
python --version  # Should be Python 3.8+
pip install -r requirements.txt
```

### 3. Check Database Connection

```bash
# Test PostgreSQL connection
python -c "from app.database import engine; engine.connect(); print('✓ Connected')"
```

---

## 📋 Migration Steps

### Step 1: Create New Schema

This script creates all new tables and seeds reference data.

```bash
cd backend
python migrations/001_create_new_schema.py
```

**What it does:**
- Creates 11 new tables (organizations, sectors, sdgs, ai_technologies, tags, etc.)
- Adds new columns to existing tables
- Seeds reference data:
  - 15 sectors (Healthcare, Education, Finance, etc.)
  - 17 UN SDGs with official colors
  - 15 AI technologies (ML, DL, NLP, CV, etc.)

**Expected Output:**
```
================================================================================
SARAI Database Migration - Creating New Schema
================================================================================

Connecting to database: postgresql+psycopg://postgres:***@localhost:5432/SARAI_DB
✓ Database connection successful

Tables to be created (11):
  - ai_technologies
  - approvals
  - comments
  - notifications
  - organizations
  - project_documents
  - project_images
  - project_sdgs
  - project_tags
  - project_technologies
  - sdgs
  - sectors
  - tags

Creating tables...
✓ All new tables created successfully

Total tables in database: 17
  - ai_technologies
  - approvals
  - comments
  - countries
  - notifications
  - organizations
  - project_documents
  - project_images
  - project_sdgs
  - project_tags
  - project_technologies
  - projects
  - resources
  - sdgs
  - sectors
  - stakeholders
  - tags
  - users

================================================================================
Seeding Reference Data
================================================================================

Seeding sectors...
✓ Seeded 15 sectors

Seeding UN Sustainable Development Goals...
✓ Seeded 17 SDGs

Seeding AI Technologies...
✓ Seeded 15 AI technologies

✓ Reference data seeding completed successfully

================================================================================
Migration completed successfully!
================================================================================
```

**If you see errors:**
- Check database connection
- Verify PostgreSQL is running
- Check user permissions
- Review error message and fix issue

---

### Step 2: Migrate Existing Data

This script migrates data from the old schema to the new schema.

```bash
python migrations/002_migrate_existing_data.py
```

**What it does:**
- Migrates countries (adds new columns, renames old ones)
- Migrates stakeholders → organizations
- Migrates projects with proper foreign keys
- Migrates technology strings → many-to-many relationships
- Migrates SDG strings → many-to-many relationships

**Expected Output:**
```
================================================================================
SARAI Data Migration - Migrating Existing Data
================================================================================

Connecting to database: postgresql+psycopg://postgres:***@localhost:5432/SARAI_DB
✓ Database connection successful

--------------------------------------------------------------------------------
Migrating Countries
--------------------------------------------------------------------------------
Detected old country schema, migrating...
✓ Renamed 'country' column to 'name'
✓ Added code_alpha2 column
✓ Added code_alpha3 column
✓ Added flag_url column
✓ Added description column
✓ Added created_at column
✓ Added updated_at column
✓ Countries migrated: 22 records

--------------------------------------------------------------------------------
Migrating Stakeholders to Organizations
--------------------------------------------------------------------------------
Found 45 stakeholders to migrate
✓ Migrated 45 stakeholders to organizations

--------------------------------------------------------------------------------
Migrating Projects
--------------------------------------------------------------------------------
Current project columns: id, title, organization, country, sector, technology, ...
✓ Added organization_id column
✓ Added sector_id column
✓ Added is_featured column
✓ Added is_published column
✓ Added views_count column
✓ Added published_at column
✓ Added approved_at column
✓ Added start_date column
✓ Added end_date column
Migrating country names to country_id...
✓ Migrated country to country_id
Migrating sector names to sector_id...
✓ Migrated sector to sector_id
Migrating organization names to organization_id...
✓ Migrated organization to organization_id
✓ Projects migrated: 128 records

--------------------------------------------------------------------------------
Migrating Project Technologies
--------------------------------------------------------------------------------
✓ Migrated 128 project-technology relationships

--------------------------------------------------------------------------------
Migrating Project SDGs
--------------------------------------------------------------------------------
✓ Migrated 87 project-SDG relationships

================================================================================
Data migration completed successfully!
================================================================================
```

---

### Step 3: Verify Migration

Run these checks to ensure everything migrated correctly:

```bash
# Check table counts
python -c "
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    tables = ['users', 'organizations', 'projects', 'countries', 'sectors', 'sdgs', 'ai_technologies']
    for table in tables:
        result = conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
        count = result.scalar()
        print(f'{table}: {count} records')
"
```

**Expected Output:**
```
users: 15 records
organizations: 45 records
projects: 128 records
countries: 22 records
sectors: 15 records
sdgs: 17 records
ai_technologies: 15 records
```

---

### Step 4: Test the Application

```bash
# Start the backend server
uvicorn main:app --reload --port 8000
```

**Test these endpoints:**
1. http://localhost:8000/docs - Swagger UI should load
2. http://localhost:8000/api/projects - Should return projects
3. http://localhost:8000/api/countries - Should return countries
4. http://localhost:8000/api/sectors - Should return sectors
5. http://localhost:8000/api/sdgs - Should return SDGs
6. http://localhost:8000/api/technologies - Should return technologies

---

## 🔍 Troubleshooting

### Issue: "Table already exists"

**Solution:** The migration script is idempotent. It checks if tables exist before creating them. This is normal if you run it multiple times.

---

### Issue: "Foreign key constraint violation"

**Cause:** Data inconsistency in old schema

**Solution:**
```bash
# Check for orphaned records
python -c "
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check projects without valid country
    result = conn.execute(text('''
        SELECT p.id, p.title, p.country 
        FROM projects p 
        LEFT JOIN countries c ON p.country = c.name 
        WHERE c.id IS NULL
    '''))
    print('Projects without valid country:')
    for row in result:
        print(f'  ID {row[0]}: {row[1]} (country: {row[2]})')
"
```

**Fix:** Update invalid records before migration

---

### Issue: "Permission denied"

**Cause:** Database user lacks permissions

**Solution:**
```sql
-- Grant permissions (run as postgres superuser)
GRANT ALL PRIVILEGES ON DATABASE SARAI_DB TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

---

### Issue: "Connection refused"

**Cause:** PostgreSQL not running or wrong connection details

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # Linux
brew services list  # macOS
sc query postgresql-x64-14  # Windows

# Check connection details in .env
cat backend/.env | grep DB_
```

---

### Issue: "Module not found"

**Cause:** Missing Python dependencies

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

---

## 🔄 Rollback Procedure

If something goes wrong, you can rollback to your backup:

### PostgreSQL Rollback

```bash
# Drop current database
psql -U postgres -c "DROP DATABASE SARAI_DB;"

# Create new database
psql -U postgres -c "CREATE DATABASE SARAI_DB;"

# Restore from backup
psql -U postgres -d SARAI_DB < backup_YYYYMMDD_HHMMSS.sql
```

### SQLite Rollback

```bash
# Simply restore the backup file
cp backend/sarai_backup_YYYYMMDD_HHMMSS.db backend/sarai.db
```

---

## 📊 Post-Migration Checklist

- [ ] All tables created (17 total)
- [ ] Reference data seeded (sectors, SDGs, technologies)
- [ ] Existing data migrated (users, projects, countries)
- [ ] Foreign key relationships working
- [ ] API endpoints responding
- [ ] Swagger docs accessible
- [ ] No error logs
- [ ] Backup created and verified

---

## 🎯 Next Steps After Migration

1. **Update API Endpoints** - Modify routers to use new schema
2. **Implement File Uploads** - Add document and image upload endpoints
3. **Create Admin Panel** - Build approval workflow UI
4. **Update Frontend** - Modify React components to match new API
5. **Add Search** - Implement full-text search
6. **Testing** - Comprehensive testing of all features

---

## 📞 Need Help?

### Common Commands

```bash
# Check database tables
python -c "from app.database import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"

# Check model relationships
python -c "from app.models import Project; print(Project.__mapper__.relationships.keys())"

# Test database connection
python -c "from app.database import engine; engine.connect(); print('✓ Connected')"

# View migration logs
cat migrations/migration.log  # If logging to file
```

### Database Inspection

```bash
# PostgreSQL
psql -U postgres -d SARAI_DB

# List tables
\dt

# Describe table
\d projects

# Count records
SELECT COUNT(*) FROM projects;

# Check relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='projects';
```

---

## 📝 Migration Log

Keep track of your migration:

```
Date: _______________
Time Started: _______________
Time Completed: _______________

Backup Location: _______________

Step 1 (Schema Creation): ☐ Success ☐ Failed
Step 2 (Data Migration): ☐ Success ☐ Failed
Step 3 (Verification): ☐ Success ☐ Failed
Step 4 (Testing): ☐ Success ☐ Failed

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Good luck with your migration! 🚀**

If you encounter any issues not covered in this guide, check the error logs and refer to the DATABASE_SCHEMA.md documentation.
