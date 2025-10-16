# Deployment Guide

This guide covers deploying DevTalks to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Vercel Deployment](#vercel-deployment)
- [Firebase Hosting](#firebase-hosting)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ Firebase project created
- ✅ All environment variables configured
- ✅ Firebase Security Rules deployed
- ✅ Production build tested locally
- ✅ Domain name (optional)
- ✅ SSL certificate configured

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- Zero-configuration deployment
- Automatic HTTPS
- Built-in CDN
- Serverless functions
- Easy environment variable management
- Excellent Next.js integration

**Best for:** Most use cases

### Option 2: Firebase Hosting

**Pros:**
- Integrated with Firebase services
- Good for Firebase-heavy apps
- Automatic SSL

**Best for:** Firebase-centric deployments

### Option 3: Self-Hosted

**Pros:**
- Full control
- Custom infrastructure

**Best for:** Specific requirements or enterprise

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# From project root
vercel

# For production
vercel --prod
```

### Step 4: Configure Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings > Environment Variables
4. Add all required environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

ADMIN_EMAIL=...
```

### Step 5: Custom Domain (Optional)

1. Go to Settings > Domains
2. Add your domain
3. Configure DNS records as instructed
4. Wait for SSL provisioning

### GitHub Integration

1. Push code to GitHub
2. Import repository in Vercel
3. Configure build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Add environment variables
5. Deploy automatically on push

## Firebase Hosting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login

```bash
firebase login
```

### Step 3: Initialize Firebase

```bash
firebase init hosting
```

Select:
- Hosting: Configure files for Firebase Hosting
- Use existing project
- Select your Firebase project
- Public directory: `out`
- Single-page app: Yes
- Automatic builds: No

### Step 4: Build for Static Export

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

### Step 5: Build and Deploy

```bash
npm run build
firebase deploy --only hosting
```

### Custom Domain

```bash
firebase hosting:channel:deploy DOMAIN_NAME
```

## Environment Configuration

### Required Environment Variables

Create `.env.production`:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Configuration
ADMIN_EMAIL=admin@example.com

# Optional
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to Git
- Use platform environment variable management
- Rotate keys periodically
- Use different credentials for dev/prod

## Database Setup

### Step 1: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 2: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### Step 3: Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

### Step 4: Set Up Collections

Initialize required collections in Firestore:

```bash
# Run initialization script (if available)
npm run init:firestore
```

Or manually create:
- `users`
- `posts`
- `comments`
- `projects`
- `announcements`
- `env` (with admin document)

### Step 5: Configure Admin

Add admin document to `env` collection:

```javascript
// Document ID: admin
{
  adminEmail: "your-admin@email.com"
}
```

## Post-Deployment

### Step 1: Verify Deployment

- [ ] Homepage loads correctly
- [ ] All pages are accessible
- [ ] Authentication works
- [ ] Database reads/writes work
- [ ] Images load correctly
- [ ] Forms submit successfully
- [ ] Admin dashboard is accessible
- [ ] Mobile layout works

### Step 2: Test Critical Flows

**User Flow:**
1. Visit homepage
2. Sign up / Sign in
3. Create a post
4. Add a comment
5. Update profile

**Admin Flow:**
1. Sign in as admin
2. Access admin dashboard
3. Create announcement
4. Manage projects
5. Upload images

### Step 3: Configure Monitoring

**Google Search Console:**
1. Add and verify your site
2. Submit sitemap: `https://your-domain.com/sitemap.xml`

**Google Analytics:**
1. Create GA4 property
2. Add measurement ID to environment variables
3. Verify tracking

**Firebase Analytics:**
1. Enable in Firebase console
2. Monitor events

### Step 4: Set Up Backups

**Firestore Backups:**
```bash
gcloud firestore export gs://your-backup-bucket
```

**Automated Backups:**
Set up Cloud Scheduler for daily backups

### Step 5: Performance Optimization

1. Enable Vercel/Firebase CDN
2. Configure caching headers
3. Enable compression
4. Optimize images
5. Monitor Core Web Vitals

## Monitoring

### Health Checks

Create health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
```

### Error Tracking

Consider integrating:
- **Sentry** - Error monitoring
- **LogRocket** - Session replay
- **Datadog** - Infrastructure monitoring

### Metrics to Monitor

- **Uptime** - 99.9% target
- **Response Time** - < 200ms for API routes
- **Error Rate** - < 0.1%
- **Database Reads/Writes** - Stay within quotas
- **Storage Usage** - Monitor growth
- **Authentication** - Track failed attempts

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # Add other env vars

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Troubleshooting

### Build Failures

**Issue:** Build fails on Vercel

**Solution:**
1. Check build logs
2. Verify environment variables
3. Test build locally: `npm run build`
4. Check for missing dependencies

### Environment Variable Issues

**Issue:** Environment variables not loading

**Solution:**
1. Verify variables are set in platform
2. Check variable names (case-sensitive)
3. Restart deployment
4. Verify NEXT_PUBLIC_ prefix for client vars

### Firebase Connection Issues

**Issue:** Cannot connect to Firebase

**Solution:**
1. Verify Firebase config
2. Check API keys
3. Verify domain is authorized in Firebase Console
4. Check network/CORS settings

### Authentication Problems

**Issue:** Users can't sign in

**Solution:**
1. Check Firebase Auth is enabled
2. Verify auth providers are enabled
3. Check authorized domains in Firebase Console
4. Verify email/password auth is enabled

### Performance Issues

**Issue:** Slow page loads

**Solution:**
1. Enable caching
2. Optimize images
3. Use CDN
4. Check database queries
5. Monitor Core Web Vitals
6. Reduce JavaScript bundle size

### Database Permission Errors

**Issue:** Permission denied errors

**Solution:**
1. Check Firestore security rules
2. Verify user authentication
3. Test rules in Firebase Console
4. Check rule syntax

## Rollback Procedure

If deployment fails:

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Firebase
```bash
# List previous releases
firebase hosting:channel:list

# Rollback
firebase hosting:rollback
```

## Scaling Considerations

### Firebase Quotas

Monitor and upgrade as needed:
- **Reads:** 50,000/day (free) → Unlimited (paid)
- **Writes:** 20,000/day (free) → Unlimited (paid)
- **Storage:** 1GB (free) → Unlimited (paid)
- **Bandwidth:** 10GB/month (free) → Unlimited (paid)

### Upgrade Firebase Plan

```bash
firebase billing:set
```

### Vercel Quotas

- **Free:** 100GB bandwidth/month
- **Pro:** 1TB bandwidth/month
- **Enterprise:** Custom

## Security Checklist

Before going live:

- [ ] HTTPS enabled
- [ ] Security rules deployed
- [ ] Environment variables secured
- [ ] No secrets in code
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Admin access restricted
- [ ] Error messages don't expose sensitive info
- [ ] Backups configured

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last updated:** 2025-10-16
