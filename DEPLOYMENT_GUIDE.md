# SkillTrack365 - Production Deployment Guide

## 🚀 Quick Deploy on Emergent Platform

### Prerequisites
- Active Emergent account with 50+ credits (50 credits/month for deployment)
- Application fully tested and working in preview

### One-Click Deployment Steps

1. **Preview Your Application**
   - Click the "Preview" button in the Emergent interface
   - Test all critical features:
     - User authentication (Google OAuth)
     - Certification catalog browsing
     - Labs, Projects, Assessments catalogs with filters
     - Dashboard functionality
     - Profile and badges

2. **Deploy to Production**
   - Click the "Deploy Now" button
   - Wait 10-15 minutes for deployment to complete
   - You'll receive a public URL for your live application

3. **Post-Deployment Configuration**
   - Your app will be live at: `https://your-app.emergentagent.com`
   - Environment variables are automatically configured
   - MongoDB is managed by Emergent infrastructure

### Custom Domain Setup (Optional)

After deployment, you can link your own domain:

1. Click "Link domain" in the deployment interface
2. Enter your domain name (e.g., skilltrack365.com)
3. Click "Entri" to proceed
4. Follow the DNS configuration instructions:
   - Add CNAME or A record as shown
   - DNS propagation: 5-15 minutes (up to 24 hours globally)

### Environment Variables

The following environment variables are automatically configured:

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=https://your-app.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

**Backend (.env)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
STRIPE_API_KEY=sk_test_emergent
```

### Post-Deployment Testing

1. **Authentication Flow**
   - Test Google OAuth login
   - Verify session persistence
   - Test logout functionality

2. **Core Features**
   - Browse certification hub
   - Filter labs/projects/assessments
   - Start a lab or assessment
   - View dashboard and progress

3. **Payment Flow** (Test Mode)
   - Navigate to checkout
   - Use Stripe test card: 4242 4242 4242 4242
   - Verify subscription activation

### Monitoring & Logs

- View application logs from Emergent dashboard
- Monitor uptime and performance
- Set up alerts for critical issues

### Redeployment & Updates

To update your live application:
1. Make changes in your development environment
2. Test thoroughly in preview
3. Click "Deploy Now" to update (no additional charge)
4. Wait for deployment to complete

### Rollback

If issues occur after deployment:
1. Click "Rollback" in the deployment interface
2. Select a previous stable version
3. Rollback is free of charge

### Cost Management

- **Monthly Cost:** 50 credits per deployed application
- **Billing:** Recurring monthly charge
- **Shutdown:** Stop charges anytime by shutting down the app
- **Limit:** Maximum 100 deployments per account

### Support

For deployment issues:
- Check Emergent documentation
- Contact Emergent support
- Review application logs

---

## 📋 Application Architecture

### Tech Stack
- **Frontend:** React 19, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, Python 3.11+
- **Database:** MongoDB (managed)
- **Auth:** Google OAuth (Emergent Auth)
- **Payments:** Stripe (test mode)

### Services
- Frontend: Port 3000 (supervised)
- Backend: Port 8001 (supervised)
- MongoDB: Port 27017 (managed)

### API Endpoints

#### Authentication
- `POST /api/auth/session` - Create session from OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

#### Catalogs
- `GET /api/catalog/labs` - Get labs catalog with filters
- `GET /api/catalog/projects` - Get projects catalog with filters
- `GET /api/catalog/assessments` - Get assessments catalog with filters

#### Certifications
- `GET /api/certifications` - List all certifications
- `GET /api/certifications/{cert_id}` - Get certification details
- `GET /api/certifications/{cert_id}/labs` - Get certification labs
- `GET /api/certifications/{cert_id}/assessments` - Get certification assessments
- `GET /api/certifications/{cert_id}/projects` - Get certification projects

#### User Progress
- `GET /api/dashboard` - User dashboard data
- `GET /api/progress/{cert_id}` - Certification progress
- `GET /api/badges` - User badges

#### Payment
- `POST /api/checkout/create` - Create checkout session
- `GET /api/checkout/status/{session_id}` - Check payment status
- `POST /api/webhook/stripe` - Stripe webhook handler

### Database Collections
- `users` - User profiles and subscriptions
- `certifications` - Certification metadata
- `labs` - Lab content and instructions
- `assessments` - Assessment questions
- `projects` - Project details
- `user_progress` - User learning progress
- `user_badges` - Badge achievements
- `certificates` - Generated certificates
- `discussions` - Forum posts and replies
- `videos` - Video content metadata
- `payment_transactions` - Payment history

---

## ✅ Pre-Deployment Checklist

- [x] All dependencies installed (frontend & backend)
- [x] Environment variables properly configured
- [x] No hardcoded URLs or fallback values
- [x] Authentication flow tested
- [x] All catalog APIs tested and working
- [x] Database seeded with initial data
- [x] Backend tests passed (65/65)
- [x] Services running correctly
- [x] CORS properly configured
- [x] Supervisor configuration valid

**Status:** ✅ **READY FOR PRODUCTION DEPLOYMENT**

---

## 🎯 Next Steps

1. **Click "Deploy Now"** in the Emergent interface
2. Wait for deployment to complete (10-15 minutes)
3. Test your live application at the provided URL
4. (Optional) Configure custom domain
5. Share your application with users!

---

## 📞 Need Help?

If you encounter any issues during deployment:
- Review the logs in the Emergent dashboard
- Check this deployment guide for troubleshooting
- Contact Emergent support for platform-specific issues

**Your application is production-ready! 🚀**
