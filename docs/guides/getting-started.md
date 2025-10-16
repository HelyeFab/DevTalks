# Getting Started with DevTalks

This guide will help you set up and run DevTalks locally for development.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** installed
- **Firebase account** ([Sign up](https://firebase.google.com/))
- **Code editor** (VS Code recommended)

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/DevTalks.git
cd DevTalks
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, Firebase, and more.

## Step 3: Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "DevTalks" (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** authentication
4. Enable **Google** sign-in (optional but recommended)

### Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location close to your users
5. Click "Enable"

### Set Up Storage

1. Go to **Build > Storage**
2. Click "Get started"
3. Start in **test mode** (for development)
4. Click "Done"

### Get Firebase Credentials

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register app with nickname "DevTalks Web"
5. Copy the Firebase configuration

### Create Service Account (Admin SDK)

1. Go to **Project Settings > Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely
4. Extract these values:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 4: Environment Variables

Create a `.env.local` file in the project root:

```bash
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (from service account JSON)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Admin Email (your email for admin access)
ADMIN_EMAIL=your-email@example.com

# Optional: Contact Form (if using)
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- The `FIREBASE_PRIVATE_KEY` must include `\n` for line breaks
- Never commit `.env.local` to Git

## Step 5: Deploy Firebase Security Rules

Navigate to the `config` directory and deploy the rules:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore: Configure security rules and indexes
# - Storage: Configure security rules

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

## Step 6: Initialize Database

### Create Admin Document

In Firestore Console:

1. Go to **Firestore Database**
2. Start collection: `env`
3. Document ID: `admin`
4. Add field:
   - Field: `adminEmail`
   - Type: `string`
   - Value: `your-email@example.com` (same as ADMIN_EMAIL)
5. Save

### Create Test Data (Optional)

You can manually create test data or use the app to create posts once it's running.

## Step 7: Run Development Server

```bash
npm run dev
```

The app will be available at: [http://localhost:3000](http://localhost:3000)

## Step 8: Verify Installation

### Check Homepage

Visit `http://localhost:3000` - you should see the homepage.

### Test Authentication

1. Click "Sign In" in the header
2. Try signing up with email/password
3. Verify you can sign in
4. Check that your profile appears in the header

### Test Admin Access

1. Sign in with the admin email
2. Visit `/admin/dashboard`
3. Verify you can access the admin panel

### Test Creating Content

1. As admin, go to admin dashboard
2. Create a test announcement
3. Create a test project
4. Verify they appear on the respective pages

## Common Issues & Solutions

### Issue: Firebase connection error

**Solution:**
- Verify all environment variables are set correctly
- Check that Firebase config matches your project
- Ensure you're using the correct API key

### Issue: "Permission denied" errors

**Solution:**
- Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- Check that admin email is set in Firestore `env/admin` document
- Verify you're signed in with the correct account

### Issue: Images not loading

**Solution:**
- Deploy Storage rules: `firebase deploy --only storage:rules`
- Check that image paths are correct
- Verify Firebase Storage is enabled

### Issue: Build errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Port already in use

**Solution:**
```bash
# Use a different port
npm run dev -- -p 3001
```

## Development Workflow

### File Structure

```
DevTalks/
├── src/
│   ├── app/              # Next.js pages and routes
│   │   ├── api/         # API routes
│   │   ├── admin/       # Admin dashboard
│   │   ├── blog/        # Blog pages
│   │   └── ...
│   ├── components/       # React components
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   └── contexts/        # React contexts
├── public/              # Static assets
├── config/              # Configuration files
└── docs/                # Documentation
```

### Hot Reloading

Next.js automatically reloads when you save files. Changes should appear immediately in your browser.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Building for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run start
```

## Next Steps

Now that you have DevTalks running locally:

1. **Explore the Code**: Familiarize yourself with the project structure
2. **Read Documentation**: Check out [ARCHITECTURE.md](../ARCHITECTURE.md) and other docs
3. **Admin Setup**: See [Admin Setup Guide](admin-setup.md) for admin-specific features
4. **Content Management**: Learn about [Content Management](content-management.md)
5. **Contributing**: If contributing, read [CONTRIBUTING.md](../CONTRIBUTING.md)

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm test                # Run tests
npm run lint            # Lint code

# Production
npm run build           # Build for production
npm run start           # Start production server

# Firebase
firebase deploy          # Deploy everything
firebase deploy --only firestore:rules  # Deploy only Firestore rules
firebase deploy --only storage:rules    # Deploy only Storage rules
firebase deploy --only hosting          # Deploy only hosting

# Maintenance
npm install             # Install dependencies
npm update              # Update dependencies
npm audit fix           # Fix security vulnerabilities
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Getting Help

If you encounter issues:

1. Check this guide and other documentation
2. Search existing GitHub issues
3. Ask in project discussions
4. Contact the maintainers

---

**Last updated:** 2025-10-16

Happy coding! 🚀
