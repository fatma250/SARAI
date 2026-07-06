# SARAI API Endpoints Documentation

## Base URL
```
Development: http://localhost:8000/api
Production: https://api.sarai.ai/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Users](#user-endpoints)
3. [Organizations](#organization-endpoints)
4. [Projects](#project-endpoints)
5. [Countries](#country-endpoints)
6. [Sectors](#sector-endpoints)
7. [SDGs](#sdg-endpoints)
8. [AI Technologies](#ai-technology-endpoints)
9. [Tags](#tag-endpoints)
10. [Documents](#document-endpoints)
11. [Images](#image-endpoints)
12. [Comments](#comment-endpoints)
13. [Notifications](#notification-endpoints)
14. [Resources](#resource-endpoints)
15. [Analytics](#analytics-endpoints)
16. [Admin](#admin-endpoints)
17. [Search](#search-endpoints)

---

## Authentication Endpoints

### Register User
```http
POST /api/users/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "organization_name": "AI Lab",
  "organization_type": "Research Lab",
  "phone": "+1234567890",
  "website": "https://ailab.com",
  "country": "Egypt",
  "city": "Cairo",
  "sector": "Research",
  "description": "Leading AI research lab"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "organization_name": "AI Lab",
  "role": "organization",
  "created_at": "2026-05-07T10:00:00Z"
}
```

### Login
```http
POST /api/users/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "organization"
  }
}
```

### Forgot Password
```http
POST /api/users/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

### Reset Password
```http
POST /api/users/reset-password/{token}
```

**Request Body:**
```json
{
  "password": "NewSecurePass123",
  "confirm_password": "NewSecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password has been reset successfully."
}
```

---

## User Endpoints

### Get User Profile
```http
GET /api/users/{user_id}
```
**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "organization_name": "AI Lab",
  "organization_id": 5,
  "role": "organization",
  "is_active": 1,
  "created_at": "2026-05-07T10:00:00Z"
}
```

### Update User Profile
```http
PUT /api/users/{user_id}
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "phone": "+9876543210",
  "website": "https://newsite.com",
  "description": "Updated description"
}
```

**Response:** `200 OK`

### Delete User
```http
DELETE /api/users/{user_id}
```
**Auth Required:** Yes (Admin only)

**Response:** `204 No Content`

---

## Organization Endpoints

### List Organizations
```http
GET /api/organizations?skip=0&limit=100&type=Research Lab&country_id=1
```

**Query Parameters:**
- `skip` (int): Pagination offset
- `limit` (int): Results per page
- `type` (string): Filter by organization type
- `country_id` (int): Filter by country
- `search` (string): Search in name and description

**Response:** `200 OK`
```json
{
  "total": 45,
  "page": 1,
  "per_page": 100,
  "data": [
    {
      "id": 1,
      "name": "Cairo AI Lab",
      "type": "Research Lab",
      "country_id": 1,
      "country": {
        "id": 1,
        "name": "Egypt"
      },
      "website": "https://cairoailab.com",
      "is_verified": 1,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Get Organization
```http
GET /api/organizations/{id}
```

**Response:** `200 OK`

### Create Organization
```http
POST /api/organizations
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Dubai AI Center",
  "type": "Research Lab",
  "country_id": 2,
  "email": "info@dubaiaic.ae",
  "website": "https://dubaiaic.ae",
  "description": "Leading AI research center in UAE"
}
```

**Response:** `201 Created`

### Update Organization
```http
PUT /api/organizations/{id}
```
**Auth Required:** Yes

### Delete Organization
```http
DELETE /api/organizations/{id}
```
**Auth Required:** Yes (Admin only)

---

## Project Endpoints

### List Projects
```http
GET /api/projects?skip=0&limit=20&status=approved&country_id=1&sector_id=2&search=healthcare
```

**Query Parameters:**
- `skip` (int): Pagination offset
- `limit` (int): Results per page
- `status` (string): Filter by status (approved, pending, rejected)
- `country_id` (int): Filter by country
- `sector_id` (int): Filter by sector
- `sdg_id` (int): Filter by SDG
- `technology_id` (int): Filter by AI technology
- `tag_id` (int): Filter by tag
- `search` (string): Full-text search
- `is_featured` (bool): Featured projects only
- `sort_by` (string): Sort field (created_at, views_count, title)
- `sort_order` (string): asc or desc

**Response:** `200 OK`
```json
{
  "total": 128,
  "page": 1,
  "per_page": 20,
  "pages": 7,
  "data": [
    {
      "id": 1,
      "title": "AI-Powered Healthcare Diagnosis",
      "description": "Machine learning system for medical diagnosis",
      "organization": {
        "id": 1,
        "name": "Cairo AI Lab"
      },
      "country": {
        "id": 1,
        "name": "Egypt"
      },
      "sector": {
        "id": 1,
        "name": "Healthcare"
      },
      "sdgs": [
        {"id": 1, "goal_number": 3, "name": "Good Health and Well-being"}
      ],
      "technologies": [
        {"id": 1, "name": "Machine Learning"},
        {"id": 2, "name": "Deep Learning"}
      ],
      "tags": [
        {"id": 1, "name": "medical"},
        {"id": 2, "name": "diagnosis"}
      ],
      "status": "approved",
      "is_featured": 1,
      "views_count": 1250,
      "created_at": "2026-03-15T10:00:00Z",
      "approved_at": "2026-03-16T14:30:00Z"
    }
  ]
}
```

### Get Project
```http
GET /api/projects/{id}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "AI-Powered Healthcare Diagnosis",
  "description": "Detailed description...",
  "organization": {...},
  "owner": {
    "id": 5,
    "email": "researcher@cairoailab.com"
  },
  "country": {...},
  "sector": {...},
  "sdgs": [...],
  "technologies": [...],
  "tags": [...],
  "documents": [
    {
      "id": 1,
      "title": "Research Paper",
      "filename": "paper.pdf",
      "file_url": "/uploads/documents/projects/paper.pdf",
      "file_size": 2048576,
      "document_type": "Research Paper"
    }
  ],
  "images": [
    {
      "id": 1,
      "filename": "screenshot.jpg",
      "file_url": "/uploads/images/projects/screenshot.jpg",
      "is_featured": 1,
      "caption": "System interface"
    }
  ],
  "comments_count": 12,
  "status": "approved",
  "views_count": 1250,
  "created_at": "2026-03-15T10:00:00Z"
}
```

### Create Project
```http
POST /api/projects
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Smart Agriculture System",
  "description": "AI-powered crop monitoring and prediction",
  "organization_id": 1,
  "country_id": 1,
  "sector_id": 4,
  "website": "https://smartagri.com",
  "year_of_implementation": 2025,
  "sdg_ids": [2, 13],
  "technology_ids": [1, 4],
  "tag_ids": [5, 8, 12]
}
```

**Response:** `201 Created`

### Update Project
```http
PUT /api/projects/{id}
```
**Auth Required:** Yes (Owner or Admin)

### Delete Project
```http
DELETE /api/projects/{id}
```
**Auth Required:** Yes (Owner or Admin)

### Increment Project Views
```http
POST /api/projects/{id}/view
```

**Response:** `200 OK`
```json
{
  "views_count": 1251
}
```

---

## Country Endpoints

### List Countries
```http
GET /api/countries
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Egypt",
    "code_alpha2": "EG",
    "code_alpha3": "EGY",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "region": "North Africa",
    "flag_url": "/flags/eg.svg"
  }
]
```

### Get Country
```http
GET /api/countries/{id}
```

### Get Country Projects
```http
GET /api/countries/{id}/projects
```

**Response:** `200 OK` - List of projects in that country

---

## Sector Endpoints

### List Sectors
```http
GET /api/sectors
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Healthcare",
    "description": "AI applications in healthcare and medical services",
    "icon_url": "/icons/healthcare.svg"
  }
]
```

### Get Sector
```http
GET /api/sectors/{id}
```

### Get Sector Projects
```http
GET /api/sectors/{id}/projects
```

---

## SDG Endpoints

### List SDGs
```http
GET /api/sdgs
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "goal_number": 1,
    "name": "No Poverty",
    "description": "End poverty in all its forms everywhere",
    "color_code": "#E5243B",
    "icon_url": "/sdgs/goal-1.svg"
  }
]
```

### Get SDG
```http
GET /api/sdgs/{id}
```

### Get SDG Projects
```http
GET /api/sdgs/{id}/projects
```

---

## AI Technology Endpoints

### List Technologies
```http
GET /api/technologies
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Machine Learning",
    "category": "ML",
    "description": "General machine learning algorithms and models",
    "icon_url": "/icons/ml.svg"
  }
]
```

### Get Technology
```http
GET /api/technologies/{id}
```

### Get Technology Projects
```http
GET /api/technologies/{id}/projects
```

---

## Tag Endpoints

### List Tags
```http
GET /api/tags
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "medical",
    "slug": "medical",
    "color_code": "#FF5733"
  }
]
```

### Create Tag
```http
POST /api/tags
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "robotics",
  "color_code": "#3498DB"
}
```

### Get Tag Projects
```http
GET /api/tags/{id}/projects
```

---

## Document Endpoints

### Upload Document
```http
POST /api/projects/{project_id}/documents
```
**Auth Required:** Yes
**Content-Type:** multipart/form-data

**Form Data:**
- `file` (file): Document file (PDF, DOCX, etc.)
- `title` (string): Document title
- `description` (string): Document description
- `document_type` (string): Report, White Paper, Dataset, Policy

**Response:** `201 Created`
```json
{
  "id": 1,
  "project_id": 1,
  "filename": "abc123_report.pdf",
  "original_filename": "research_report.pdf",
  "file_url": "/uploads/documents/projects/abc123_report.pdf",
  "file_size": 2048576,
  "mime_type": "application/pdf",
  "title": "Research Report 2026",
  "document_type": "Report",
  "uploaded_by": 5,
  "created_at": "2026-05-07T10:00:00Z"
}
```

### List Project Documents
```http
GET /api/projects/{project_id}/documents
```

### Delete Document
```http
DELETE /api/documents/{id}
```
**Auth Required:** Yes (Owner or Admin)

---

## Image Endpoints

### Upload Image
```http
POST /api/projects/{project_id}/images
```
**Auth Required:** Yes
**Content-Type:** multipart/form-data

**Form Data:**
- `file` (file): Image file (JPG, PNG, etc.)
- `alt_text` (string): Accessibility text
- `caption` (string): Image caption
- `is_featured` (bool): Set as featured image
- `display_order` (int): Display order

**Response:** `201 Created`

### List Project Images
```http
GET /api/projects/{project_id}/images
```

### Update Image
```http
PUT /api/images/{id}
```

### Delete Image
```http
DELETE /api/images/{id}
```
**Auth Required:** Yes (Owner or Admin)

---

## Comment Endpoints

### List Project Comments
```http
GET /api/projects/{project_id}/comments
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "project_id": 1,
    "user": {
      "id": 5,
      "organization_name": "Cairo AI Lab"
    },
    "content": "Great project! Very innovative approach.",
    "parent_id": null,
    "replies": [
      {
        "id": 2,
        "content": "Thank you!",
        "user": {...},
        "created_at": "2026-05-07T11:00:00Z"
      }
    ],
    "is_approved": 1,
    "created_at": "2026-05-07T10:30:00Z"
  }
]
```

### Create Comment
```http
POST /api/projects/{project_id}/comments
```
**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "This is a great project!",
  "parent_id": null
}
```

### Update Comment
```http
PUT /api/comments/{id}
```
**Auth Required:** Yes (Owner or Admin)

### Delete Comment
```http
DELETE /api/comments/{id}
```
**Auth Required:** Yes (Owner or Admin)

### Flag Comment
```http
POST /api/comments/{id}/flag
```
**Auth Required:** Yes

---

## Notification Endpoints

### List User Notifications
```http
GET /api/notifications?is_read=0
```
**Auth Required:** Yes

**Query Parameters:**
- `is_read` (bool): Filter by read status
- `type` (string): Filter by notification type

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "type": "project_approved",
    "title": "Project Approved",
    "message": "Your project 'AI Healthcare System' has been approved!",
    "project_id": 1,
    "action_url": "/projects/1",
    "is_read": 0,
    "created_at": "2026-05-07T10:00:00Z"
  }
]
```

### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
```
**Auth Required:** Yes

### Mark All as Read
```http
PUT /api/notifications/read-all
```
**Auth Required:** Yes

### Delete Notification
```http
DELETE /api/notifications/{id}
```
**Auth Required:** Yes

---

## Resource Endpoints

### List Resources
```http
GET /api/resources?type=White Paper&category=Strategy&language=en
```

**Query Parameters:**
- `type` (string): Filter by resource type
- `category` (string): Filter by category
- `language` (string): Filter by language
- `search` (string): Search in title and description

**Response:** `200 OK`

### Get Resource
```http
GET /api/resources/{id}
```

### Download Resource
```http
GET /api/resources/{id}/download
```

**Response:** File download + increments download counter

### Create Resource
```http
POST /api/resources
```
**Auth Required:** Yes (Admin only)

---

## Analytics Endpoints

### Overview Statistics
```http
GET /api/analytics/overview
```

**Response:** `200 OK`
```json
{
  "total_projects": 128,
  "total_organizations": 45,
  "total_users": 67,
  "total_countries": 22,
  "approved_projects": 98,
  "pending_projects": 15,
  "rejected_projects": 15
}
```

### Projects by Country
```http
GET /api/analytics/projects-by-country
```

**Response:** `200 OK`
```json
[
  {
    "country_id": 1,
    "country_name": "Egypt",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "project_count": 35
  }
]
```

### Projects by Sector
```http
GET /api/analytics/projects-by-sector
```

### Projects by SDG
```http
GET /api/analytics/projects-by-sdg
```

### Projects by Technology
```http
GET /api/analytics/projects-by-technology
```

### Organizations by Type
```http
GET /api/analytics/organizations-by-type
```

### Trending Projects
```http
GET /api/analytics/trending?days=7&limit=10
```

**Response:** Most viewed projects in last N days

---

## Admin Endpoints

### Admin Dashboard
```http
GET /api/admin/dashboard
```
**Auth Required:** Yes (Admin only)

**Response:** `200 OK`
```json
{
  "pending_projects": 15,
  "pending_comments": 3,
  "total_users": 67,
  "total_organizations": 45,
  "recent_activity": [...]
}
```

### List Pending Projects
```http
GET /api/admin/projects/pending
```
**Auth Required:** Yes (Admin only)

### Approve Project
```http
PUT /api/admin/projects/{id}/approve
```
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "comments": "Great project, approved!"
}
```

**Response:** `200 OK`

### Reject Project
```http
PUT /api/admin/projects/{id}/reject
```
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "rejection_reason": "Insufficient documentation",
  "comments": "Please provide more details about the methodology."
}
```

### Request Revision
```http
PUT /api/admin/projects/{id}/request-revision
```
**Auth Required:** Yes (Admin only)

### List All Users
```http
GET /api/admin/users?role=organization&is_active=1
```
**Auth Required:** Yes (Admin only)

### Activate/Deactivate User
```http
PUT /api/admin/users/{id}/activate
PUT /api/admin/users/{id}/deactivate
```
**Auth Required:** Yes (Admin only)

### Change User Role
```http
PUT /api/admin/users/{id}/role
```
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "role": "moderator"
}
```

### List Flagged Comments
```http
GET /api/admin/comments/flagged
```
**Auth Required:** Yes (Admin only)

### Approve Comment
```http
PUT /api/admin/comments/{id}/approve
```
**Auth Required:** Yes (Admin only)

---

## Search Endpoints

### Global Search
```http
GET /api/search?q=healthcare AI&filters=country:1,sector:2&sort=relevance
```

**Query Parameters:**
- `q` (string): Search query
- `filters` (string): Comma-separated filters (country:id, sector:id, sdg:id, tech:id)
- `sort` (string): Sort by (relevance, date, views)
- `skip` (int): Pagination offset
- `limit` (int): Results per page

**Response:** `200 OK`
```json
{
  "total": 25,
  "query": "healthcare AI",
  "results": [
    {
      "type": "project",
      "id": 1,
      "title": "AI-Powered Healthcare Diagnosis",
      "description": "...",
      "relevance_score": 0.95,
      "highlight": "...AI-powered <mark>healthcare</mark> diagnosis..."
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Validation error: email is required"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Admin access required"
}
```

### 404 Not Found
```json
{
  "detail": "Project not found"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Admin**: 5000 requests/hour

---

## Pagination

All list endpoints support pagination:
- `skip`: Offset (default: 0)
- `limit`: Results per page (default: 20, max: 100)

Response includes:
```json
{
  "total": 128,
  "page": 1,
  "per_page": 20,
  "pages": 7,
  "data": [...]
}
```

---

## Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

**Last Updated**: 2026-05-07
**API Version**: 2.0.0
