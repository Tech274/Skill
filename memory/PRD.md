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

## Phase 4: Premium Enhancements (December 30, 2025)

### UX & Smart Learning
- ✅ **Smart Learning Flow** - AI-powered "Next Best Action" recommendations on Dashboard and Certification Path
- ✅ **Certification Roadmap View** - Visual 5-stage journey (Domains → Labs → Tests → Projects → Exam Ready)
- ✅ **Skill Gap Heatmap** - Color-coded domain gaps (red/yellow/green) with click-to-focus functionality

### Engagement & Gamification
- ✅ **Achievement Badges System** - 16 badges for labs, assessments, projects, streaks, XP milestones
- ✅ **Certification-Specific Leaderboards** - Per-cert rankings (e.g., "AWS SAA Top Learners")
- ✅ **Discussion Upgrades** - Upvotes and "Best Answer" marking

### Career & Virality Features
- ✅ **Public Learner Profiles** - Opt-in public profiles with certs, badges, and progress
- ✅ **Profile Sharing** - Copy profile link functionality

### Platform Intelligence
- ✅ **Rule-Based AI Recommendations** - Smart suggestions based on weak domains and past scores
- ✅ **Drop-Off Detection** - Re-engagement nudges for inactive users (7+ days)
- ✅ **Engagement Status Tracking** - User activity monitoring and engagement levels

### New API Endpoints
- `GET /api/recommendations/{cert_id}` - Smart learning recommendations
- `GET /api/roadmap/{cert_id}` - Certification roadmap with progress
- `GET /api/badges` - User badges (earned and available)
- `GET /api/leaderboard/certification/{cert_id}` - Cert-specific leaderboard
- `GET/PUT /api/profile/settings` - Profile privacy settings
- `GET /api/profile/public/{user_id}` - Public profile view
- `POST /api/discussions/{post_id}/upvote` - Toggle upvote
- `POST /api/discussions/reply/{reply_id}/best` - Mark best answer
- `GET /api/engagement/status` - Engagement metrics and nudges

### New Frontend Routes
- `/badges` - Achievement badges page
- `/certification/:certId/roadmap` - Certification roadmap view

### Badge System
16 badges across categories:
- Labs: First Steps (1), Lab Enthusiast (5), Lab Expert (10), Lab Master (25)
- Assessments: Test Taker (1), Assessment Ace (5), Perfect Score (100%)
- Projects: Builder (1), Project Pro (3)
- Certificates: Certified (1), Multi-Cloud (3 vendors)
- Engagement: Weekly Warrior (7-day streak), Rising Star (1000 XP), Power Learner (5000 XP)
- Community: Conversation Starter (5 posts), Community Helper (10 likes)

## Phase 5: Admin Intelligence System (Code-Insight) - January 2026

### Phase 1: Foundation (January 4, 2026) ✅
- ✅ **Role-Based Access Control (RBAC)** - Backend middleware for admin authorization
- ✅ **Admin Roles System** - super_admin, content_admin, lab_admin, finance_admin, support_admin, learner
- ✅ **First User Super Admin** - First user to sign up automatically becomes super_admin
- ✅ **Admin Dashboard** - Overview stats (users, content, engagement, revenue)
- ✅ **User Management** - Full CRUD for users with search, filters, role assignment
- ✅ **User Suspension/Restore** - Admin ability to suspend and restore users
- ✅ **Admin Layout** - Dedicated admin sidebar navigation

### Phase 2: Content & Learning Governance (January 4, 2026) ✅
- ✅ **Content Statistics Dashboard** - Overview of all content counts and usage metrics
- ✅ **Certification Management** - Full CRUD for certifications with vendor, difficulty, exam domains
- ✅ **Lab Management** - Full CRUD for labs with instructions, prerequisites, skill tracking
- ✅ **Assessment Management** - Full CRUD for assessments with questions, pass thresholds
- ✅ **Project Management** - Full CRUD for projects with tasks, technologies, deliverables
- ✅ **Content Filtering** - Search and filter by certification, status
- ✅ **Content Reordering** - Drag-and-drop style ordering for all content types
- ✅ **Publish/Draft Status** - Control content visibility with is_published flag

### Admin API Endpoints
- `GET /api/admin/dashboard` - Dashboard overview statistics
- `GET /api/admin/users` - List users with pagination, search, filters
- `PUT /api/admin/users/{user_id}/role` - Change user role (super_admin only)
- `POST /api/admin/users/{user_id}/suspend` - Suspend user account
- `POST /api/admin/users/{user_id}/restore` - Restore suspended user
- `DELETE /api/admin/users/{user_id}` - Delete user (super_admin only)
- `GET /api/admin/analytics/overview` - Detailed analytics
- `GET /api/admin/users/{user_id}/activity` - User activity details
- `GET /api/admin/content/stats` - Content statistics overview
- `GET/POST /api/admin/certifications` - List/create certifications
- `PUT/DELETE /api/admin/certifications/{cert_id}` - Update/delete certification
- `GET/POST /api/admin/labs` - List/create labs (filterable by cert_id)
- `PUT/DELETE /api/admin/labs/{lab_id}` - Update/delete lab
- `GET/POST /api/admin/assessments` - List/create assessments (filterable by cert_id)
- `PUT/DELETE /api/admin/assessments/{assessment_id}` - Update/delete assessment
- `GET/POST /api/admin/projects` - List/create projects (filterable by cert_id)
- `PUT/DELETE /api/admin/projects/{project_id}` - Update/delete project
- `POST /api/admin/{content_type}/reorder` - Reorder content items

### Admin Frontend Routes
- `/admin` - Admin Dashboard (protected)
- `/admin/users` - User Management (protected)
- `/admin/content` - Content Management (protected)
- `/admin/labs` - Lab Orchestration (protected)
- `/admin/exams` - Exams & Certifications (protected)

### Phase 3: Lab & Cloud Orchestration (January 4, 2026) ✅
- ✅ **Lab Instance Management** - Track active lab sessions across all users
- ✅ **Provider-Agnostic Interface** - Support for AWS, GCP, Azure (simulated)
- ✅ **Resource Quota Management** - Per-user quotas for concurrent labs, daily/monthly hours
- ✅ **Lab Status Monitoring** - Active, suspended, terminated states with admin controls
- ✅ **Admin Dashboard** - Overview stats (running instances, costs, resource usage)
- ✅ **Instance Filters** - Filter by status (running/suspended/terminated) and provider
- ✅ **Instance Actions** - Suspend, resume, terminate, extend lab instances
- ✅ **Quota Editor** - Configure user limits for providers, instance types, storage
- ✅ **Provider Management** - Enable/disable cloud providers globally

### Phase 3 API Endpoints
- `GET /api/admin/lab-orchestration/dashboard` - Dashboard overview stats
- `GET /api/admin/lab-orchestration/instances` - List all instances with filters
- `POST /api/admin/lab-orchestration/instances/{id}/action` - Admin actions on instances
- `GET /api/admin/lab-orchestration/quotas` - List all user quotas
- `GET/PUT /api/admin/lab-orchestration/quotas/{user_id}` - Get/update user quota
- `DELETE /api/admin/lab-orchestration/quotas/{user_id}` - Reset quota to defaults
- `GET /api/admin/lab-orchestration/providers` - List cloud providers
- `PUT /api/admin/lab-orchestration/providers/{id}` - Enable/disable provider
- `GET /api/admin/lab-orchestration/metrics` - Resource usage metrics
- `GET /api/lab-instances` - User's active lab instances
- `POST /api/lab-instances` - Create new lab instance
- `POST /api/lab-instances/{id}/action` - User actions on own instances
- `GET /api/my-quota` - User's resource quota

### Phase 3 Technical Notes
- Cloud provisioning is SIMULATED - instances created instantly without real cloud integration
- Default quota: 2 concurrent labs, 4h daily, 40h monthly, 10GB storage
- Instance types: small (2 vCPU, 4GB), medium (4 vCPU, 8GB), large (8 vCPU, 16GB)
- Cost estimation based on provider-specific hourly rates
- Collections: lab_instances, resource_quotas, cloud_providers

### Phase 4: Exams & Certifications Admin (January 4, 2026) ✅
- ✅ **Question Bank Management** - Full CRUD for exam questions with difficulty, domain, topic tagging
- ✅ **Question Types** - Multiple choice, true/false, multi-select support
- ✅ **Exam Management** - Create/edit exams with configurable duration, pass percentage, attempts
- ✅ **Exam Types** - Practice, mock, and final exam support
- ✅ **Question Selection** - Random, fixed, or weighted by domain question selection modes
- ✅ **Certificate Templates** - Custom templates with colors, logos, signatures, QR codes
- ✅ **Default Templates** - Set default template per certification
- ✅ **Issued Certificates** - View all issued certificates with filters
- ✅ **Certificate Revocation** - Super admin can revoke certificates with reason
- ✅ **Exam Analytics** - View attempt counts, pass rates per exam
- ✅ **Bulk Import** - Import multiple questions at once

### Phase 4 API Endpoints
- `GET /api/admin/question-bank/stats` - Question bank statistics
- `GET /api/admin/question-bank` - List questions with filters (cert_id, domain, difficulty, search)
- `GET /api/admin/question-bank/{question_id}` - Get single question
- `POST /api/admin/question-bank` - Create question
- `PUT /api/admin/question-bank/{question_id}` - Update question
- `DELETE /api/admin/question-bank/{question_id}` - Delete question (super_admin only)
- `POST /api/admin/question-bank/bulk-import` - Bulk import questions
- `GET /api/admin/exams/stats` - Exam statistics
- `GET /api/admin/exams` - List exams with filters
- `GET /api/admin/exams/{exam_id}` - Get single exam with questions
- `POST /api/admin/exams` - Create exam
- `PUT /api/admin/exams/{exam_id}` - Update exam
- `DELETE /api/admin/exams/{exam_id}` - Delete exam (super_admin only)
- `POST /api/admin/exams/{exam_id}/add-questions` - Add questions to exam
- `POST /api/admin/exams/{exam_id}/remove-questions` - Remove questions from exam
- `GET /api/admin/exams/{exam_id}/analytics` - Exam analytics
- `GET /api/admin/certificate-templates` - List templates
- `GET /api/admin/certificate-templates/{template_id}` - Get single template
- `POST /api/admin/certificate-templates` - Create template
- `PUT /api/admin/certificate-templates/{template_id}` - Update template
- `DELETE /api/admin/certificate-templates/{template_id}` - Delete template (super_admin only)
- `GET /api/admin/issued-certificates` - List issued certificates
- `POST /api/admin/issued-certificates/{certificate_id}/revoke` - Revoke certificate (super_admin only)
- `GET /api/admin/exam-attempts` - List exam attempts with filters
- `GET /api/admin/certifications/{cert_id}/domains` - Get certification domains

### Phase 4 Technical Notes
- MongoDB Collections: question_bank, admin_exams, certificate_templates, exam_attempts
- Question types: multiple_choice, true_false, multi_select
- Exam selection modes: random (from bank), fixed (specific questions), weighted (by domain percentage)
- Certificate templates include customizable colors, logos, signatures, QR codes
- Delete operations require super_admin role for safety
- Exam attempts track user progress, scores, time spent

### Phase 5: Billing & Subscriptions Admin (January 4, 2026) ✅
- ✅ **Billing Dashboard** - Revenue overview, subscription counts, transaction stats, revenue trends
- ✅ **Pricing Plans CRUD** - Full create, read, update, delete for pricing plans
- ✅ **Plan Features** - Configurable features list, trial days, billing periods (monthly/yearly/one-time)
- ✅ **Featured Plans** - Mark plans as featured for checkout display
- ✅ **Team Plans** - Support for max_users limit on team plans
- ✅ **Seed Default Plans** - One-click seeding of Free, Pro Monthly, Pro Yearly, Team plans
- ✅ **Subscriptions Management** - View all user subscriptions with search and status filters
- ✅ **Subscription Detail** - Detailed view with transaction history per user
- ✅ **Subscription Actions** - Extend subscriptions by days, cancel subscriptions
- ✅ **Transactions Management** - View all payment transactions with filters
- ✅ **Refund Processing** - Process refunds with reason tracking (super_admin only)
- ✅ **Billing Analytics** - Revenue over time, plan performance, conversion rate, ARPU, churn metrics
- ✅ **Admin Action Logging** - Track subscription changes and refunds in admin_actions collection
- ✅ **Public Pricing Plans API** - /api/pricing/plans for checkout page display

### Phase 5 API Endpoints
- `GET /api/admin/billing/dashboard` - Billing dashboard overview stats
- `GET /api/admin/billing/plans` - List all pricing plans
- `GET /api/admin/billing/plans/{plan_id}` - Get single plan
- `POST /api/admin/billing/plans` - Create pricing plan
- `PUT /api/admin/billing/plans/{plan_id}` - Update plan
- `DELETE /api/admin/billing/plans/{plan_id}` - Delete plan (super_admin only)
- `POST /api/admin/billing/seed-plans` - Seed default plans
- `GET /api/admin/billing/subscriptions` - List subscriptions with filters
- `GET /api/admin/billing/subscriptions/{user_id}` - Subscription detail with transactions
- `PUT /api/admin/billing/subscriptions/{user_id}` - Update subscription
- `POST /api/admin/billing/subscriptions/{user_id}/extend` - Extend subscription
- `POST /api/admin/billing/subscriptions/{user_id}/cancel` - Cancel subscription
- `GET /api/admin/billing/transactions` - List all transactions
- `GET /api/admin/billing/transactions/{transaction_id}` - Transaction detail
- `POST /api/admin/billing/transactions/{transaction_id}/refund` - Process refund (super_admin only)
- `GET /api/admin/billing/analytics` - Detailed billing analytics
- `GET /api/pricing/plans` - Public pricing plans for checkout

### Phase 5 Technical Notes
- MongoDB Collections: pricing_plans, admin_actions (new), extends payment_transactions
- Default plans: Free ($0), Pro Monthly ($29.99), Pro Yearly ($199.99, featured), Team ($499.99/year)
- Billing periods: monthly, yearly, one_time
- Refund processing updates user subscription to free tier on full refund
- Admin actions logged with admin_id, action_type, target, details, timestamp
- Analytics supports daily/weekly/monthly/yearly periods with date range filtering
- Stripe integration uses sk_test_emergent test key

### Phase 6: Analytics & Reporting Admin (Future)
- [ ] User analytics dashboards
- [ ] Content analytics
- [ ] Financial analytics

### Phase 7: Support & Moderation Admin (Future)
- [ ] Support ticket management
- [ ] Content moderation tools
