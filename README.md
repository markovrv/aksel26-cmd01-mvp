# 🏭 Industrial Tourism Platform - MVP

Цифровая платформа для связи студентов Кировской области с промышленными предприятиями региона через систему практических кейсов и экскурсий.

## 🎯 Key Features

- ✅ **User Authentication** - Регистрация и вход для студентов, компаний и администраторов
- ✅ **Case Management** - Компании размещают практические задачи (кейсы)
- ✅ **Solution Submission** - Студенты отправляют решения с текстом и файлами
- ✅ **Solution Review** - Компании просматривают и оценивают решения студентов
- ✅ **Admin Panel** - Модерация пользователей и контента платформы
- ✅ **Real-time Feedback** - Обновление статуса решений в реальном времени

## 🏗️ Architecture

**Frontend**: React + Vite (SPA)  
**Backend**: Node.js + Express (REST API)  
**Database**: SQLite (для MVP)  
**Authentication**: JWT Tokens  
**File Storage**: Local filesystem

Подробнее: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm 7 or higher

### Installation

```bash
# Clone/Extract the project
cd industrial-tourism-platform

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Application

#### Terminal 1 - Start Backend Server
```bash
cd server
npm start
# Server will run on http://localhost:5000
```

#### Terminal 2 - Start Frontend Dev Server
```bash
cd client
npm run dev -- --host 0.0.0.0 --port 5173
# Client will run on http://localhost:5173
```

Or use the Preview URL: `https://5173-3dba6d8b-400a-4c52-b98a-1616f70d3280.preview.promto.ai`

## 🧪 Testing the Platform

### Create Test Accounts

1. **Open the app** in your browser
2. **Click "Register"**
3. **Create Student Account:**
   - Email: `student@example.com`
   - Password: `password123`
   - Role: Student
   - University: Your University
   - Specialization: Computer Science

4. **Create Company Account:**
   - Email: `company@example.com`
   - Password: `password123`
   - Role: Company
   - Company Name: Sample Company
   - Description: Test company

### Test User Flows

#### As a Student:
1. Login with student account
2. Go to "Cases" tab
3. Click on a case to see details
4. Click "Submit Solution"
5. Enter your solution (text and/or upload a file)
6. Go to "My Dashboard" to track submissions

#### As a Company:
1. Login with company account
2. Go to "Company Dashboard"
3. Click "Create New Case"
4. Fill in case details and set deadline
5. Wait for students to submit solutions
6. Click on a case to see submitted solutions
7. Review solutions and change their status

#### As Admin:
1. Create an admin account via database directly or API
2. Go to "Admin Panel"
3. View all users and delete if needed
4. View all cases and delete if needed

## 📚 Documentation

- **[AGENTS.md](./AGENTS.md)** - Project overview and quick reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and data flow
- **[SAMPLE_DATA.md](./SAMPLE_DATA.md)** - Example API calls and test data

## 📁 Project Structure

```
industrial-tourism-platform/
├── server/                          # Backend Application
│   ├── auth.js                     # Authentication utilities
│   ├── database.js                 # Database initialization
│   ├── server.js                   # Express server & API routes
│   ├── data/                       # SQLite database
│   ├── uploads/                    # Uploaded student files
│   └── package.json
│
├── client/                          # Frontend Application
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CasesList.jsx
│   │   │   ├── CaseDetail.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CompanyDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/             # Reusable components
│   │   │   └── Navigation.jsx
│   │   ├── api.js                  # API client
│   │   ├── App.jsx                 # Main app
│   │   └── main.jsx                # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── AGENTS.md                        # Project overview
├── ARCHITECTURE.md                  # System design
├── SAMPLE_DATA.md                   # Test data examples
├── README.md                        # This file
└── .gitignore
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/logout         - Logout user
GET    /api/auth/me             - Get current user
```

### Cases
```
GET    /api/cases               - Get all active cases
GET    /api/cases/:id           - Get case details
GET    /api/cases/company/:id   - Get company's cases
POST   /api/cases               - Create new case
PUT    /api/cases/:id           - Update case
```

### Solutions
```
POST   /api/solutions           - Submit solution
GET    /api/cases/:caseId/solutions  - Get case solutions
PUT    /api/solutions/:id       - Update solution status
GET    /api/student/solutions   - Get student's solutions
```

### Admin
```
GET    /api/admin/users         - Get all users
DELETE /api/admin/users/:id     - Delete user
GET    /api/admin/cases         - Get all cases
DELETE /api/admin/cases/:id     - Delete case
```

## 🔐 Authentication

All requests (except login/register and public case listing) require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Tokens are stored in browser localStorage and automatically sent with requests.

## 🗄️ Database

SQLite database is automatically created in `server/data/platform.db`

**Tables:**
- `users` - User accounts and profiles
- `cases` - Company-created cases
- `solutions` - Student solutions
- `sessions` - Active user sessions

## 📤 File Upload

Student solution files are stored in `server/uploads/`

**Supported:**
- All file types
- Max file size: 50MB

## ⚙️ Environment Variables

Currently using defaults. For production, create `.env` file:

```
# server/.env
PORT=5000
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

## 🚢 Deployment

### Docker Quick Deploy

#### Windows
```powershell
.\deploy.bat
```

#### Linux / macOS
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Manual Docker Compose
```bash
docker-compose up --build -d
```

### Docker Services URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Adminer**: http://localhost:8080 (database management)

### Deploy Commands
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### To Vercel (Frontend)
```bash
vercel deploy
```

### To Heroku (Backend)
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

## 📊 Success Metrics (MVP Goals)

- [ ] 50+ registered students
- [ ] 3-5 company partners
- [ ] 30+ submitted solutions
- [ ] Platform actively used for 1 month

## 🐛 Known Limitations

1. SQLite has poor concurrent write support - upgrade to PostgreSQL for production
2. File storage is local - use cloud storage (S3) for scale
3. No email notifications - implement SendGrid/Mailgun
4. No rate limiting - add express-rate-limit
5. No caching - add Redis for performance

## 🔮 Future Enhancements

- [ ] Email notifications for new cases
- [ ] Student ratings and reviews
- [ ] Advanced search and filtering
- [ ] Mobile app (React Native)
- [ ] AR/VR company tours
- [ ] Payment system for premium features
- [ ] AI-powered job recommendations
- [ ] Video case presentations
- [ ] Real-time chat between students and companies
- [ ] Gamification (badges, leaderboards)

## 📞 Support

For issues or questions:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Check [SAMPLE_DATA.md](./SAMPLE_DATA.md) for API examples
3. Review error messages in browser console

## 📝 License

MIT License - See project guidelines

---

**Made with ❤️ for Industrial Tourism Platform**

Last Updated: 2026-04-21
