# SkillTrack365 - Certification-First Learning Platform

## Original Problem Statement
Build a full-scale, Certification-First, Hands-On Learning SaaS platform inspired by Educative. The system guides beginners and career switchers from zero knowledge to certification readiness using Cloud Labs, Assessments, and Projects mapped directly to certifications.

**Learning Model:** Certification → Cloud Labs → Assessments → Projects → Readiness → Exam

## User Personas
1. **Career Switchers** - Professionals transitioning to cloud computing roles
2. **IT Beginners** - Students/newcomers learning cloud fundamentals
3. **Experienced Developers** - Seeking official cloud certifications
4. **Enterprise Learners** - Organizations training staff on cloud technologies

## Core Requirements (Static)
- Authentication: Google OAuth via Emergent Auth
- Certification Hub: Display AWS, Azure, GCP, DevOps certifications
- Cloud Labs: Hands-on labs with simulated cloud console
- Assessments: Domain tests and full practice exams
- Projects: Real-world scenarios with guided tasks
- Dashboard: Skilltrack progress tracking with charts
- Checkout: Stripe subscription (monthly/yearly plans)
- Profile: User info, certificates, badges

## What's Been Implemented

### Phase 1: MVP (December 29, 2025)
- ✅ User authentication with Google OAuth (Emergent Auth)
- ✅ Session management with cookies
- ✅ CRUD operations for certifications, labs, assessments, projects
- ✅ User progress tracking and readiness calculation
- ✅ Stripe checkout integration for subscriptions
- ✅ Landing page, Login, Certification Hub, Certification Path
- ✅ Cloud Labs, Active Lab with simulated terminal
- ✅ Assessments, Assessment Results
- ✅ Projects, Project Workspace
- ✅ Skilltrack Dashboard with charts (Recharts)
- ✅ Profile page with badges

### Phase 2: Enhanced Features (December 29, 2025)
- ✅ **PDF Certificate Generation** - Generate downloadable PDF certificates for 80%+ readiness
- ✅ **Assessment Review Mode** - Review submitted answers with correct/incorrect marking
- ✅ **Lab Bookmarking** - Save/unsave favorite labs for quick access
- ✅ **Lab Notes** - Take and save notes during lab sessions

### Phase 3: Engagement Features (December 30, 2025)
- ✅ **Leaderboard/Rankings** - XP-based ranking system with top learners podium
- ✅ **Discussion Forums** - Per-certification discussion boards with posts, replies, likes
- ✅ **Video Content** - Video lessons with YouTube embedding, progress tracking
- ✅ **Social Sharing** - Share certificates on LinkedIn/Twitter with auto-generated messages

### Pre-populated Data
- 6 Certifications: AWS SAA-C03, AWS DVA-C02, AZ-900, AZ-104, GCP ACE, DevOps Pro
- 13 Cloud Labs with step-by-step instructions
- 8 Assessments (domain tests + full exams)
- 5 Real-world projects
- Video lessons per certification (seeded via /api/seed-videos)

## Prioritized Backlog

### P0 (Critical) - DONE ✅
- All critical MVP features implemented

### P1 (High Priority) - DONE ✅
- ✅ PDF certificate generation and download
- ✅ Lab bookmarking and notes
- ✅ Assessment review mode
- ✅ Social sharing of certificates (LinkedIn, Twitter)
- ✅ Leaderboard/rankings
- ✅ Discussion forums
- ✅ Video content integration

### P2 (Medium Priority)
- [ ] Email notifications for subscription status
- [ ] Mobile app (React Native)
- [ ] Real cloud sandbox integration (AWS/Azure/GCP)

### P3 (Nice to Have)
- [ ] AI-powered study recommendations
- [ ] Spaced repetition for exam prep
- [ ] Team/enterprise features with admin dashboard

## Technical Architecture
- **Frontend:** React 18, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend:** FastAPI, Motor (async MongoDB), Pydantic
- **Database:** MongoDB
- **Auth:** Emergent Google OAuth
- **Payments:** Stripe (test mode)
- **PDF Generation:** ReportLab
- **Deployment:** Kubernetes-based container

## API Endpoints

### Authentication
- `POST /api/auth/session` - Create session from OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Certifications
- `GET /api/certifications` - List all certifications
- `GET /api/certifications/{cert_id}` - Get certification details
- `GET /api/certifications/{cert_id}/labs` - Get labs for certification
- `GET /api/certifications/{cert_id}/assessments` - Get assessments
- `GET /api/certifications/{cert_id}/projects` - Get projects

### Labs
- `GET /api/labs/{lab_id}` - Get lab details
- `POST /api/labs/complete` - Mark lab as complete
- `POST /api/bookmarks` - Toggle lab bookmark
- `GET/POST /api/notes/{lab_id}` - Get/save lab notes

### Assessments
- `GET /api/assessments/{assessment_id}` - Get assessment
- `POST /api/assessments/submit` - Submit answers
- `GET /api/assessments/{assessment_id}/review` - Review submitted answers

### Projects
- `GET /api/projects/{project_id}` - Get project details
- `POST /api/projects/complete` - Mark project complete

### Dashboard & Progress
- `GET /api/dashboard` - Get user dashboard data
- `GET /api/progress/{cert_id}` - Get certification progress

### Payments
- `POST /api/checkout/create` - Create Stripe checkout session
- `GET /api/checkout/status/{session_id}` - Check payment status

### Certificates
- `GET /api/certificates` - Get user's certificates
- `POST /api/certificates/generate` - Generate new certificate
- `GET /api/certificates/{id}/download` - Download certificate PDF
- `GET /api/certificates/public/{id}` - Get public certificate view

### Leaderboard
- `GET /api/leaderboard` - Get top 20 learners by XP
- `GET /api/leaderboard/me` - Get current user's rank

### Discussion Forums
- `GET /api/discussions/{cert_id}` - List discussions for certification
- `POST /api/discussions` - Create new discussion
- `GET /api/discussions/post/{post_id}` - Get post with replies
- `POST /api/discussions/reply` - Add reply to post
- `POST /api/discussions/{post_id}/like` - Toggle like

### Video Content
- `GET /api/videos/{cert_id}` - Get videos for certification
- `GET /api/videos/watch/{video_id}` - Get single video
- `POST /api/videos/{video_id}/complete` - Mark video watched
- `GET /api/videos/{cert_id}/progress` - Get video progress
- `POST /api/seed-videos` - Seed video content

### Data Seeding
- `POST /api/seed` - Seed certifications, labs, assessments, projects
- `POST /api/seed-videos` - Seed video content

## Frontend Routes
- `/` - Landing page
- `/login` - Login with Google OAuth
- `/hub` - Certification Hub (protected)
- `/certification/:certId` - Certification Path (protected)
- `/certification/:certId/labs` - Cloud Labs (protected)
- `/lab/:labId` - Lab Detail (protected)
- `/lab/:labId/active` - Active Lab (protected)
- `/certification/:certId/assessments` - Assessments (protected)
- `/assessment/:assessmentId` - Take Assessment (protected)
- `/assessment/:assessmentId/results` - Results (protected)
- `/assessment/:assessmentId/review` - Review (protected)
- `/certification/:certId/projects` - Projects (protected)
- `/project/:projectId` - Project Workspace (protected)
- `/certification/:certId/videos` - Videos (protected)
- `/certification/:certId/discussions` - Discussions (protected)
- `/discussions/post/:postId` - Discussion Post (protected)
- `/leaderboard` - Leaderboard (protected)
- `/dashboard` - Skilltrack Dashboard (protected)
- `/checkout` - Subscription Checkout (protected)
- `/checkout/success` - Payment Success (protected)
- `/profile` - User Profile (protected)
- `/certificate/:certificateId` - Public Certificate View

## XP System (Leaderboard)
- Lab completion: 100 XP
- Assessment passed: 150 XP
- Project completion: 200 XP
- Certificate earned: 500 XP

## Notes
- Cloud console in labs is simulated (not real cloud environment)
- Video content uses YouTube embeds
- All protected routes require Google OAuth authentication
- Social sharing generates pre-populated share text with certification name and platform branding
