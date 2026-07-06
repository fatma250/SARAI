# SARAI Platform - Entity Relationship Diagram

## Complete Database Schema Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SARAI DATABASE SCHEMA                              │
│                    (Stocktaking of Arab Regional AI Initiatives)             │
└─────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────┐
│      countries       │
├──────────────────────┤
│ PK  id               │
│     name             │
│     code_alpha2      │
│     code_alpha3      │
│     latitude         │
│     longitude        │
│     region           │
│     flag_url         │
│     description      │
│     created_at       │
│     updated_at       │
└──────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌──────────────────────┐         ┌──────────────────────┐
│   organizations      │         │        users         │
├──────────────────────┤         ├──────────────────────┤
│ PK  id               │◄────────│ PK  id               │
│     name             │ 1     N │     email            │
│     type             │         │     password_hash    │
│     category         │         │ FK  organization_id  │
│ FK  country_id       │         │     role             │
│     email            │         │     is_active        │
│     phone            │         │     phone            │
│     website          │         │     website          │
│     city             │         │     country          │
│     address          │         │     city             │
│     sector           │         │     address          │
│     description      │         │     sector           │
│     logo_url         │         │     description      │
│     is_active        │         │     logo             │
│     is_verified      │         │     reset_token      │
│     created_at       │         │     reset_token_exp  │
│     updated_at       │         │     created_at       │
└──────────────────────┘         │     updated_at       │
         │                       │     last_login       │
         │ 1                     └──────────────────────┘
         │                                │
         │ N                              │ 1
         ▼                                │
┌──────────────────────┐                 │ N
│      sectors         │                 ▼
├──────────────────────┤         ┌──────────────────────┐
│ PK  id               │◄────────│      projects        │
│     name             │ 1     N ├──────────────────────┤
│     description      │         │ PK  id               │
│     icon_url         │         │     title            │
│     created_at       │         │     description      │
│     updated_at       │         │ FK  organization_id  │
└──────────────────────┘         │ FK  user_id          │
                                 │ FK  country_id       │
                                 │ FK  sector_id        │
                                 │     website          │
                                 │     year_of_impl     │
                                 │     start_date       │
                                 │     end_date         │
                                 │     status           │
                                 │     is_featured      │
                                 │     is_published     │
                                 │     views_count      │
                                 │     created_at       │
                                 │     updated_at       │
                                 │     published_at     │
                                 │     approved_at      │
                                 └──────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    │ 1                   │ 1                   │ 1
                    │                     │                     │
                    │ N                   │ N                   │ N
                    ▼                     ▼                     ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │  project_sdgs    │  │project_technologies│  │  project_tags    │
         ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
         │ PK  id           │  │ PK  id           │  │ PK  id           │
         │ FK  project_id   │  │ FK  project_id   │  │ FK  project_id   │
         │ FK  sdg_id       │  │ FK  technology_id│  │ FK  tag_id       │
         │     created_at   │  │     created_at   │  │     created_at   │
         └──────────────────┘  └──────────────────┘  └──────────────────┘
                  │                      │                      │
                  │ N                    │ N                    │ N
                  │                      │                      │
                  │ 1                    │ 1                    │ 1
                  ▼                      ▼                      ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │       sdgs       │  │ ai_technologies  │  │       tags       │
         ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
         │ PK  id           │  │ PK  id           │  │ PK  id           │
         │     goal_number  │  │     name         │  │     name         │
         │     name         │  │     description  │  │     slug         │
         │     description  │  │     category     │  │     color_code   │
         │     icon_url     │  │     icon_url     │  │     created_at   │
         │     color_code   │  │     created_at   │  │     updated_at   │
         │     created_at   │  │     updated_at   │  └──────────────────┘
         │     updated_at   │  └──────────────────┘
         └──────────────────┘


                         ┌──────────────────────┐
                         │      projects        │
                         └──────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    │ 1           │ 1           │ 1
                    │             │             │
                    │ N           │ N           │ N
                    ▼             ▼             ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │project_documents │  │  project_images  │  │    comments      │
         ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
         │ PK  id           │  │ PK  id           │  │ PK  id           │
         │ FK  project_id   │  │ FK  project_id   │  │ FK  project_id   │
         │     filename     │  │     filename     │  │ FK  user_id      │
         │     orig_filename│  │     orig_filename│  │ FK  parent_id    │
         │     file_path    │  │     file_path    │  │     content      │
         │     file_url     │  │     file_url     │  │     is_approved  │
         │     file_size    │  │     file_size    │  │     is_flagged   │
         │     mime_type    │  │     mime_type    │  │     created_at   │
         │     title        │  │     width        │  │     updated_at   │
         │     description  │  │     height       │  └──────────────────┘
         │     doc_type     │  │     alt_text     │
         │ FK  uploaded_by  │  │     caption      │
         │     created_at   │  │     display_order│
         │     updated_at   │  │     is_featured  │
         └──────────────────┘  │ FK  uploaded_by  │
                               │     created_at   │
                               │     updated_at   │
                               └──────────────────┘


                         ┌──────────────────────┐
                         │      projects        │
                         └──────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    │ 1                         │ 1
                    │                           │
                    │ N                         │ N
                    ▼                           ▼
         ┌──────────────────┐        ┌──────────────────┐
         │    approvals     │        │  notifications   │
         ├──────────────────┤        ├──────────────────┤
         │ PK  id           │        │ PK  id           │
         │ FK  project_id   │        │ FK  user_id      │
         │ FK  reviewer_id  │        │     type         │
         │     status       │        │     title        │
         │     prev_status  │        │     message      │
         │     comments     │        │ FK  project_id   │
         │     reject_reason│        │ FK  comment_id   │
         │     created_at   │        │     action_url   │
         │     reviewed_at  │        │     is_read      │
         └──────────────────┘        │     created_at   │
                                     │     read_at      │
                                     └──────────────────┘


┌──────────────────────┐
│      resources       │
├──────────────────────┤
│ PK  id               │
│     title            │
│     description      │
│     type             │
│     category         │
│     file_url         │
│     file_path        │
│     file_size        │
│     mime_type        │
│     language         │
│     author           │
│     publisher        │
│     publication_date │
│     downloads        │
│     views_count      │
│     is_featured      │
│     is_published     │
│     created_at       │
│     updated_at       │
└──────────────────────┘


┌──────────────────────┐
│   stakeholders       │  ← DEPRECATED (use organizations)
├──────────────────────┤
│ PK  id               │
│     name             │
│     type             │
│     category         │
│     country          │
│     website          │
│     description      │
│     contact_email    │
│     created_at       │
│     updated_at       │
└──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              RELATIONSHIP SUMMARY
═══════════════════════════════════════════════════════════════════════════════

ONE-TO-MANY RELATIONSHIPS:
├─ countries → organizations (1:N)
├─ countries → projects (1:N)
├─ organizations → users (1:N)
├─ organizations → projects (1:N)
├─ users → projects (1:N)
├─ users → comments (1:N)
├─ users → notifications (1:N)
├─ sectors → projects (1:N)
├─ projects → project_documents (1:N)
├─ projects → project_images (1:N)
├─ projects → comments (1:N)
├─ projects → approvals (1:N)
└─ comments → comments (1:N) [self-referencing for threading]

MANY-TO-MANY RELATIONSHIPS:
├─ projects ↔ sdgs (via project_sdgs)
├─ projects ↔ ai_technologies (via project_technologies)
└─ projects ↔ tags (via project_tags)

═══════════════════════════════════════════════════════════════════════════════
                              CASCADING RULES
═══════════════════════════════════════════════════════════════════════════════

ON DELETE CASCADE:
├─ projects → project_sdgs
├─ projects → project_technologies
├─ projects → project_tags
├─ projects → project_documents
├─ projects → project_images
├─ projects → comments
├─ projects → approvals
├─ users → projects
├─ users → comments
└─ users → notifications

ON DELETE SET NULL:
├─ countries → organizations
├─ countries → projects
├─ organizations → projects
├─ sectors → projects
├─ users → project_documents (uploaded_by)
├─ users → project_images (uploaded_by)
└─ users → approvals (reviewer_id)

═══════════════════════════════════════════════════════════════════════════════
                              KEY INDEXES
═══════════════════════════════════════════════════════════════════════════════

UNIQUE INDEXES:
├─ users.email
├─ users.reset_token
├─ countries.name
├─ countries.code_alpha2
├─ countries.code_alpha3
├─ sectors.name
├─ sdgs.goal_number
├─ ai_technologies.name
├─ tags.name
├─ tags.slug
└─ Composite: (project_id, sdg_id), (project_id, technology_id), (project_id, tag_id)

PERFORMANCE INDEXES:
├─ projects.title
├─ projects.status
├─ projects.is_featured
├─ projects.is_published
├─ projects.created_at
├─ projects.published_at
├─ organizations.name
├─ organizations.type
├─ comments.created_at
├─ comments.is_approved
├─ notifications.is_read
└─ All foreign key columns

═══════════════════════════════════════════════════════════════════════════════
                              DATA CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

CHECK CONSTRAINTS:
├─ users.role IN ('organization', 'admin', 'moderator')
├─ users.is_active IN (0, 1)
├─ organizations.type IN ('Research Lab', 'Startup', 'Government', 'University', 'NGO', 'Company')
├─ organizations.is_active IN (0, 1)
├─ organizations.is_verified IN (0, 1)
├─ sdgs.goal_number BETWEEN 1 AND 17
├─ projects.status IN ('pending', 'approved', 'rejected', 'revision_requested', 'draft')
├─ projects.is_featured IN (0, 1)
├─ projects.is_published IN (0, 1)
├─ projects.views_count >= 0
├─ project_images.is_featured IN (0, 1)
├─ comments.is_approved IN (0, 1)
├─ comments.is_flagged IN (0, 1)
├─ approvals.status IN ('pending', 'approved', 'rejected', 'revision_requested')
├─ notifications.type IN ('project_approved', 'project_rejected', 'comment_added', 'mention', 'system', 'revision_requested')
├─ notifications.is_read IN (0, 1)
├─ resources.type IN ('Policy Document', 'White Paper', 'Report', 'Dataset', 'Research Paper', 'Guide', 'Toolkit')
├─ resources.category IN ('Strategy', 'Ethics', 'Governance', 'Research', 'Data', 'Regulation', 'Education', 'Technical')
├─ resources.downloads >= 0
├─ resources.views_count >= 0
├─ resources.is_featured IN (0, 1)
└─ resources.is_published IN (0, 1)

═══════════════════════════════════════════════════════════════════════════════
                              STATISTICS
═══════════════════════════════════════════════════════════════════════════════

Total Tables: 17
├─ Core Entities: 7 (users, organizations, countries, sectors, sdgs, ai_technologies, tags)
├─ Main Entity: 1 (projects)
├─ Junction Tables: 3 (project_sdgs, project_technologies, project_tags)
├─ Attachments: 2 (project_documents, project_images)
├─ Engagement: 3 (comments, approvals, notifications)
├─ Resources: 1 (resources)
└─ Legacy: 1 (stakeholders - deprecated)

Total Relationships: 25+
├─ One-to-Many: 13
├─ Many-to-Many: 3
└─ Self-Referencing: 1

Total Indexes: 50+
├─ Primary Keys: 17
├─ Foreign Keys: 20+
├─ Unique Constraints: 10+
└─ Performance Indexes: 20+

Total Constraints: 30+
├─ Check Constraints: 25+
├─ Unique Constraints: 10+
└─ Foreign Key Constraints: 20+

═══════════════════════════════════════════════════════════════════════════════
```

## Legend

```
┌─────────┐
│  Table  │  = Database Table
└─────────┘

PK = Primary Key
FK = Foreign Key

│  = One-to-Many Relationship (vertical)
─  = One-to-Many Relationship (horizontal)
◄─ = Foreign Key Direction
▼  = Relationship Direction

1  = One (parent)
N  = Many (children)

CASCADE = Delete children when parent is deleted
SET NULL = Set FK to NULL when parent is deleted
```

## Quick Reference

### Core Workflow
1. **User** registers and creates account
2. **User** links to **Organization** (optional)
3. **User** creates **Project**
4. **Project** is linked to:
   - **Organization** (who owns it)
   - **Country** (where it's located)
   - **Sector** (what industry)
   - **SDGs** (which goals it addresses) - many-to-many
   - **Technologies** (which AI techs it uses) - many-to-many
   - **Tags** (custom categorization) - many-to-many
5. **Project** can have:
   - **Documents** (PDFs, reports)
   - **Images** (screenshots, logos)
   - **Comments** (feedback)
   - **Approvals** (workflow history)
6. **Admin** reviews and approves **Project**
7. **User** receives **Notification** about approval
8. **Project** appears in public listing

### Data Flow
```
User Registration → Organization Link → Project Creation → 
File Uploads → Admin Review → Approval → Notification → 
Public Display → Comments → Analytics
```

---

**Last Updated**: 2026-05-07
**Version**: 2.0.0 (Refactored Schema)
