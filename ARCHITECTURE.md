# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│                     Port: 5173                              │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ Authentication   │  │ Case Management  │  │  Admin    │ │
│  │ (Login/Register) │  │ (List/View/Create)  │  Panel    │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Student Dashboard│  │ Company Dashboard              │
│  │ (Solutions)      │  │ (Cases + Solutions)            │
│  └──────────────────┘  └──────────────────┘                │
└──────────────────────────────────────────────────────────────┘
              │
              │ HTTP/REST API + JWT Auth
              │
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                       │
│                    Port: 5000                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Routes                                │ │
│  │  • /api/auth/* - Authentication                       │ │
│  │  • /api/cases/* - Case Management                     │ │
│  │  • /api/solutions/* - Solution Management             │ │
│  │  • /api/admin/* - Administration                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Middleware & Services                        │ │
│  │  • Authentication (JWT validation)                    │ │
│  │  • Authorization (Role-based access)                  │ │
│  │  • File Upload (Multer)                               │ │
│  │  • Database Operations                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
              │
              │ SQL Queries
              │
┌──────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite)                          │
│                   Path: /server/data/platform.db             │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐   │
│  │    Users       │  │     Cases      │  │  Solutions  │   │
│  │  • id          │  │  • id          │  │  • id       │   │
│  │  • email       │  │  • company_id  │  │  • case_id  │   │
│  │  • password    │  │  • title       │  │  • student  │   │
│  │  • role        │  │  • description │  │  • text_    │   │
│  │  • university  │  │  • deadline    │  │    content  │   │
│  │  • company_    │  │  • status      │  │  • file_    │   │
│  │    name        │  │                │  │    path     │   │
│  └────────────────┘  └────────────────┘  └─────────────┘   │
│                                                              │
│  ┌────────────────┐                                          │
│  │    Sessions    │                                          │
│  │  • id          │                                          │
│  │  • user_id     │                                          │
│  │  • token       │                                          │
│  │  • expires_at  │                                          │
│  └────────────────┘                                          │
└──────────────────────────────────────────────────────────────┘
              │
              │ Files
              │
┌──────────────────────────────────────────────────────────────┐
│              FILE STORAGE (Local Filesystem)                 │
│              Path: /server/uploads/                          │
│                                                              │
│  Student solution files (PDFs, documents, code files, etc)  │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Case Submission Flow
```
Student
   │
   ├─→ View Cases (GET /api/cases)
   │       ↓
   ├─→ View Case Details (GET /api/cases/:id)
   │       ↓
   ├─→ Submit Solution (POST /api/solutions)
   │   ├─→ Validate JWT Token
   │   ├─→ Check Student Role
   │   ├─→ Upload File (if provided)
   │   ├─→ Save Solution to Database
   │   └─→ Return Solution ID
   │
   └─→ View My Solutions (GET /api/student/solutions)
           ↓
           Dashboard shows submission status
```

### Case Review Flow
```
Company
   │
   ├─→ Create Case (POST /api/cases)
   │   ├─→ Validate JWT Token
   │   ├─→ Check Company Role
   │   ├─→ Save Case to Database
   │   └─→ Return Case ID
   │
   ├─→ View My Cases (GET /api/cases/company/:id)
   │   └─→ List all cases created by company
   │
   ├─→ View Solutions (GET /api/cases/:caseId/solutions)
   │   ├─→ Fetch all solutions for case
   │   ├─→ Join with student information
   │   └─→ Return solution list with student details
   │
   └─→ Update Solution Status (PUT /api/solutions/:id)
       ├─→ Validate JWT Token
       ├─→ Check Company Role
       ├─→ Verify company owns the case
       ├─→ Update status in database
       └─→ Return updated solution
```

### Admin Moderation Flow
```
Admin
   │
   ├─→ Get All Users (GET /api/admin/users)
   │   └─→ List all registered users with roles
   │
   ├─→ Delete User (DELETE /api/admin/users/:id)
   │   ├─→ Validate Admin Role
   │   ├─→ Delete user from database
   │   └─→ Return confirmation
   │
   ├─→ Get All Cases (GET /api/admin/cases)
   │   └─→ List all cases with company info
   │
   └─→ Delete Case (DELETE /api/admin/cases/:id)
       ├─→ Validate Admin Role
       ├─→ Delete case and related solutions
       └─→ Return confirmation
```

## Authentication & Security

### JWT Token Flow
```
1. User Registration/Login
   ↓
2. Backend generates JWT token (valid for 30 days)
3. Token stored in browser localStorage
4. Token sent with every API request in Authorization header
5. Backend validates token signature and expiration
6. If valid, request processed; if invalid, return 401
```

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Stored as hash in database (plaintext never stored)
- Compared during login with bcrypt.compare()

### Role-Based Access Control (RBAC)
```
Student:
  ✓ View cases
  ✓ Submit solutions
  ✓ View own solutions
  ✗ Create cases
  ✗ Delete cases

Company:
  ✓ View cases
  ✓ Create cases
  ✓ Update own cases
  ✓ View solutions for own cases
  ✓ Update solution status
  ✗ Delete cases (admin only)
  ✗ Moderate users (admin only)

Admin:
  ✓ All operations
  ✓ Delete users
  ✓ Delete cases
  ✓ View all data
```

## Scalability Considerations

### Current Limitations (MVP)
- Single SQLite database (not suitable for concurrent writes)
- Local file storage (not scalable)
- No caching layer
- No database indexing

### Future Improvements
1. **Database**: Migrate to PostgreSQL with connection pooling
2. **File Storage**: Move to cloud storage (S3, Google Cloud Storage)
3. **Caching**: Add Redis for session and data caching
4. **Search**: Implement Elasticsearch for case search
5. **Analytics**: Add event logging and analytics
6. **API**: Rate limiting and request throttling
7. **Load Balancing**: Multiple backend instances with load balancer
8. **CDN**: Static asset delivery via CDN

## Error Handling

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

### Error Response Format
```json
{
  "error": "Human-readable error message"
}
```

## Technology Justification

### Why SQLite?
- ✓ Zero configuration
- ✓ No separate server needed
- ✓ Perfect for MVP with <1000 concurrent users
- ✗ Limited concurrent writes
- ✗ Not suitable for production scale

### Why Express.js?
- ✓ Lightweight and flexible
- ✓ Large ecosystem
- ✓ Easy to learn and extend
- ✓ Perfect for MVP development

### Why React?
- ✓ Component-based architecture
- ✓ Great for rapid development
- ✓ Vite provides fast development experience
- ✓ Easy to refactor and scale

### Why JWT?
- ✓ Stateless authentication
- ✓ No session storage needed
- ✓ Good for future mobile app
- ✓ Standard industry practice
