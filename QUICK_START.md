# SkillTrack365 - Quick Start Guide 🚀

Get your certification learning platform up and running in 5 minutes!

---

## 🎯 What You're About to Run

**SkillTrack365** is a complete learning platform with:
- 6 Cloud Certifications (AWS, Azure, GCP, DevOps)
- 13 Interactive Cloud Labs
- 8 Practice Assessments
- 5 Real-World Projects
- Video Lessons, Discussion Forums, Badges & Leaderboards

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Check Services Status
```bash
sudo supervisorctl status
```
All services should show `RUNNING`. If not:
```bash
sudo supervisorctl restart all
```

### Step 2: Seed Initial Data
```bash
# Seed certifications, labs, assessments, and projects
curl -X POST http://localhost:8001/api/seed

# Seed video content
curl -X POST http://localhost:8001/api/seed-videos
```

### Step 3: Open the Application
- **Frontend**: http://localhost:3000 or your preview URL
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

### Step 4: Test Authentication
1. Click "Sign in with Google"
2. Authorize with your Google account
3. You'll be redirected to the dashboard

---

## 🎮 Try These Features

### 1. Browse Certifications
- Visit `/hub` to see all certifications
- Click any certification to view details

### 2. Explore Labs Catalog
- Go to **Cloud Labs** → **Browse All Labs**
- Try filters: Vendor, Certification, Difficulty
- Search for "serverless" or "security"
- Test pagination

### 3. Start a Lab
- Pick any lab from the catalog
- Click "Start Lab"
- Follow step-by-step instructions
- Mark steps as complete

### 4. Take an Assessment
- Go to any certification → **Assessments**
- Start a domain test or practice exam
- Submit answers
- Review your results

### 5. Check Your Progress
- Visit the **Dashboard** to see:
  - XP and rank
  - Completion statistics
  - Skill gap heatmap
  - Next best actions

### 6. Earn Badges
- Complete labs to earn "First Steps" badge
- Take assessments for "Test Taker" badge
- View all badges in the Badges page

### 7. Join Discussions
- Go to any certification → **Discussions**
- Create a post or reply to existing ones
- Upvote helpful content

---

## 🔍 Test Catalog Features

### Labs Catalog (`/labs`)
```bash
# Test API directly
curl "http://localhost:8001/api/catalog/labs?vendor=AWS&difficulty=Intermediate&page=1&limit=10"
```

**Available Filters:**
- `vendor`: AWS, Azure, GCP, DevOps
- `certification`: aws-saa-c03, az-900, etc.
- `difficulty`: Beginner, Intermediate, Advanced
- `domain`: IAM, Networking, Security, etc.
- `search`: Any keyword
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Projects Catalog (`/projects`)
```bash
curl "http://localhost:8001/api/catalog/projects?vendor=GCP&difficulty=Advanced"
```

**Available Filters:**
- `vendor`: AWS, Azure, GCP
- `difficulty`: Intermediate, Advanced
- `technology`: Kubernetes, Terraform, etc.
- `search`: Any keyword
- `page`, `limit`: Pagination

### Assessments Catalog (`/assessments`)
```bash
curl "http://localhost:8001/api/catalog/assessments?vendor=AWS&type=domain"
```

**Available Filters:**
- `vendor`: AWS, Azure, GCP
- `type`: domain, practice, full
- `domain`: IAM, Security, Networking, etc.
- `search`: Any keyword
- `page`, `limit`: Pagination

---

## 💳 Test Payment Flow

1. Go to **Checkout** page
2. Select "Monthly" or "Yearly" plan
3. Use Stripe test card:
   - **Card Number**: 4242 4242 4242 4242
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
4. Complete checkout
5. Subscription status updates to "premium"

---

## 📊 Check the Leaderboard

1. Complete some labs/assessments to earn XP
2. Visit `/leaderboard` to see rankings
3. Check your position
4. View certification-specific leaderboards

---

## 🎓 Generate a Certificate

1. Complete 80%+ of a certification's content
2. Go to your **Profile**
3. Click "Generate Certificate"
4. Download the PDF
5. Share on LinkedIn/Twitter

---

## 🐛 Troubleshooting

### Services Not Running
```bash
sudo supervisorctl restart all
sleep 5
sudo supervisorctl status
```

### No Data Showing
```bash
# Reseed the database
curl -X POST http://localhost:8001/api/seed
curl -X POST http://localhost:8001/api/seed-videos
```

### Check Logs
```bash
# Backend logs
tail -50 /var/log/supervisor/backend.err.log

# Frontend logs  
tail -50 /var/log/supervisor/frontend.err.log

# MongoDB logs
tail -50 /var/log/supervisor/mongodb.err.log
```

### Clear MongoDB (Fresh Start)
```bash
# Connect to MongoDB
mongosh test_database

# Drop collections
db.certifications.drop()
db.labs.drop()
db.assessments.drop()
db.projects.drop()
db.users.drop()

# Exit and reseed
exit
curl -X POST http://localhost:8001/api/seed
```

---

## 🎯 Key URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application |
| Backend API | http://localhost:8001 | REST API |
| API Docs | http://localhost:8001/docs | Interactive API documentation |
| Landing Page | http://localhost:3000/ | Public landing page |
| Login | http://localhost:3000/login | Google OAuth login |
| Dashboard | http://localhost:3000/dashboard | User dashboard |
| Certification Hub | http://localhost:3000/hub | Browse certifications |
| Labs Catalog | http://localhost:3000/labs | Browse all labs |
| Projects Catalog | http://localhost:3000/projects | Browse all projects |
| Assessments Catalog | http://localhost:3000/assessments | Browse all assessments |
| Leaderboard | http://localhost:3000/leaderboard | Global rankings |
| Badges | http://localhost:3000/badges | Achievement badges |
| Profile | http://localhost:3000/profile | User profile |

---

## 📚 Next Steps

1. **Explore the Code**
   - Frontend: `/app/frontend/src/`
   - Backend: `/app/backend/server.py`
   - Components: `/app/frontend/src/components/`
   - Pages: `/app/frontend/src/pages/`

2. **Read Documentation**
   - [README.md](./README.md) - Full documentation
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
   - [PRD.md](./memory/PRD.md) - Product requirements

3. **Deploy to Production**
   - Test in Preview mode
   - Click "Deploy Now"
   - Share your live URL!

---

## 🚀 Ready to Deploy?

When you're ready to make this public:

1. **Preview** → Test everything works
2. **Deploy Now** → Click the button
3. **Wait** → 10-15 minutes
4. **Launch** → Get your public URL!

**Cost**: 50 credits/month for 24/7 uptime

---

## 🎉 You're All Set!

Your SkillTrack365 platform is ready to help users achieve their cloud certification goals!

**Questions?** Check the [README.md](./README.md) or [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Happy Learning! 📚✨**
