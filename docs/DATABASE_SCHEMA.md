# SARAI Database Schema Documentation

## Overview
This document describes the complete database schema for the SARAI (Stocktaking of Arab Regional AI Initiatives) platform after refactoring.

## Database Technology
- **Primary**: PostgreSQL 12+
- **Fallback**: SQLite (for development)
- **ORM**: SQLAlchemy 2.0+

## Schema Design Principles
1. **Normalization**: Proper 3NF normalization to eliminate redundancy
2. **Referential Integrity**: Foreign keys with appropriate cascading rules
3. **Indexing**: Strategic indexes on frequently queried columns
4. **Constraints**: Check constraints for data validation
5. **Timestamps**: All tables have created_at and updated_at
6. **Soft Deletes**: Where appropriate (via is_active flags)

---

## Core Entities

### 1. users
**Purpose**: User authentication and authorization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email (login) |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| organization_name | VARCHAR(255) | NULL | Legacy field |
| organization_type | VARCHAR(50) | NULL | Legacy field |
| organization_id | INTEGER | FK → organizations.id | Link to organization |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'organization' | organization / admin / moderator |
| is_active | INTEGER | NOT NULL, DEFAULT 1 | 1=active, 0=inactive |
| phone | VARCHAR(50) | NULL | Contact phone |
| website | VARCHAR(500) | NULL | Website URL |
| country | VARCHAR(100) | NULL | Country name |
| city | VARCHAR(100) | NULL | City name |
| address | VARCHAR(500) | NULL | Full address |
| sector | VARCHAR(150) | NULL | Business sector |
| description | TEXT | NULL | Profile description |
| logo | TEXT | NULL | Logo URL/path |
| reset_token | VARCHAR(100) | NULL, UNIQUE | Password reset token |
| reset_token_expiry | TIMESTAMP | NULL | Token expiration |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| last_login | TIMESTAMP | NULL | Last login timestamp |

**Indexes**: email, role, organization_id, is_active, reset_token

**Relationships**:
- → organizations (many-to-one)
- ← projects (one-to-many)
- ← comments (one-to-many)
- ← notifications (one-to-many)

---

### 2. organizations
**Purpose**: Stakeholder organizations (AI labs, startups, government agencies, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| type | VARCHAR(100) | NOT NULL | Research Lab / Startup / Government / University / NGO / Company |
| category | VARCHAR(100) | NULL | Sub-category |
| country_id | INTEGER | FK → countries.id | Country location |
| email | VARCHAR(255) | NULL | Contact email |
| phone | VARCHAR(50) | NULL | Contact phone |
| website | VARCHAR(500) | NULL | Website URL |
| city | VARCHAR(100) | NULL | City location |
| address | TEXT | NULL | Full address |
| sector | VARCHAR(150) | NULL | Business sector |
| description | TEXT | NULL | Organization description |
| logo_url | TEXT | NULL | Logo URL |
| is_active | INTEGER | NOT NULL, DEFAULT 1 | 1=active, 0=inactive |
| is_verified | INTEGER | NOT NULL, DEFAULT 0 | 1=verified, 0=not verified |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: name, type, country_id, is_active

**Relationships**:
- → countries (many-to-one)
- ← users (one-to-many)
- ← projects (one-to-many)

---

### 3. countries
**Purpose**: Geographic data for Arab region countries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Country name |
| code_alpha2 | VARCHAR(2) | NULL, UNIQUE | ISO 3166-1 alpha-2 |
| code_alpha3 | VARCHAR(3) | NULL, UNIQUE | ISO 3166-1 alpha-3 |
| latitude | NUMERIC(9,6) | NULL | Capital latitude |
| longitude | NUMERIC(9,6) | NULL | Capital longitude |
| region | VARCHAR(100) | NULL | Sub-region |
| flag_url | VARCHAR(500) | NULL | Flag image URL |
| description | TEXT | NULL | Country description |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: name, code_alpha2, code_alpha3, region

**Relationships**:
- ← organizations (one-to-many)
- ← projects (one-to-many)

---

### 4. sectors
**Purpose**: Normalized sector taxonomy

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(150) | NOT NULL, UNIQUE | Sector name |
| description | TEXT | NULL | Sector description |
| icon_url | VARCHAR(500) | NULL | Icon URL |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Examples**: Healthcare, Education, Finance, Agriculture, Transportation, Energy, Government, Security

**Indexes**: name

**Relationships**:
- ← projects (one-to-many)

---

### 5. sdgs
**Purpose**: UN Sustainable Development Goals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| goal_number | INTEGER | NOT NULL, UNIQUE, CHECK (1-17) | SDG number |
| name | VARCHAR(255) | NOT NULL | SDG name |
| description | TEXT | NULL | SDG description |
| icon_url | VARCHAR(500) | NULL | Icon URL |
| color_code | VARCHAR(7) | NULL | Hex color code |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: goal_number, name

**Relationships**:
- ← project_sdgs (one-to-many)

---

### 6. ai_technologies
**Purpose**: AI technology taxonomy

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(150) | NOT NULL, UNIQUE | Technology name |
| description | TEXT | NULL | Technology description |
| category | VARCHAR(100) | NULL | ML / DL / NLP / CV / Robotics |
| icon_url | VARCHAR(500) | NULL | Icon URL |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Examples**: Machine Learning, Deep Learning, NLP, Computer Vision, Robotics, Speech Recognition

**Indexes**: name, category

**Relationships**:
- ← project_technologies (one-to-many)

---

### 7. tags
**Purpose**: Flexible tagging system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Tag name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly slug |
| color_code | VARCHAR(7) | NULL | Hex color code |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: name, slug

**Relationships**:
- ← project_tags (one-to-many)

---

## Project Entities

### 8. projects
**Purpose**: AI projects/initiatives (core entity)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Project title |
| description | TEXT | NULL | Project description |
| organization_id | INTEGER | FK → organizations.id | Organization |
| user_id | INTEGER | FK → users.id | Project owner |
| country_id | INTEGER | FK → countries.id | Country location |
| sector_id | INTEGER | FK → sectors.id | Sector |
| website | VARCHAR(500) | NULL | Project website |
| year_of_implementation | INTEGER | NULL | Implementation year |
| start_date | TIMESTAMP | NULL | Start date |
| end_date | TIMESTAMP | NULL | End date |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'pending' | pending / approved / rejected / revision_requested / draft |
| is_featured | INTEGER | NOT NULL, DEFAULT 0 | 1=featured, 0=regular |
| is_published | INTEGER | NOT NULL, DEFAULT 0 | 1=published, 0=draft |
| views_count | INTEGER | NOT NULL, DEFAULT 0 | View counter |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| published_at | TIMESTAMP | NULL | Publication timestamp |
| approved_at | TIMESTAMP | NULL | Approval timestamp |

**Indexes**: title, organization_id, user_id, country_id, sector_id, status, is_featured, is_published, created_at, published_at

**Relationships**:
- → organization (many-to-one)
- → user (many-to-one)
- → country (many-to-one)
- → sector (many-to-one)
- ← project_sdgs (one-to-many)
- ← project_technologies (one-to-many)
- ← project_tags (one-to-many)
- ← project_documents (one-to-many)
- ← project_images (one-to-many)
- ← comments (one-to-many)
- ← approvals (one-to-many)

---

## Many-to-Many Relationship Tables

### 9. project_sdgs
**Purpose**: Projects ↔ SDGs relationship

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| sdg_id | INTEGER | FK → sdgs.id, CASCADE | SDG reference |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Unique Constraint**: (project_id, sdg_id)
**Indexes**: project_id, sdg_id

---

### 10. project_technologies
**Purpose**: Projects ↔ AI Technologies relationship

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| technology_id | INTEGER | FK → ai_technologies.id, CASCADE | Technology reference |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Unique Constraint**: (project_id, technology_id)
**Indexes**: project_id, technology_id

---

### 11. project_tags
**Purpose**: Projects ↔ Tags relationship

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| tag_id | INTEGER | FK → tags.id, CASCADE | Tag reference |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Unique Constraint**: (project_id, tag_id)
**Indexes**: project_id, tag_id

---

## Project Attachments

### 12. project_documents
**Purpose**: Documents attached to projects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| filename | VARCHAR(255) | NOT NULL | Stored filename |
| original_filename | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | File path |
| file_url | VARCHAR(500) | NULL | Public URL |
| file_size | BIGINT | NULL | Size in bytes |
| mime_type | VARCHAR(100) | NULL | MIME type |
| title | VARCHAR(255) | NULL | Document title |
| description | TEXT | NULL | Document description |
| document_type | VARCHAR(100) | NULL | Report / White Paper / Dataset / Policy |
| uploaded_by | INTEGER | FK → users.id, SET NULL | Uploader |
| created_at | TIMESTAMP | NOT NULL | Upload timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: project_id, uploaded_by, document_type

---

### 13. project_images
**Purpose**: Images attached to projects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| filename | VARCHAR(255) | NOT NULL | Stored filename |
| original_filename | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | File path |
| file_url | VARCHAR(500) | NULL | Public URL |
| file_size | BIGINT | NULL | Size in bytes |
| mime_type | VARCHAR(100) | NULL | MIME type |
| width | INTEGER | NULL | Image width |
| height | INTEGER | NULL | Image height |
| alt_text | VARCHAR(255) | NULL | Accessibility text |
| caption | TEXT | NULL | Image caption |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| is_featured | INTEGER | NOT NULL, DEFAULT 0 | 1=featured, 0=regular |
| uploaded_by | INTEGER | FK → users.id, SET NULL | Uploader |
| created_at | TIMESTAMP | NOT NULL | Upload timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: project_id, uploaded_by, is_featured, display_order

---

## Engagement & Workflow

### 14. comments
**Purpose**: Comments on projects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| user_id | INTEGER | FK → users.id, CASCADE | Commenter |
| parent_id | INTEGER | FK → comments.id, CASCADE | Parent comment (threading) |
| content | TEXT | NOT NULL | Comment content |
| is_approved | INTEGER | NOT NULL, DEFAULT 1 | 1=approved, 0=pending |
| is_flagged | INTEGER | NOT NULL, DEFAULT 0 | 1=flagged, 0=normal |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: project_id, user_id, parent_id, is_approved, is_flagged, created_at

---

### 15. approvals
**Purpose**: Project approval workflow audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INTEGER | FK → projects.id, CASCADE | Project reference |
| reviewer_id | INTEGER | FK → users.id, SET NULL | Reviewer |
| status | VARCHAR(50) | NOT NULL | pending / approved / rejected / revision_requested |
| previous_status | VARCHAR(50) | NULL | Previous status |
| comments | TEXT | NULL | Reviewer comments |
| rejection_reason | TEXT | NULL | Rejection reason |
| created_at | TIMESTAMP | NOT NULL | Action timestamp |
| reviewed_at | TIMESTAMP | NULL | Review timestamp |

**Indexes**: project_id, reviewer_id, status, created_at

---

### 16. notifications
**Purpose**: User notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| user_id | INTEGER | FK → users.id, CASCADE | Recipient |
| type | VARCHAR(50) | NOT NULL | project_approved / project_rejected / comment_added / mention / system |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| project_id | INTEGER | FK → projects.id, CASCADE | Related project |
| comment_id | INTEGER | FK → comments.id, CASCADE | Related comment |
| action_url | VARCHAR(500) | NULL | Action link |
| is_read | INTEGER | NOT NULL, DEFAULT 0 | 1=read, 0=unread |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| read_at | TIMESTAMP | NULL | Read timestamp |

**Indexes**: user_id, type, is_read, created_at, project_id

---

## Resources

### 17. resources
**Purpose**: Resource library (policy docs, white papers, datasets)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Resource title |
| description | TEXT | NULL | Resource description |
| type | VARCHAR(100) | NOT NULL | Policy Document / White Paper / Report / Dataset / Research Paper |
| category | VARCHAR(100) | NOT NULL | Strategy / Ethics / Governance / Research / Data / Regulation |
| file_url | VARCHAR(500) | NULL | File URL |
| file_path | VARCHAR(500) | NULL | File path |
| file_size | BIGINT | NULL | Size in bytes |
| mime_type | VARCHAR(100) | NULL | MIME type |
| language | VARCHAR(50) | NULL | Language |
| author | VARCHAR(255) | NULL | Author |
| publisher | VARCHAR(255) | NULL | Publisher |
| publication_date | TIMESTAMP | NULL | Publication date |
| downloads | INTEGER | NOT NULL, DEFAULT 0 | Download count |
| views_count | INTEGER | NOT NULL, DEFAULT 0 | View count |
| is_featured | INTEGER | NOT NULL, DEFAULT 0 | 1=featured, 0=regular |
| is_published | INTEGER | NOT NULL, DEFAULT 1 | 1=published, 0=draft |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**: title, type, category, language, is_featured, is_published, created_at

---

## Entity Relationship Diagram (ERD)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   countries  │◄────────│organizations │◄────────│    users     │
└──────────────┘         └──────────────┘         └──────────────┘
       ▲                        ▲                         ▲
       │                        │                         │
       │                        │                         │
       │                 ┌──────▼──────┐                 │
       └─────────────────│   projects  │─────────────────┘
                         └─────────────┘
                          │  │  │  │  │
        ┌─────────────────┘  │  │  │  └─────────────────┐
        │                    │  │  │                     │
┌───────▼────────┐  ┌────────▼──▼──▼────────┐  ┌────────▼────────┐
│ project_sdgs   │  │ project_technologies  │  │  project_tags   │
│                │  │                       │  │                 │
│ project_id (FK)│  │ project_id (FK)       │  │ project_id (FK) │
│ sdg_id (FK)    │  │ technology_id (FK)    │  │ tag_id (FK)     │
└────────────────┘  └───────────────────────┘  └─────────────────┘
        │                    │                         │
        ▼                    ▼                         ▼
┌──────────────┐  ┌──────────────┐         ┌──────────────┐
│     sdgs     │  │ai_technologies│         │     tags     │
└──────────────┘  └──────────────┘         └──────────────┘

                         ┌─────────────┐
                         │   projects  │
                         └─────────────┘
                          │  │  │  │  │
        ┌─────────────────┘  │  │  │  └─────────────────┐
        │                    │  │  │                     │
┌───────▼────────┐  ┌────────▼──▼──▼────────┐  ┌────────▼────────┐
│project_documents│  │  project_images      │  │    comments     │
└─────────────────┘  └──────────────────────┘  └─────────────────┘

                         ┌─────────────┐
                         │   projects  │
                         └─────────────┘
                          │           │
                ┌─────────┘           └─────────┐
                │                                 │
        ┌───────▼────────┐              ┌────────▼────────┐
        │   approvals    │              │ notifications   │
        └────────────────┘              └─────────────────┘
```

---

## Migration Strategy

### Phase 1: Schema Creation
1. Run `migrations/001_create_new_schema.py`
2. Creates all new tables
3. Seeds reference data (sectors, SDGs, technologies)

### Phase 2: Data Migration
1. Run `migrations/002_migrate_existing_data.py`
2. Migrates countries
3. Migrates stakeholders → organizations
4. Migrates projects with proper FKs
5. Migrates technologies and SDGs to many-to-many

### Phase 3: Verification
1. Verify data integrity
2. Test all relationships
3. Check constraints and indexes

### Phase 4: Cleanup
1. Remove old columns after verification
2. Update API endpoints
3. Update frontend

---

## Performance Optimization

### Indexes
- All foreign keys are indexed
- Frequently queried columns (status, type, country_id, etc.) are indexed
- Composite indexes where needed

### Query Optimization
- Use eager loading for relationships
- Implement pagination for large result sets
- Use database-level aggregations

### Caching Strategy
- Cache reference data (sectors, SDGs, technologies, countries)
- Cache frequently accessed projects
- Implement Redis for session management

---

## Security Considerations

1. **SQL Injection**: Use parameterized queries (SQLAlchemy ORM)
2. **Access Control**: Role-based permissions (admin, moderator, organization)
3. **Data Validation**: Check constraints and Pydantic schemas
4. **Audit Trail**: Timestamps and approval history
5. **Soft Deletes**: is_active flags instead of hard deletes

---

## Backup & Recovery

1. **Daily Backups**: Automated PostgreSQL dumps
2. **Point-in-Time Recovery**: WAL archiving
3. **Testing**: Regular restore testing
4. **Retention**: 30-day backup retention

---

## Future Enhancements

1. **Full-Text Search**: PostgreSQL tsvector for advanced search
2. **Geospatial Queries**: PostGIS for location-based features
3. **Analytics**: Materialized views for dashboard performance
4. **Versioning**: Project version history
5. **Multilingual**: i18n support for content

---

## Contact & Support

For questions about the database schema, contact the development team or refer to the API documentation at `/docs`.
