# SARAI Backend - Scripts Guide

## 📚 Available Scripts

### 🔧 Database Management

#### `test_connection.py`
**Purpose**: Test database connection and verify setup  
**Usage**: `python test_connection.py`  
**When to use**: First time setup, troubleshooting connection issues  
**Output**: Connection status, table list, reference data counts

#### `verify_database_state.py`
**Purpose**: Check current database state and statistics  
**Usage**: `python verify_database_state.py`  
**When to use**: Before/after cleanup, debugging, monitoring  
**Output**: Counts for all tables, sample data, relationships

---

### 🧹 Data Cleanup & Population

#### `run_data_cleanup.py` ⭐ MAIN SCRIPT
**Purpose**: Master script - runs complete cleanup workflow  
**Usage**: `python run_data_cleanup.py`  
**When to use**: Initial data cleanup, reset database  
**What it does**:
1. Ensures admin user exists
2. Deletes all fake/test projects
3. Inserts 12 real Arab AI projects
4. Creates organizations and relationships

**Interactive**: Asks for confirmation before proceeding

#### `clean_real_projects.py`
**Purpose**: Core cleanup script (called by run_data_cleanup.py)  
**Usage**: `python clean_real_projects.py`  
**When to use**: Direct cleanup without confirmation prompt  
**Projects added**: 12 real Arab AI projects from 10 countries

#### `ensure_admin_user.py`
**Purpose**: Create/verify admin user (ID=1)  
**Usage**: `python ensure_admin_user.py`  
**When to use**: Before adding projects, user management  
**Creates**: admin / admin@sarai.org / admin123

#### `add_more_projects.py`
**Purpose**: Add 8 additional real Arab AI projects  
**Usage**: `python add_more_projects.py`  
**When to use**: After initial cleanup, expanding project collection  
**Projects added**: 8 more projects (Palestine, Kuwait, Iraq, Algeria, etc.)  
**Total after**: 20 projects

---

### 📊 Analysis & Debugging

#### `analyze_current_data.py`
**Purpose**: Analyze projects to identify fake/test data  
**Usage**: `python analyze_current_data.py`  
**When to use**: Before cleanup, data quality assessment  
**Output**: List of fake indicators, project analysis

#### `check_countries.py`
**Purpose**: List all countries with their IDs  
**Usage**: `python check_countries.py`  
**When to use**: Reference for country IDs, debugging

#### `check_stakeholders_data.py`
**Purpose**: Analyze stakeholder/organization data  
**Usage**: `python check_stakeholders_data.py`  
**When to use**: Organization data verification

#### `check_projects_schema.py`
**Purpose**: Display projects table schema  
**Usage**: `python check_projects_schema.py`  
**When to use**: Schema verification, debugging column issues

---

### 🗄️ Migrations

#### `migrations/001_create_new_schema.py`
**Purpose**: Create all tables and seed reference data  
**Usage**: `python migrations/001_create_new_schema.py`  
**When to use**: Initial setup, fresh database  
**Creates**: 18 tables, seeds sectors/SDGs/technologies/countries

#### `migrations/002_migrate_existing_data.py`
**Purpose**: Migrate old data to new schema  
**Usage**: `python migrations/002_migrate_existing_data.py`  
**When to use**: After running 001, upgrading from old schema  
**Migrates**: Countries, stakeholders→organizations, projects

---

### 👤 User Management

#### `create_admin.py`
**Purpose**: Create admin user (alternative to ensure_admin_user.py)  
**Usage**: `python create_admin.py`  
**When to use**: Initial admin creation

---

## 🚀 Quick Start Workflow

### First Time Setup
```bash
# 1. Test connection
python test_connection.py

# 2. Run migrations (if needed)
python migrations/001_create_new_schema.py
python migrations/002_migrate_existing_data.py

# 3. Clean and populate
python run_data_cleanup.py

# 4. Verify results
python verify_database_state.py

# 5. (Optional) Add more projects
python add_more_projects.py
```

### Regular Usage
```bash
# Check current state
python verify_database_state.py

# Add more projects
python add_more_projects.py

# Reset everything
python run_data_cleanup.py
```

---

## 📋 Script Execution Order

### Complete Reset
1. `test_connection.py` - Verify connection
2. `migrations/001_create_new_schema.py` - Create tables
3. `migrations/002_migrate_existing_data.py` - Migrate data
4. `run_data_cleanup.py` - Clean and populate
5. `verify_database_state.py` - Verify

### Add Projects Only
1. `verify_database_state.py` - Check current state
2. `add_more_projects.py` - Add 8 more projects
3. `verify_database_state.py` - Verify additions

### Troubleshooting
1. `test_connection.py` - Check connection
2. `check_projects_schema.py` - Check schema
3. `analyze_current_data.py` - Analyze data quality
4. `verify_database_state.py` - Full state check

---

## 🎯 Script Categories

### Essential Scripts (Use These)
- ⭐ `run_data_cleanup.py` - Main cleanup script
- ⭐ `verify_database_state.py` - State verification
- ⭐ `test_connection.py` - Connection test
- ⭐ `add_more_projects.py` - Add more projects

### Support Scripts (Auto-called)
- `clean_real_projects.py` - Core cleanup logic
- `ensure_admin_user.py` - Admin management

### Analysis Scripts (Optional)
- `analyze_current_data.py` - Data quality
- `check_countries.py` - Country reference
- `check_stakeholders_data.py` - Organization data
- `check_projects_schema.py` - Schema info

### Migration Scripts (One-time)
- `migrations/001_create_new_schema.py` - Initial setup
- `migrations/002_migrate_existing_data.py` - Data migration

---

## 📊 Expected Results

### After `run_data_cleanup.py`
```
✅ Projects: 12
✅ Organizations: 12+
✅ Project-Technology links: 12
✅ Project-SDG links: 12+
✅ All projects status: approved
✅ All projects published: yes
```

### After `add_more_projects.py`
```
✅ Projects: 20
✅ Organizations: 20+
✅ Countries covered: 12 Arab countries
✅ Sectors covered: 10+ sectors
✅ Technologies: 10+ AI technologies
```

---

## 🔍 Debugging Guide

### Problem: Connection fails
**Solution**: Run `test_connection.py` to diagnose

### Problem: Tables missing
**Solution**: Run migrations 001 and 002

### Problem: Reference data missing
**Solution**: Run migration 001 (seeds reference data)

### Problem: No admin user
**Solution**: Run `ensure_admin_user.py`

### Problem: Duplicate projects
**Solution**: Scripts check for duplicates automatically

### Problem: Foreign key errors
**Solution**: Ensure migrations ran successfully

---

## 📝 Notes

### Database Requirements
- PostgreSQL 12+
- Database: SARAI_DB
- User: postgres
- Password: 0000 (from .env)

### Admin User
- Username: admin
- Email: admin@sarai.org
- Password: admin123
- ID: 1 (used for project ownership)

### Reference Data
- 15 Sectors
- 17 SDGs
- 15 AI Technologies
- 22 Arab Countries

### Project Data
- All projects are REAL Arab AI initiatives
- All projects have status "approved"
- All projects are published
- All projects linked to real organizations
- All projects have SDG alignments
- All projects have AI technology tags

---

## 🆘 Support

If you encounter issues:
1. Run `test_connection.py` first
2. Check error messages carefully
3. Verify .env file settings
4. Ensure PostgreSQL is running
5. Check database exists (SARAI_DB)

---

## 📖 Documentation

- `DATA_CLEANUP_GUIDE.md` - Detailed cleanup guide
- `CURRENT_STATUS.md` - Project status overview
- `DATABASE_SCHEMA.md` - Database schema documentation
- `MIGRATION_GUIDE.md` - Migration instructions

---

**Last Updated**: 2026-05-07  
**Version**: 2.0  
**Status**: Ready for production data
