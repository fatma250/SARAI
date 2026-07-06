# SARAI - Stocktaking of Arab Regional AI Initiatives

**Platform for AICTO (Arab ICT Organization)**

A comprehensive platform for cataloging, managing, and showcasing AI initiatives across the Arab region.

---

## 🎯 Project Overview

SARAI is a regional AI repository platform that serves as a centralized hub for:
- 🤖 AI Projects and Initiatives
- 🏢 Stakeholder Organizations
- 📊 AI Analytics and Statistics
- 🗺️ Interactive Knowledge Mapping
- 📚 Resource Library

---

## ✨ Current Status

### ✅ Phase 1: Database Architecture (COMPLETED)
- Refactored to normalized schema (18 tables)
- Created 11 new models + improved 6 existing
- Implemented proper relationships and constraints
- Added reference data (sectors, SDGs, technologies)

### ✅ Phase 2: Data Cleanup (READY)
- Created scripts to remove fake/test data
- Prepared 12 REAL Arab AI projects
- Ready for execution

### 🔜 Phase 3: Frontend Integration (NEXT)
- API testing
- Frontend display
- Filters and search
- Responsive design

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Node.js 16+ (for frontend)

### 1. Database Setup
```bash
# Create database
createdb SARAI_DB

# Configure .env
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Run Migrations
```bash
cd backend
python migrations/001_create_new_schema.py
python migrations/002_migrate_existing_data.py
```

### 3. Clean and Populate Data ⭐
```bash
# This will remove fake data and add 12 real Arab AI projects
python run_data_cleanup.py
```

### 4. Start Backend
```bash
uvicorn app:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### 5. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
# Frontend: http://localhost:3000
```

---

## 📊 Real Projects Included

The platform includes **12 real Arab AI projects** from:

- 🇪🇬 **Egypt** - NLP Platform, Manufacturing Robotics
- 🇲🇦 **Morocco** - Medical Diagnosis, Generative AI
- 🇯🇴 **Jordan** - Smart Agriculture
- 🇸🇦 **Saudi Arabia** - Climate Research
- 🇶🇦 **Qatar** - Speech Recognition
- 🇦🇪 **UAE** - Smart City Platform
- 🇹🇳 **Tunisia** - E-Learning Engine
- 🇱🇧 **Lebanon** - Healthcare Analytics
- 🇧🇭 **Bahrain** - Financial AI
- 🇴🇲 **Oman** - Explainable AI

**Expandable to 20+ projects** with `add_more_projects.py`

---

## 🗂️ Project Structure

```
Stage-PFE-AICTO/
├── backend/
│   ├── app/
│   │   ├── models/          # 17 database models
│   │   ├── routers/         # API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── database/        # DB connection
│   ├── migrations/          # Database migrations
│   ├── run_data_cleanup.py  # ⭐ Main cleanup script
│   ├── verify_database_state.py
│   ├── test_api_endpoints.py
│   └── README_SCRIPTS.md    # Scripts documentation
├── frontend/                # React frontend
├── docs/                    # Documentation
│   ├── DATABASE_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   └── MIGRATION_GUIDE.md
├── NEXT_STEPS.md           # 🎯 What to do next
├── WORK_SUMMARY.md         # 📋 Complete work summary
└── README.md               # This file
```

---

## 📚 Documentation

### Getting Started
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - 🎯 Start here! Step-by-step guide
- **[DATA_CLEANUP_GUIDE.md](backend/DATA_CLEANUP_GUIDE.md)** - Data cleanup instructions
- **[README_SCRIPTS.md](backend/README_SCRIPTS.md)** - All scripts explained

### Technical Documentation
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Complete schema documentation
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - API reference
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migration instructions
- **[ARCHITECT_REPORT.md](ARCHITECT_REPORT.md)** - Architecture decisions

### Project Status
- **[CURRENT_STATUS.md](CURRENT_STATUS.md)** - Current project status
- **[WORK_SUMMARY.md](WORK_SUMMARY.md)** - Complete work summary
- **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)** - Refactoring details

---

## 🛠️ Available Scripts

### Essential Scripts
```bash
# Test database connection
python backend/test_connection.py

# Verify current state
python backend/verify_database_state.py

# Clean and populate with real data ⭐
python backend/run_data_cleanup.py

# Add 8 more projects (optional)
python backend/add_more_projects.py

# Test API endpoints
python backend/test_api_endpoints.py
```

See [README_SCRIPTS.md](backend/README_SCRIPTS.md) for complete documentation.

---

## 🗄️ Database Schema

### Core Tables
- **users** - Platform users (admin, contributors)
- **projects** - AI projects/initiatives
- **organizations** - Stakeholder organizations
- **countries** - Arab countries
- **sectors** - Industry sectors
- **sdgs** - UN Sustainable Development Goals
- **ai_technologies** - AI technology categories

### Relationship Tables
- **project_sdgs** - Projects ↔ SDGs
- **project_technologies** - Projects ↔ Technologies
- **project_tags** - Projects ↔ Tags

### Additional Tables
- **documents** - Project documents
- **images** - Project images
- **comments** - Project comments
- **approvals** - Approval workflow
- **notifications** - User notifications

**Total**: 18 tables with proper relationships

---

## 🔧 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Router** - Routing

### DevOps
- **Git** - Version control
- **Python** - Scripting and automation

---

## 📊 Features

### Current Features ✅
- ✅ Normalized database schema
- ✅ 12 real Arab AI projects
- ✅ Organization management
- ✅ Project categorization (sectors, SDGs, technologies)
- ✅ RESTful API
- ✅ API documentation (Swagger)
- ✅ Data validation
- ✅ Automated data cleanup

### Planned Features 🔜
- 🔜 Project approval workflow
- 🔜 User authentication & authorization
- 🔜 Advanced search and filters
- 🔜 Analytics dashboard
- 🔜 Interactive map visualization
- 🔜 Document management
- 🔜 Image galleries
- 🔜 Comment system
- 🔜 Notification system

---

## 🎯 Immediate Next Steps

1. **Execute Data Cleanup**
   ```bash
   cd backend
   python run_data_cleanup.py
   ```

2. **Start Backend Server**
   ```bash
   uvicorn app:app --reload
   ```

3. **Test API**
   - Open: http://localhost:8000/docs
   - Try: GET /api/projects

4. **Verify Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

See **[NEXT_STEPS.md](NEXT_STEPS.md)** for detailed instructions.

---

## 🤝 Contributing

### Adding New Projects
1. Edit `backend/add_more_projects.py`
2. Add project data to `additional_projects` list
3. Run: `python add_more_projects.py`

### Database Changes
1. Modify models in `backend/app/models/`
2. Create migration script in `backend/migrations/`
3. Run migration
4. Update documentation

---

## 📞 Support

### Common Issues

**Connection fails**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database `SARAI_DB` exists

**Tables missing**
- Run migrations: `001_create_new_schema.py` and `002_migrate_existing_data.py`

**Reference data missing**
- Run: `python migrations/001_create_new_schema.py` (seeds data)

**No admin user**
- Run: `python backend/ensure_admin_user.py`

### Documentation
- Check [NEXT_STEPS.md](NEXT_STEPS.md) for guidance
- See [README_SCRIPTS.md](backend/README_SCRIPTS.md) for script help
- Review [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for schema info

---

## 📄 License

This project is developed for AICTO (Arab ICT Organization).

---

## 👥 Team

- **Client**: AICTO - Arab ICT Organization
- **Developer**: Fatma
- **AI Assistant**: Kiro
- **Project**: SARAI Platform

---

## 🎉 Acknowledgments

Special thanks to:
- AICTO for the project vision
- Arab AI research community
- All organizations featured in the platform

---

**Status**: ✅ Ready for data cleanup and deployment  
**Version**: 2.0  
**Last Updated**: 7 Mai 2026

---

## 🚀 Get Started Now!

```bash
cd backend
python run_data_cleanup.py
```

Then check **[NEXT_STEPS.md](NEXT_STEPS.md)** for what to do next!

---

# Stage-PFE-AICTO
