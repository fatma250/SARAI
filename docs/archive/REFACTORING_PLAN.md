# SARAI Platform - Comprehensive Refactoring Plan

## Executive Summary
This document outlines the complete refactoring strategy for the SARAI (Stocktaking of Arab Regional AI Initiatives) platform to align with RFP requirements while preserving existing functionality.

## Current Architecture Analysis

### Existing Stack
- **Backend**: FastAPI + SQLAlchemy
- **Database**: PostgreSQL (primary) / SQLite (fallback)
- **Frontend**: React (Vite)
- **Authentication**: JWT with password hashing (passlib)

### Critical Issues Identified

#### 1. Database Schema Problems
- ❌ Broken foreign key relationships in Project model
- ❌ Country stored as string instead of FK reference
- ❌ No normalization for sectors, SDGs, technologies
- ❌ Missing many-to-many relationship tables
- ❌ Missing core entities (organizations, tags, comments, documents, approvals)

#### 2. Missing RFP Requirements
- ❌ No separate organizations/stakeholders distinction
- ❌ No document management system
- ❌ No image attachments for projects
- ❌ No tagging system
- ❌ No comments/moderation
- ❌ No notifications
- ❌ No audit trail
- ❌ No advanced search (full-text)
- ❌ No geospatial queries

#### 3. API Limitations
- ⚠️ Basic pagination without metadata
- ⚠️ Limited filtering
- ⚠️ No file upload handling
- ⚠️ No bulk operations

## Refactoring Strategy

### Phase 1: Database Architecture Redesign ✅

#### New/Improved Entities

**Core Entities:**
1. **users** - Authentication and user management
2. **organizations** - Separate from users (stakeholders)
3. **projects** - AI initiatives with full metadata
4. **countries** - Geographic data with coordinates
5. **sectors** - Normalized sector taxonomy
6. **sdgs** - Sustainable Development Goals
7. **ai_technologies** - AI technology taxonomy
8. **tags** - Flexible tagging system

**Relationship Tables:**
9. **project_sdgs** - Many-to-many: projects ↔ SDGs
10. **project_technologies** - Many-to-many: projects ↔ AI technologies
11. **project_tags** - Many-to-many: projects ↔ tags
12. **project_images** - One-to-many: projects → images
13. **project_documents** - One-to-many: projects → documents

**Management Entities:**
14. **resources** - Policy docs, white papers, datasets
15. **comments** - Project comments/feedback
16. **approvals** - Approval workflow tracking
17. **notifications** - User notifications
18. **audit_logs** - System audit trail

#### Database Improvements
- ✅ Proper foreign keys with cascading rules
- ✅ Indexes on frequently queried columns
- ✅ Check constraints for data integrity
- ✅ Timestamps (created_at, updated_at) on all tables
- ✅ Soft delete capability where needed

### Phase 2: Backend API Enhancement ✅

#### New Routers
- `/api/organizations` - Organization management
- `/api/sectors` - Sector taxonomy
- `/api/sdgs` - SDG management
- `/api/technologies` - AI technology taxonomy
- `/api/tags` - Tag management
- `/api/documents` - Document management
- `/api/images` - Image management
- `/api/comments` - Comments system
- `/api/notifications` - Notification system
- `/api/admin` - Consolidated admin operations

#### Enhanced Existing Routers
- **Projects**: Add filtering, search, pagination metadata, file uploads
- **Users**: Add role management, activity tracking
- **Stakeholders**: Migrate to organizations
- **Analytics**: Add SDG stats, technology trends, geospatial data
- **Countries**: Add geospatial queries

#### New Features
- 📤 File upload handling (documents, images)
- 🔍 Full-text search with PostgreSQL
- 📊 Advanced filtering and sorting
- 📄 Pagination with metadata (total, pages, etc.)
- 🔐 Enhanced security (rate limiting, input validation)
- 📧 Email notifications
- 📝 Audit logging

### Phase 3: Admin Panel Enhancement ✅

#### Admin Features
- Project approval workflow (pending → approved/rejected)
- User management (list, edit, delete, role assignment)
- Organization management
- Content moderation (comments)
- Analytics dashboard
- System settings
- Audit log viewer

### Phase 4: Frontend Integration ✅

#### Updates Required
- Update API calls to match new endpoints
- Add file upload components
- Implement advanced search UI
- Add filtering components
- Update forms for new fields
- Add admin panel pages
- Implement notifications UI

## Implementation Roadmap

### Step 1: Create New Models ✅
- Define all new SQLAlchemy models
- Add proper relationships
- Add indexes and constraints

### Step 2: Create Migration Scripts ✅
- Generate Alembic migrations
- Create data migration scripts
- Test migrations on development database

### Step 3: Update Schemas ✅
- Create Pydantic schemas for all new entities
- Update existing schemas
- Add validation rules

### Step 4: Implement New Routers ✅
- Create new router files
- Implement CRUD operations
- Add filtering, search, pagination
- Add file upload handling

### Step 5: Enhance Existing Routers ✅
- Update projects router
- Update users router
- Update analytics router
- Fix broken relationships

### Step 6: Testing ✅
- Test all endpoints
- Verify database migrations
- Test file uploads
- Test authentication/authorization

### Step 7: Frontend Updates ✅
- Update API integration
- Test all features
- Fix any breaking changes

## Database Schema (ERD)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   users     │       │organizations │       │  countries  │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)      │       │ id (PK)     │
│ email       │       │ name         │       │ name        │
│ password    │       │ type         │       │ latitude    │
│ role        │       │ country_id   │───────│ longitude   │
│ org_id (FK) │───────│ ...          │       │ region      │
└─────────────┘       └──────────────┘       └─────────────┘
                              │
                              │
                      ┌───────▼────────┐
                      │   projects     │
                      ├────────────────┤
                      │ id (PK)        │
                      │ title          │
                      │ description    │
                      │ org_id (FK)    │
                      │ country_id (FK)│
                      │ sector_id (FK) │
                      │ status         │
                      │ user_id (FK)   │
                      └────────────────┘
                       │   │   │   │
        ┌──────────────┘   │   │   └──────────────┐
        │                  │   │                   │
┌───────▼────────┐ ┌───────▼────┐ ┌───────▼──────┐ ┌────▼─────┐
│ project_sdgs   │ │project_tech│ │project_tags  │ │proj_docs │
├────────────────┤ ├────────────┤ ├──────────────┤ ├──────────┤
│ project_id (FK)│ │project_id  │ │project_id    │ │id (PK)   │
│ sdg_id (FK)    │ │tech_id     │ │tag_id        │ │project_id│
└────────────────┘ └────────────┘ └──────────────┘ │file_url  │
                                                    └──────────┘
```

## Success Criteria

✅ All database relationships properly defined
✅ All RFP requirements implemented
✅ Existing features preserved
✅ API documentation complete (Swagger)
✅ Admin panel functional
✅ Frontend compatible
✅ Database migrations successful
✅ All tests passing

## Risk Mitigation

1. **Data Loss Prevention**: Create database backups before migration
2. **Rollback Plan**: Keep migration rollback scripts ready
3. **Testing**: Comprehensive testing in development environment
4. **Gradual Deployment**: Phase-wise deployment with monitoring

## Timeline Estimate

- Phase 1 (Database): 2-3 days
- Phase 2 (Backend): 3-4 days
- Phase 3 (Admin): 1-2 days
- Phase 4 (Frontend): 2-3 days
- Testing & QA: 2 days

**Total**: ~10-14 days

## Next Steps

1. Review and approve this plan
2. Create database backup
3. Begin Phase 1 implementation
4. Iterative testing and refinement
