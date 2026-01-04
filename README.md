# SkillTrack365 🎓

**Certification-First, Hands-On Learning Platform**

A comprehensive SaaS platform that guides learners from zero knowledge to certification readiness through interactive labs, assessments, and real-world projects.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-brightgreen)

---

## 🌟 Features

### Core Learning Experience
- **🎯 Certification Hub** - AWS, Azure, GCP, and DevOps certifications
- **💻 Cloud Labs** - Interactive hands-on labs with simulated cloud consoles
- **📝 Assessments** - Domain-specific tests and full practice exams
- **🏗️ Projects** - Real-world scenarios with guided implementation
- **📊 Dashboard** - Track progress with visual charts and metrics
- **🏆 Badges & Achievements** - 16 badges across labs, assessments, and engagement

### Advanced Features
- **🎓 PDF Certificates** - Downloadable certificates for 80%+ readiness
- **🔍 Assessment Review** - Review submitted answers with explanations
- **📚 Lab Bookmarking** - Save favorite labs for quick access
- **📝 Lab Notes** - Take and save notes during lab sessions
- **🏅 Leaderboard** - XP-based rankings and certification-specific leaderboards
- **💬 Discussion Forums** - Per-certification boards with upvotes and best answers
- **🎥 Video Content** - YouTube-embedded lessons with progress tracking
- **🤝 Social Sharing** - Share certificates on LinkedIn and Twitter

### Premium Enhancements
- **🧠 Smart Learning Flow** - AI-powered "Next Best Action" recommendations
- **🗺️ Certification Roadmap** - Visual 5-stage journey tracking
- **📈 Skill Gap Heatmap** - Color-coded domain gaps with actionable insights
- **👤 Public Profiles** - Shareable learner profiles with achievements
- **🎯 Drop-Off Detection** - Re-engagement nudges for inactive users

### Latest Catalog System
- **🔎 Labs Catalog** - Browse all labs with advanced filtering (vendor, certification, difficulty, domain)
- **🔎 Projects Catalog** - Explore projects with technology and complexity filters
- **🔎 Assessments Catalog** - Find assessments by type, vendor, and domain
- **📄 Pagination** - Efficient browsing with customizable page sizes
- **🔍 Search** - Instant search across all catalog items

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with hooks and concurrent features
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Beautiful and accessible component library
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Data visualization for dashboard
- **React Router v7** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **FastAPI** - Modern Python web framework
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation and settings management
- **ReportLab** - PDF certificate generation
- **Uvicorn** - ASGI server

### Database
- **MongoDB** - NoSQL database for flexible document storage

### External Services
- **Emergent Google OAuth** - Authentication provider
- **Stripe** - Payment processing (test mode)
- **YouTube** - Video content embedding

---

## 📁 Project Structure

```
/app
├── backend/                 # FastAPI backend
│   ├── server.py           # Main API server with all endpoints
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Backend environment variables
│   └── tests/             # Backend test files
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   └── ui/       # Shadcn UI components
│   │   ├── pages/        # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LabsCatalog.jsx
│   │   │   ├── ProjectsCatalog.jsx
│   │   │   ├── AssessmentsCatalog.jsx
│   │   │   └── ...
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── App.js        # Main app component with routing
│   │   └── index.js      # Entry point
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment variables
│
├── memory/
│   └── PRD.md            # Product Requirements Document
│
├── test_result.md        # Testing results and status
├── DEPLOYMENT_GUIDE.md   # Deployment instructions
└── README.md            # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.11+
- MongoDB (managed by platform)

### Installation

1. **Install Backend Dependencies**
```bash
cd /app/backend
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**
```bash
cd /app/frontend
yarn install
```

3. **Environment Variables**

Backend `.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
STRIPE_API_KEY=sk_test_emergent
```

Frontend `.env`:
```env
REACT_APP_BACKEND_URL=https://your-app.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

4. **Start Services**
```bash
sudo supervisorctl restart all
```

5. **Seed Initial Data**
```bash
curl -X POST http://localhost:8001/api/seed
curl -X POST http://localhost:8001/api/seed-videos
```

6. **Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## 📚 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/session` | Create session from OAuth |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Catalog Endpoints
| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/catalog/labs` | Get labs catalog | `vendor`, `certification`, `difficulty`, `domain`, `search`, `page`, `limit` |
| GET | `/api/catalog/projects` | Get projects catalog | `vendor`, `difficulty`, `technology`, `search`, `page`, `limit` |
| GET | `/api/catalog/assessments` | Get assessments catalog | `vendor`, `type`, `domain`, `search`, `page`, `limit` |

### Certification Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/certifications` | List all certifications |
| GET | `/api/certifications/{cert_id}` | Get certification details |
| GET | `/api/certifications/{cert_id}/labs` | Get certification labs |
| GET | `/api/certifications/{cert_id}/assessments` | Get assessments |
| GET | `/api/certifications/{cert_id}/projects` | Get projects |
| GET | `/api/certifications/{cert_id}/videos` | Get video lessons |

### Learning Progress Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | User dashboard data |
| GET | `/api/progress/{cert_id}` | Certification progress |
| GET | `/api/roadmap/{cert_id}` | Certification roadmap |
| GET | `/api/recommendations/{cert_id}` | Smart recommendations |
| POST | `/api/labs/complete` | Mark lab complete |
| POST | `/api/projects/complete` | Mark project complete |
| POST | `/api/videos/{video_id}/complete` | Mark video watched |

### Assessment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments/{assessment_id}` | Get assessment |
| POST | `/api/assessments/submit` | Submit answers |
| GET | `/api/assessments/{assessment_id}/review` | Review submission |

### Gamification Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/badges` | Get user badges |
| GET | `/api/leaderboard` | Get global leaderboard |
| GET | `/api/leaderboard/me` | Get user's rank |
| GET | `/api/leaderboard/certification/{cert_id}` | Cert-specific leaderboard |

### Discussion Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discussions/{cert_id}` | List discussions |
| POST | `/api/discussions` | Create discussion |
| GET | `/api/discussions/post/{post_id}` | Get post with replies |
| POST | `/api/discussions/reply` | Add reply |
| POST | `/api/discussions/{post_id}/like` | Toggle like |
| POST | `/api/discussions/{post_id}/upvote` | Toggle upvote |

### Payment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout/create` | Create checkout session |
| GET | `/api/checkout/status/{session_id}` | Check payment status |
| POST | `/api/webhook/stripe` | Stripe webhook handler |

### Profile & Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/settings` | Get profile settings |
| PUT | `/api/profile/settings` | Update profile settings |
| GET | `/api/profile/public/{user_id}` | Get public profile |
| GET | `/api/certificates` | Get user certificates |
| POST | `/api/certificates/generate` | Generate certificate |
| GET | `/api/certificates/{id}/download` | Download certificate PDF |

For complete API documentation, visit: `http://localhost:8001/docs`

---

## 🧪 Testing

### Backend Testing
```bash
# Run all backend tests
python /app/backend_test.py

# Test specific endpoints
curl http://localhost:8001/api/certifications
curl http://localhost:8001/api/catalog/labs
```

### Frontend Testing
- Manual testing through browser
- Check authentication flow
- Test catalog filtering and search
- Verify dashboard charts and metrics

---

## 📊 Database Schema

### Collections

**users**
- `user_id` - Unique user identifier
- `email` - User email
- `name` - Full name
- `picture` - Profile picture URL
- `subscription_status` - free/premium
- `subscription_expires_at` - Expiration date

**certifications**
- `cert_id` - Certification identifier
- `vendor` - AWS/Azure/GCP/DevOps
- `name` - Certification name
- `code` - Certification code
- `difficulty` - Beginner/Intermediate/Advanced
- `exam_domains` - Array of domain objects

**labs**
- `lab_id` - Lab identifier
- `cert_id` - Associated certification
- `title` - Lab title
- `difficulty` - Lab difficulty level
- `duration_minutes` - Estimated duration
- `instructions` - Step-by-step guide

**assessments**
- `assessment_id` - Assessment identifier
- `cert_id` - Associated certification
- `type` - domain/practice/full
- `questions` - Array of question objects
- `pass_threshold` - Passing percentage

**projects**
- `project_id` - Project identifier
- `cert_id` - Associated certification
- `title` - Project title
- `difficulty` - Project difficulty
- `tasks` - Array of task objects

**user_progress**
- `user_id` - User identifier
- `cert_id` - Certification identifier
- `labs_completed` - Array of completed lab IDs
- `assessments_submitted` - Array of submission objects
- `projects_completed` - Array of completed project IDs
- `total_xp` - Experience points
- `readiness_percentage` - Overall readiness

---

## 🎯 XP System

| Activity | XP Earned |
|----------|-----------|
| Complete Lab | 100 XP |
| Pass Assessment | 150 XP |
| Complete Project | 200 XP |
| Earn Certificate | 500 XP |

---

## 🏆 Badge System

### Categories
- **Labs**: First Steps (1), Lab Enthusiast (5), Lab Expert (10), Lab Master (25)
- **Assessments**: Test Taker (1), Assessment Ace (5), Perfect Score (100%)
- **Projects**: Builder (1), Project Pro (3)
- **Certificates**: Certified (1), Multi-Cloud (3 vendors)
- **Engagement**: Weekly Warrior (7-day streak), Rising Star (1000 XP), Power Learner (5000 XP)
- **Community**: Conversation Starter (5 posts), Community Helper (10 likes)

---

## 🔐 Authentication

SkillTrack365 uses **Emergent Google OAuth** for authentication:

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. After approval, Emergent creates session
4. Session token stored in cookies
5. All protected routes verify session token

---

## 💳 Subscription Plans

### Test Mode (Stripe)
- **Monthly**: $29/month
- **Yearly**: $290/year (save $58)

**Test Card**: 4242 4242 4242 4242 (any CVC, future expiry)

---

## 📱 Responsive Design

SkillTrack365 is fully responsive:
- Desktop: Full-featured experience
- Tablet: Optimized layouts
- Mobile: Touch-friendly interfaces

---

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy on Emergent
1. Click "Preview" to test
2. Click "Deploy Now"
3. Wait 10-15 minutes
4. Get your public URL

**Cost**: 50 credits/month

---

## 📈 Performance

- **Frontend Build**: Optimized production build with code splitting
- **Backend**: Async I/O with FastAPI and Motor
- **Database**: Indexed queries for fast retrieval
- **Caching**: Browser caching for static assets

---

## 🔄 Development Workflow

1. Make changes to code
2. Services auto-reload (hot reload enabled)
3. Test in browser
4. Run backend tests
5. Deploy when ready

---

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Restart backend
sudo supervisorctl restart backend
```

### Frontend Not Loading
```bash
# Check logs
tail -f /var/log/supervisor/frontend.err.log

# Restart frontend
sudo supervisorctl restart frontend
```

### Database Connection Issues
```bash
# Check MongoDB status
sudo supervisorctl status mongodb

# Restart MongoDB
sudo supervisorctl restart mongodb
```

---

## 📝 License

This project is private and proprietary.

---

## 👥 Contributors

Built with ❤️ by the SkillTrack365 team

---

## 📞 Support

For issues or questions:
- Check documentation
- Review API docs at `/docs`
- Contact support team

---

## 🎉 Acknowledgments

- **Emergent Platform** - Hosting and authentication
- **Shadcn UI** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **FastAPI** - Modern Python framework

---

**Ready to learn? Start your certification journey today! 🚀**
