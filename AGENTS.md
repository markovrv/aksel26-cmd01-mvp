# Industrial Tourism Platform - MVP

## Project Overview

Интерактивная платформа для промышленного туризма Кировской области, которая соединяет студентов с предприятиями через систему кейсов.

### Key Features
- ✅ Регистрация и аутентификация (студент/компания/администратор)
- ✅ Размещение кейсов предприятиями
- ✅ Просмотр каталога кейсов студентами
- ✅ Отправка решений (текст + файлы)
- ✅ Управление решениями компаниями
- ✅ Базовая админ-панель для модерации

### Tech Stack
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Vite
- **Authentication**: JWT Tokens
- **File Storage**: Local filesystem

## Quick Start

### Prerequisites
- Node.js 16+
- npm

### Installation & Running

#### Start Backend Server
```bash
cd server
npm install
npm start
```
Server runs on: `http://localhost:5000`

#### Start Frontend Client
```bash
cd client
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Client runs on: `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - Get all active cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create new case (company only)
- `PUT /api/cases/:id` - Update case (company only)

### Solutions
- `POST /api/solutions` - Submit solution (student only)
- `GET /api/cases/:caseId/solutions` - Get case solutions (company only)
- `PUT /api/solutions/:id` - Update solution status (company only)
- `GET /api/student/solutions` - Get student's solutions (student only)

### Admin
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/cases` - Get all cases
- `DELETE /api/admin/cases/:id` - Delete case

## Database Schema

### Users Table
- `id` - UUID
- `email` - Unique email
- `password` - Hashed password
- `name` - Full name
- `role` - student | company | admin
- `university` - University name (students)
- `specialization` - Field of study (students)
- `company_name` - Company name (companies)
- `company_description` - Company description (companies)

### Cases Table
- `id` - UUID
- `company_id` - Foreign key to users
- `title` - Case title
- `description` - Full description
- `requirements` - Requirements text
- `deadline` - Submission deadline
- `status` - active | closed | hidden
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Solutions Table
- `id` - UUID
- `case_id` - Foreign key to cases
- `student_id` - Foreign key to users
- `text_content` - Text solution
- `file_path` - Path to uploaded file
- `file_name` - Original filename
- `status` - submitted | reviewed | rejected
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## User Flows

### Student Journey
1. Register as student
2. View all active cases in catalog
3. Select a case of interest
4. Read case description and requirements
5. Submit solution (text and/or file)
6. View submission status in dashboard

### Company Journey
1. Register as company
2. Create new case with title, description, requirements, deadline
3. View submitted solutions for each case
4. Review student solutions and update status
5. Manage cases on company dashboard

### Admin Journey
1. Access admin panel
2. View all registered users
3. View all created cases
4. Moderate users and cases (delete if needed)
5. Monitor platform activity

## File Structure

```
industrial-tourism-platform/
├── server/
│   ├── auth.js - Authentication utilities
│   ├── database.js - Database initialization and utilities
│   ├── server.js - Main Express server and API endpoints
│   ├── data/ - SQLite database storage
│   ├── uploads/ - User-uploaded files
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx, Register.jsx
│   │   │   ├── CasesList.jsx, CaseDetail.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CompanyDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/
│   │   │   └── Navigation.jsx
│   │   ├── api.js - API client
│   │   ├── App.jsx - Main app component
│   │   └── main.jsx - React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── .gitignore
```

## Testing Accounts

For testing, you can create accounts with these roles:
- **Student**: Register with role "student"
- **Company**: Register with role "company"
- **Admin**: First admin account created gets admin role (manage via database)

## Notes

- JWT tokens expire after 30 days
- Files are stored in `/server/uploads/`
- Database is SQLite at `/server/data/platform.db`
- No authentication required for viewing cases
- Authentication required for all other operations

## Future Enhancements

- Add rating/review system
- Implement automated solution checking
- HR service integrations
- Mobile app
- Payment system for premium features
- Email notifications
- Advanced analytics dashboard
- AR/VR tour support
