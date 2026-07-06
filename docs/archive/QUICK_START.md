# SARAI Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the refactored SARAI platform.

---

## Prerequisites

- ✅ Python 3.8+
- ✅ PostgreSQL 12+ (or SQLite for development)
- ✅ Git

---

## Step 1: Clone & Setup (2 minutes)

```bash
# Clone repository
git clone https://github.com/your-org/Stage-PFE-AICTO.git
cd Stage-PFE-AICTO/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 2: Configure Database (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# For quick start, SQLite works out of the box (no PostgreSQL needed)
```

**Minimal .env for SQLite:**
```env
JWT_SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

---

## Step 3: Run Migrations (1 minute)

```bash
# Create new schema and seed reference data
python migrations/001_create_new_schema.py

# Migrate existing data (if you have existing database)
python migrations/002_migrate_existing_data.py
```

**Expected Output:**
```
✓ Database connection successful
✓ All new tables created successfully
✓ Seeded 15 sectors
✓ Seeded 17 SDGs
✓ Seeded 15 AI technologies
Migration completed successfully!
```

---

## Step 4: Start Server (1 minute)

```bash
# Start backend server
uvicorn main:app --reload --port 8000
```

**You should see:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

## Step 5: Test API (30 seconds)

Open your browser and visit:

1. **API Docs**: http://localhost:8000/docs
2. **Health Check**: http://localhost:8000/health
3. **Countries**: http://localhost:8000/api/countries
4. **Sectors**: http://localhost:8000/api/sectors
5. **SDGs**: http://localhost:8000/api/sdgs

---

## 🎉 You're Ready!

The SARAI backend is now running with the new refactored schema.

---

## Next Steps

### Create Admin User

```bash
python create_admin.py
```

Follow prompts to create an admin account.

### Test Authentication

```bash
# Register a user
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "organization_name": "Test Lab",
    "organization_type": "Research Lab"
  }'

# Login
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Explore API

Visit http://localhost:8000/docs for interactive API documentation.

---

## Common Commands

### Backend

```bash
# Start server
uvicorn main:app --reload --port 8000

# Run migrations
python migrations/001_create_new_schema.py
python migrations/002_migrate_existing_data.py

# Create admin
python create_admin.py

# Check database
python check_db.py
```

### Database

```bash
# PostgreSQL
psql -U postgres -d SARAI_DB

# SQLite
sqlite3 sarai.db

# Backup PostgreSQL
pg_dump -U postgres -d SARAI_DB > backup.sql

# Backup SQLite
cp sarai.db sarai_backup.db
```

---

## Troubleshooting

### Issue: "Module not found"
```bash
pip install -r requirements.txt
```

### Issue: "Database connection failed"
Check your `.env` file and ensure PostgreSQL is running:
```bash
# Windows
sc query postgresql-x64-14

# Linux
sudo systemctl status postgresql

# Mac
brew services list
```

### Issue: "Table already exists"
This is normal if you run migrations multiple times. The scripts are idempotent.

### Issue: "Permission denied"
Make sure your database user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE SARAI_DB TO your_user;
```

---

## Quick Reference

### Project Structure

```
Stage-PFE-AICTO/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models (17 tables)
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── database/        # Database connection
│   ├── migrations/          # Migration scripts
│   ├── main.py             # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Configuration
├── frontend/               # React frontend
├── REFACTORING_PLAN.md    # Complete strategy
├── DATABASE_SCHEMA.md     # Schema documentation
├── MIGRATION_GUIDE.md     # Migration instructions
├── API_ENDPOINTS.md       # API documentation
└── QUICK_START.md         # This file
```

### Key URLs

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Frontend**: http://localhost:3000 (when running)

### Database Tables

**Core**: users, organizations, countries, sectors, sdgs, ai_technologies, tags  
**Projects**: projects  
**Relationships**: project_sdgs, project_technologies, project_tags  
**Attachments**: project_documents, project_images  
**Engagement**: comments, approvals, notifications  
**Resources**: resources

---

## Documentation

For detailed information, see:

- **[REFACTORING_PLAN.md](REFACTORING_PLAN.md)** - Complete refactoring strategy
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Full schema documentation
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Step-by-step migration
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - Complete API reference
- **[ARCHITECT_REPORT.md](ARCHITECT_REPORT.md)** - Technical analysis

---

## Support

- **Documentation**: See docs folder
- **API Docs**: http://localhost:8000/docs
- **Issues**: Check MIGRATION_GUIDE.md troubleshooting section

---

## What's Next?

1. ✅ Backend is running
2. ⏭️ Update API routers (see REFACTORING_SUMMARY.md)
3. ⏭️ Implement file uploads
4. ⏭️ Create admin panel
5. ⏭️ Update frontend
6. ⏭️ Deploy to production

---

**Happy Coding! 🚀**

For questions, refer to the comprehensive documentation or the ARCHITECT_REPORT.md.
