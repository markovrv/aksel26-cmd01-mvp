# Getting Started Guide

## ✅ System Status

Your Industrial Tourism Platform MVP is running and ready to use!

- **Backend Server**: Running on http://localhost:5000 ✅
- **Frontend App**: Running on http://localhost:5173 ✅

## 🌐 How to Access

Open your browser and navigate to:
```
http://localhost:5173
```

## 👤 Step 1: Create Your First Account

### Option A: Register as a Student
1. Click on "Register" link on login page
2. Select "Student" as account type
3. Fill in your details:
   - Full Name: Your name
   - Email: your.email@example.com
   - Password: Choose a secure password
   - University: Your university name
   - Specialization: Your field of study
4. Click "Register"

### Option B: Register as a Company
1. Click on "Register" link on login page
2. Select "Company" as account type
3. Fill in your details:
   - Full Name: Your name
   - Email: company.email@example.com
   - Password: Choose a secure password
   - Company Name: Your company name
   - Company Description: Brief description
4. Click "Register"

## 📋 Step 2: Explore the Platform

### If You're a Student:
1. **Browse Cases**
   - Click "Cases" in the navigation
   - Browse available cases from companies
   - Click on any case to see full details

2. **Submit a Solution**
   - Open a case detail page
   - Scroll to "Submit Your Solution" section
   - Add your solution text and/or upload a file
   - Click "Submit Solution"

3. **Track Progress**
   - Go to "My Dashboard"
   - See all your submitted solutions
   - Track their status (submitted/reviewed/rejected)

### If You're a Company:
1. **Create a Case**
   - Go to "Company Dashboard"
   - Click "Create New Case"
   - Fill in:
     - Case Title: What students need to solve
     - Description: Detailed explanation of the challenge
     - Requirements: What you need from solutions
     - Deadline: When solutions are due
   - Click "Create Case"

2. **Review Solutions**
   - Click on your case in the dashboard
   - See all solutions submitted by students
   - Review student information (name, university, specialization)
   - View their solution text and/or download files
   - Change solution status (submitted → reviewed → accepted/rejected)

3. **Manage Cases**
   - View all your created cases
   - See case status and deadline
   - Click cases to manage associated solutions

## 🔧 Test Data (Optional)

If you want to quickly populate the platform with test cases, use these API calls:

### Create Test Cases via curl

After registering a company account and logging in, copy the JWT token and use:

```bash
# Get company's JWT token from browser console:
# localStorage.getItem('token')

curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Optimize Production Process",
    "description": "We need to improve our manufacturing efficiency. Current output is 100 units/day but we target 150 units/day. Please analyze the bottlenecks and propose a solution.",
    "requirements": "- Understand manufacturing processes\n- Identify inefficiencies\n- Propose improvements with ROI calculation\n- Submit detailed report",
    "deadline": "2026-05-30T23:59:59Z"
  }'
```

## 🎮 Sample User Flows

### Complete Student Flow (5 minutes)
1. Register as student
2. Go to "Cases"
3. Click on first case
4. Read description
5. Submit solution with sample text
6. Go to "My Dashboard" to see it

### Complete Company Flow (10 minutes)
1. Register as company
2. Go to "Company Dashboard"
3. Click "Create New Case"
4. Fill in case details
5. Wait for student submissions (or ask a student to submit)
6. Click on case to see solutions
7. Update solution status

## 🐛 Troubleshooting

### Frontend not loading
- Check if port 5173 is running: `curl http://localhost:5173`
- Check browser console for errors (F12 → Console)
- Try clearing cache (Ctrl+Shift+Delete)

### Can't login
- Double-check your email and password
- Make sure you registered first
- Check that backend is running: `curl http://localhost:5000/api/cases`

### File upload not working
- Check file size (max 50MB)
- Try different file format (PDF, TXT, etc)
- Check browser console for error messages

### Cases not showing
- Make sure you're logged in
- Cases only show if deadline is in the future
- Try creating a new case as a company

## 📊 Platform Architecture

```
Your Browser
    ↓
Frontend (React) - Port 5173
    ↓ (HTTP/REST)
Backend (Express) - Port 5000
    ↓ (SQL Queries)
Database (SQLite)
    ↓ (File I/O)
Uploaded Files
```

## 🔑 Key Credentials to Remember

**For Testing:**
- Student Email: `student@example.com` / Password: `password123`
- Company Email: `company@example.com` / Password: `password123`

**Important:** These are examples only. Create real accounts with secure passwords.

## 📁 Project Files

Key files you might want to customize:

- **Backend API**: `/server/server.js` - All API routes
- **Frontend Pages**: `/client/src/pages/` - User interface pages
- **Database**: `/server/data/platform.db` - SQLite database file
- **Uploads**: `/server/uploads/` - Student solution files

## 🚀 Running Tests

### Check Backend Health
```bash
# Should return [] or list of cases
curl http://localhost:5000/api/cases
```

### Check Frontend
```bash
# Should return HTTP 200
curl -o /dev/null -w "%{http_code}" http://localhost:5173
```

## 📈 Next Steps

1. **Create More Test Data**
   - Register multiple student accounts
   - Register multiple company accounts
   - Create cases and submit solutions

2. **Test the Full Flow**
   - Student submits solution
   - Company reviews it
   - Update solution status

3. **Customize**
   - Change colors in CSS files
   - Add your company logo
   - Customize case templates

4. **Deploy**
   - See README.md for deployment instructions
   - Prepare for production (use PostgreSQL, add authentication)

## 📞 Need Help?

- **Understand the system?** Read `ARCHITECTURE.md`
- **See API examples?** Read `SAMPLE_DATA.md`
- **General info?** Read `AGENTS.md` or `README.md`

## ⏱️ Performance Tips

- Close browser tabs you're not using
- Clear cache if experiencing slowness
- Don't upload files larger than 50MB
- SQLite may slow down with 1000+ records (upgrade to PostgreSQL)

---

**Happy testing! 🎉**

Your platform is ready to connect students with industry!
