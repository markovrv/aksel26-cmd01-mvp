# Sample Data for Testing

## How to Add Test Cases via API

You can quickly populate the platform with test data using curl commands.

### 1. Register Test Users

#### Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Ivan Petrov",
    "role": "student",
    "university": "Kirov National University",
    "specialization": "Computer Science"
  }'
```

#### Register a Company
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company@example.com",
    "password": "password123",
    "name": "HR Manager",
    "role": "company",
    "company_name": "Kirov Industrial Plant",
    "company_description": "Leading industrial manufacturing company in Kirov region"
  }'
```

Save the returned token for the company account to use in the next step.

### 2. Create Test Cases

Replace `YOUR_COMPANY_TOKEN` with the token received from company registration.

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mash@example.com",
    "password": "password123",
    "name": "Engineering Team",
    "role": "company",
    "company_name": "Mashinostroenie Ltd",
    "company_description": "Advanced machinery manufacturing"
  }'

# Then create a case with the token you get
curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN" \
  -d '{
    "title": "Design Optimization Challenge",
    "description": "We need students to optimize the design of our cooling system for maximum efficiency. The system should handle thermal loads of 1000W while maintaining component temperature below 80°C.",
    "requirements": "- Understanding of heat transfer principles\n- CAD software experience (SolidWorks or Fusion 360)\n- Problem-solving skills\n- Submit design files and technical report",
    "deadline": "2026-05-15T23:59:59Z"
  }'

curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN" \
  -d '{
    "title": "Automation Software Development",
    "description": "Create a Python script to automate our production quality checks. The script needs to process sensor data in real-time and alert operators when values exceed acceptable thresholds.",
    "requirements": "- Python 3.8+ experience\n- Knowledge of data processing\n- Real-time systems understanding\n- Test with provided sample data\n- Submit source code and documentation",
    "deadline": "2026-05-30T23:59:59Z"
  }'

curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN" \
  -d '{
    "title": "Supply Chain Logistics Analysis",
    "description": "Analyze our current supply chain and suggest improvements. We have 50 suppliers across 15 countries and need to optimize delivery times and reduce costs.",
    "requirements": "- Supply chain management knowledge\n- Data analysis skills\n- Cost optimization experience\n- Ability to work with large datasets\n- Present findings and recommendations",
    "deadline": "2026-06-10T23:59:59Z"
  }'
```

## Sample Student Solutions

Once cases are created, students can submit solutions:

### Example 1: Submit Text Solution
```bash
curl -X POST http://localhost:5000/api/solutions \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -F "case_id=CASE_ID_HERE" \
  -F "text_content=I have analyzed the cooling system and propose a solution using aluminum fin design with improved surface area of 2.5x the original. This will increase heat dissipation rate from 800W to 1100W. Cost increase is approximately 12% but thermal performance improves by 35%."
```

### Example 2: Submit with File
```bash
curl -X POST http://localhost:5000/api/solutions \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -F "case_id=CASE_ID_HERE" \
  -F "text_content=Attached is my solution with detailed CAD files and analysis" \
  -F "file=@/path/to/solution.pdf"
```

## MongoDB Alternative (Future)

When scaling beyond MVP, consider switching to MongoDB:

```javascript
// Connection example
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('industrial-tourism');

// Collections would be: users, cases, solutions, sessions
```

## Common Test Scenarios

### Scenario 1: End-to-End Student Submission
1. Student registers and logs in
2. Views available cases
3. Reads case details
4. Submits solution with files
5. Checks submission status in dashboard

### Scenario 2: Company Case Management
1. Company registers and logs in
2. Creates a new case with requirements
3. Views submitted solutions
4. Reviews student profiles
5. Updates solution status

### Scenario 3: Admin Moderation
1. Admin logs in to admin panel
2. Reviews all users (approve/delete)
3. Reviews all cases (approve/delete)
4. Manages platform moderation

## Performance Testing

Monitor your local server:
```bash
# Check server process
ps aux | grep node

# Monitor file count in uploads
ls -la server/uploads/ | wc -l

# Check database size
du -sh server/data/

# Test API response time
time curl -X GET http://localhost:5000/api/cases
```
