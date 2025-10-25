# DevTalks Deployment Workflow
**Complete Step-by-Step Guide**

This document records the exact deployment workflow used for DevTalks, including SEO asset creation, secrets management, and deployment to Sheldon server.

**Date:** October 25, 2025
**Domain:** https://devtalks.appsparkle.org
**Server:** Sheldon (home server)

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment: Creating SEO Assets](#pre-deployment-creating-seo-assets)
3. [Code Changes & Git Management](#code-changes--git-management)
4. [Secrets Management with Infrastructure Repo](#secrets-management-with-infrastructure-repo)
5. [Server Deployment on Sheldon](#server-deployment-on-sheldon)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Quick Reference](#quick-reference)

---

## Overview

### Architecture

DevTalks uses a **two-repository architecture**:

1. **📁 Project Repository** (`~/DevProjects/next_js/DevTalks`)
   - Application code
   - Public assets
   - Configuration files
   - **NO secrets** (`.env.local` is gitignored)

2. **🔐 Infrastructure Repository** (`~/DevProjects/infra`)
   - Encrypted secrets from all projects
   - Deployment scripts
   - Secret manager tool (`simple-secret-manager.sh`)
   - Shared infrastructure automation

### Key Principle

**Always sync both repositories:**
- Code changes → Project repo
- Environment variables/secrets → Infrastructure repo (encrypted)

---

## Pre-Deployment: Creating SEO Assets

### Step 1: Generate Favicons and Logo Files

**Location:** `/public/`

**Command Used:**
```bash
cd /home/beano/DevProjects/next_js/DevTalks

# Created base logo from SVG using ImageMagick
convert -size 1024x1024 xc:'#D97706' \
  -gravity center \
  -font Times-BoldItalic \
  -pointsize 500 \
  -fill white \
  -annotate +0+0 'DT' \
  /tmp/logo-dt-final.png

# Added rounded corners
convert /tmp/logo-dt-final.png \
  \( +clone -alpha extract \
     -draw 'fill black polygon 0,0 0,100 100,0 fill white circle 100,100 100,0' \
     \( +clone -flip \) -compose Multiply -composite \
     \( +clone -flop \) -compose Multiply -composite \
  \) -alpha off -compose CopyOpacity -composite \
  /tmp/logo-rounded.png

# Generated all favicon sizes
convert /tmp/logo-rounded.png -resize 16x16 public/favicon-16x16.png
convert /tmp/logo-rounded.png -resize 32x32 public/favicon-32x32.png
convert /tmp/logo-rounded.png -resize 180x180 public/apple-touch-icon.png
convert /tmp/logo-rounded.png -resize 192x192 public/android-chrome-192x192.png
convert /tmp/logo-rounded.png -resize 512x512 public/android-chrome-512x512.png

# Created multi-resolution ICO
convert /tmp/logo-rounded.png -define icon:auto-resize=48,32,16 public/favicon.ico
```

**Files Created:**
- ✅ `public/favicon.ico` (15KB - 48x48, 32x32, 16x16)
- ✅ `public/favicon-16x16.png` (1.2KB)
- ✅ `public/favicon-32x32.png` (2.4KB)
- ✅ `public/apple-touch-icon.png` (14KB - 180x180)
- ✅ `public/android-chrome-192x192.png` (15KB)
- ✅ `public/android-chrome-512x512.png` (43KB)

### Step 2: Create Logo for Schema.org

**Location:** `/public/images/logo.png`

**Command:**
```bash
cp public/android-chrome-512x512.png public/images/logo.png
```

**Result:** 512x512px PNG (43KB) for Organization schema markup

### Step 3: Create Default OG Image

**Location:** `/public/images/og-default.jpg`

**Commands:**
```bash
# Create gradient background
convert -size 1200x630 \
  -define gradient:angle=135 \
  gradient:'#D97706'-'#F59E0B' \
  /tmp/og-background.png

# Add logo
convert /tmp/og-background.png \
  \( /tmp/logo-rounded.png -resize 280x280 \) \
  -gravity west -geometry +80+0 -composite \
  /tmp/og-with-logo.png

# Add text
convert /tmp/og-with-logo.png \
  -gravity center \
  -font Times-BoldItalic \
  -pointsize 90 \
  -fill white \
  -annotate +180-50 'DevTalks' \
  -font Times-Roman \
  -pointsize 36 \
  -fill '#FFFFFF' \
  -annotate +180+80 'Software Development Blog' \
  -annotate +180+130 '& Community' \
  /tmp/og-complete.png

# Convert to optimized JPEG
convert /tmp/og-complete.png -quality 85 public/images/og-default.jpg
```

**Result:** 1200x630px JPEG (29KB) - optimized for social media

### Step 4: Add Google Search Console Verification

**File Modified:** `src/app/layout.tsx`

**Change at line 154-162:**
```typescript
verification: {
  google: 'o8OaG7SjA0OYd4onBvimOECarmau3kVN9-iQQfRtgXg',
  // yandex: 'your-yandex-verification-code',
  // bing: 'your-bing-verification-code',
},
```

**Verification Code Source:**
1. Went to https://search.google.com/search-console
2. Added property: https://devtalks.appsparkle.org
3. Selected "HTML tag" verification method
4. Copied content value from meta tag

### Step 5: Update Site URL

**Files Modified:**
- `.env.local` (line 19-20)
- `public/robots.txt` (line 22)

**Changes:**
```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://devtalks.appsparkle.org

# public/robots.txt
Sitemap: https://devtalks.appsparkle.org/sitemap.xml
```

### Step 6: Update Dockerfile for NEXT_PUBLIC_SITE_URL

**File Modified:** `Dockerfile` (lines 72-88)

**Added:**
```dockerfile
# Site URL for SEO (PUBLIC - Safe for client)
ARG NEXT_PUBLIC_SITE_URL

# And in ENV section:
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
```

**Reason:** Docker build args must be explicitly declared for Next.js build-time environment variables.

---

## Code Changes & Git Management

### Step 1: Local Development Changes

**Files Changed:**
```
Modified:
  - public/robots.txt
  - src/app/layout.tsx
  - src/components/markdown-importer.tsx (paste modal feature)
  - Dockerfile

New Files:
  - docs/seo/PRODUCTION_READINESS_2025.md
  - docs/seo/SEARCH_CONSOLE_SETUP_GUIDE.md
  - public/favicon.ico
  - public/favicon-16x16.png
  - public/favicon-32x32.png
  - public/apple-touch-icon.png
  - public/android-chrome-192x192.png
  - public/android-chrome-512x512.png
  - public/images/logo.png
  - public/images/og-default.jpg
```

### Step 2: Handle Merge Conflicts

**Issue Encountered:**
- Branch was behind by 1 commit
- Merge conflict in `markdown-importer.tsx`
- Conflict markers left in file after rebase

**Resolution:**
```bash
# Pull with rebase
git pull --rebase

# Conflict occurred - resolved manually
# Removed conflict markers (<<<<<<< HEAD, =======, >>>>>>>)
# Kept only paste modal version (removed drag-and-drop)

# Mark as resolved
git add src/components/markdown-importer.tsx
git rebase --continue
```

**Lesson Learned:** Always check for conflict markers before pushing. Build will fail with syntax errors if markers remain.

### Step 3: Commit and Push to Project Repo

**Commands:**
```bash
cd ~/DevProjects/next_js/DevTalks

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add SEO assets, Google Search Console verification, and markdown importer improvements

- Add all favicon files (16x16, 32x32, 180x180, 192x192, 512x512)
- Add logo.png (512x512) for Schema.org
- Add default OG image (1200x630)
- Add Google Search Console verification code
- Update domain to devtalks.appsparkle.org in .env.local and robots.txt
- Add SEO production readiness and Search Console setup guides
- Improve markdown-importer component with paste functionality"

# Push to remote
git push
```

**Result:** Code successfully pushed to `origin/trunk` branch

---

## Secrets Management with Infrastructure Repo

### Overview of Secret Manager

The infrastructure repo uses **`simple-secret-manager.sh`** to:
1. Encrypt sensitive files (`.env.local`, Firebase config, etc.)
2. Store encrypted versions in `secrets/vault/{PROJECT_NAME}/`
3. Track encrypted files in git (safe to commit)
4. Restore decrypted versions during deployment

**Key Files:**
- `secrets/simple-secret-manager.sh` - The encryption/decryption tool
- `secrets/manifest.json` - Tracks which secrets exist for each project
- `secrets/vault/DevTalks/*.enc` - Encrypted secret files

### Step 1: Pull Latest Infrastructure

**Commands:**
```bash
cd ~/DevProjects/infra

# Get latest infrastructure updates
git pull
```

**Output:** `Already up to date.`

### Step 2: Store Encrypted Secrets

**Command:**
```bash
cd ~/DevProjects/infra

./secrets/simple-secret-manager.sh store DevTalks
```

**What It Does:**
1. Reads `.env.local` from DevTalks project directory
2. Encrypts it using OpenSSL (AES-256-CBC)
3. Saves as `secrets/vault/DevTalks/.env.local.enc`
4. Also encrypts other sensitive files (Firebase configs)
5. Updates `secrets/manifest.json`

**Output:**
```
═══════════════════════════════════════════
  Storing Secrets for DevTalks
═══════════════════════════════════════════

ℹ️  Encrypting .firebaserc...
✅ Stored: .firebaserc

ℹ️  Encrypting firebase.json...
✅ Stored: firebase.json

ℹ️  Encrypting efabiani-blog-firebase-adminsdk-9zgx9-5712293334.json...
✅ Stored: efabiani-blog-firebase-adminsdk-9zgx9-5712293334.json

ℹ️  Encrypting .env.local...
✅ Stored: .env.local

✅ Stored 4 secrets for DevTalks
```

**Files Encrypted:**
- `.firebaserc` → `secrets/vault/DevTalks/.firebaserc.enc`
- `firebase.json` → `secrets/vault/DevTalks/firebase.json.enc`
- `efabiani-blog-firebase-adminsdk-*.json` → `secrets/vault/DevTalks/*.enc`
- `.env.local` → `secrets/vault/DevTalks/.env.local.enc`

### Step 3: Commit Encrypted Secrets

**Commands:**
```bash
cd ~/DevProjects/infra

# Check what changed
git status

# Stage encrypted files
git add .

# Commit with descriptive message
git commit -m "Update DevTalks secrets - add Google Search Console verification and domain update"

# Push to infrastructure repo
git push
```

**Files Committed:**
```
modified:   secrets/manifest.json
modified:   secrets/vault/DevTalks/.env.local.enc
modified:   secrets/vault/DevTalks/.firebaserc.enc
modified:   secrets/vault/DevTalks/efabiani-blog-firebase-adminsdk-9zgx9-5712293334.json.enc
modified:   secrets/vault/DevTalks/firebase.json.enc
```

**Result:** Encrypted secrets successfully pushed to GitHub (safe to store in git)

---

## Server Deployment on Sheldon

### Overview

Deployment on Sheldon uses the **enhanced-deploy-app.sh** script which:
1. Pulls latest code and infrastructure
2. Automatically restores secrets from encrypted vault
3. Builds Docker image with build-time env vars
4. Deploys container with runtime env vars
5. Configures Caddy reverse proxy
6. Verifies deployment health

### Step 1: SSH to Sheldon

**Command Used:**
```bash
# Using configured alias
sheldon-ssh
```

**Alias Points To:** Your Sheldon server (likely `sheldon@192.168.x.x` or `sheldon@sheldon.local`)

### Step 2: Pull Infrastructure Updates

**Command:**
```bash
sheldon-ssh "cd /home/sheldon/infra && git pull"
```

**Output:**
```
Updating df20f13..789804d
Fast-forward
 secrets/manifest.json                                 |   4 ++--
 secrets/vault/DevTalks/.env.local.enc                 | Bin 2880 -> 2960 bytes
 secrets/vault/DevTalks/.firebaserc.enc                | Bin 80 -> 80 bytes
 ...i-blog-firebase-adminsdk-9zgx9-5712293334.json.enc | Bin 2400 -> 2400 bytes
 secrets/vault/DevTalks/firebase.json.enc              |   5 ++++-
 5 files changed, 6 insertions(+), 3 deletions(-)
```

**Result:** Latest encrypted secrets now on Sheldon ✅

### Step 3: Pull DevTalks Code

**Command:**
```bash
sheldon-ssh "cd /home/sheldon/DevProjects/DevTalks && git pull"
```

**Output:**
```
Updating 21aac1f..118019f
Fast-forward
 Dockerfile                           |   4 ++++
 docs/seo/PRODUCTION_READINESS_2025.md | 692 +++++++++++++++++++++++++++++++++
 docs/seo/SEARCH_CONSOLE_SETUP_GUIDE.md | 533 +++++++++++++++++++++++++
 public/android-chrome-192x192.png      | Bin 0 -> 15215 bytes
 public/android-chrome-512x512.png      | Bin 0 -> 43830 bytes
 public/apple-touch-icon.png            | Bin 0 -> 14098 bytes
 public/favicon-16x16.png               | Bin 0 -> 1180 bytes
 public/favicon-32x32.png               | Bin 0 -> 2416 bytes
 public/images/logo.png                 | Bin 0 -> 43830 bytes
 public/images/og-default.jpg           | Bin 0 -> 28852 bytes
 public/robots.txt                      |   2 +-
 src/app/layout.tsx                     |   3 +-
 src/components/markdown-importer.tsx   | 111 +-----
 13 files changed, 1243 insertions(+), 113 deletions(-)
```

**Result:** Latest code including all SEO assets now on Sheldon ✅

### Step 4: Run Enhanced Deployment Script

**Command:**
```bash
sheldon-ssh "/home/sheldon/infra/scripts/enhanced-deploy-app.sh DevTalks devtalks.appsparkle.org"
```

**Script Execution Flow:**

#### 4a. Port Allocation
```
[2025-10-25 10:45:24] Allocating port for DevTalks via Portkeeper...
✅ Allocated port 30001 for DevTalks
```

**Portkeeper** manages port assignments to avoid conflicts across deployed apps.

#### 4b. Architecture Validation
```
🚀 Starting enhanced deployment of DevTalks to devtalks.appsparkle.org
ℹ️  Validating deployment architecture...
✅ Architecture validation passed
```

Checks that Docker, Caddy, and required services are running.

#### 4c. Secret Restoration
```
🔐 Restoring secrets for DevTalks...
✅ Secrets restored for DevTalks

🔐 Validating secrets for DevTalks...

═══════════════════════════════════════════
  Validating Secrets for DevTalks
═══════════════════════════════════════════

✅ Present secrets (4):
  ✅ .firebaserc
  ✅ firebase.json
  ✅ efabiani-blog-firebase-adminsdk-9zgx9-5712293334.json
  ✅ .env.local
✅ All secrets present for DevTalks
```

**What Happens:**
1. Script runs: `./secrets/simple-secret-manager.sh restore DevTalks`
2. Decrypts `*.enc` files from `secrets/vault/DevTalks/`
3. Places decrypted files in `/home/sheldon/DevProjects/DevTalks/`
4. Validates all required secrets are present

#### 4d. Docker Build
```
[2025-10-25 10:45:24] Building Docker image for DevTalks...
ℹ️  Building with environment variables for Next.js

Build arg: NEXT_PUBLIC_FIREBASE_API_KEY
Build arg: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Build arg: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Build arg: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Build arg: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Build arg: NEXT_PUBLIC_FIREBASE_APP_ID
Build arg: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
Build arg: NEXT_PUBLIC_SITE_URL

✅ Docker image built: devtalks:prod
```

**Build Command (Approximate):**
```bash
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..." \
  --build-arg NEXT_PUBLIC_SITE_URL="https://devtalks.appsparkle.org" \
  -t devtalks:prod \
  /home/sheldon/DevProjects/DevTalks
```

**Build Time:** ~98 seconds

#### 4e. Container Deployment
```
[2025-10-25 10:47:02] Deploying container DevTalks on port 30001...
ℹ️  Loading runtime environment from .env.local
✅ Container deployed: DevTalks-prod
```

**Run Command (Approximate):**
```bash
docker run -d \
  --name DevTalks-prod \
  --env-file /home/sheldon/DevProjects/DevTalks/.env.local \
  -p 30001:3000 \
  --restart unless-stopped \
  devtalks:prod
```

**Runtime Environment Variables** (from `.env.local`):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_EMAIL`
- All `NEXT_PUBLIC_*` vars (also available at runtime)

#### 4f. Caddy Reverse Proxy Configuration
```
[2025-10-25 10:47:03] Adding Caddy route for devtalks.appsparkle.org...
✅ Caddy route for devtalks.appsparkle.org already exists - skipping

[2025-10-25 10:47:03] Validating and restarting Caddy container...
✅ Caddy configuration is valid
✅ Caddy container restarted with valid configuration
✅ Caddy container is running successfully
```

**Caddy Configuration:**
```
devtalks.appsparkle.org {
    reverse_proxy localhost:30001
}
```

**What It Does:**
- Routes HTTPS traffic from `devtalks.appsparkle.org` to container on `localhost:30001`
- Automatically handles SSL/TLS certificates (via Let's Encrypt)
- Manages HTTP → HTTPS redirects

#### 4g. Deployment Verification
```
[2025-10-25 10:47:09] Verifying deployment...
✅ Direct port access: ✅ (<title>Home</title>)
✅ Caddy routing: ✅ (<title>Home</title>) - Correct app served
✅ Container status: Running ✅
✅ Deployment verification complete!
```

**Checks Performed:**
1. Direct access to port 30001 returns valid HTML
2. Access via Caddy (domain) returns same content
3. Docker container is in "Running" state
4. HTML contains expected title tag

#### 4h. Final Confirmation
```
✅ 🎉 Deployment complete!
ℹ️  App: DevTalks
ℹ️  Domain: https://devtalks.appsparkle.org
ℹ️  Port: 30001
ℹ️  Container: DevTalks-prod
ℹ️  Log file: /tmp/deploy-20251025-104524.log

✅ DevTalks is now live at: https://devtalks.appsparkle.org
📋 Port allocation managed by Portkeeper
🔄 Container will auto-restart on reboot
📝 Full deployment log: /tmp/deploy-20251025-104524.log
```

**Deployment Complete!** ✅

---

## Post-Deployment Verification

### Step 1: Check Favicon Accessibility

**Commands:**
```bash
# Check favicon.ico
curl -I https://devtalks.appsparkle.org/favicon.ico

# Check apple-touch-icon
curl -I https://devtalks.appsparkle.org/apple-touch-icon.png
```

**Results:**
```
HTTP/2 200
content-type: image/x-icon
cache-control: public, max-age=14400, must-revalidate

HTTP/2 200
content-type: image/png
content-length: 14098
cache-control: public, max-age=14400
```

**Status:** ✅ All favicons accessible

**Note:** Browsers cache favicons heavily. To see new favicon:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache for the domain

### Step 2: Google Search Console Verification

**Next Steps (Manual):**

1. **Go back to Google Search Console tab** (left open from earlier)

2. **Click "VERIFY" button**

3. **Google checks for meta tag:**
   ```html
   <meta name="google-site-verification" content="o8OaG7SjA0OYd4onBvimOECarmau3kVN9-iQQfRtgXg" />
   ```

4. **Expected Result:** "Ownership verified" ✅

5. **Submit Sitemap:**
   - Click "Sitemaps" in left sidebar
   - Enter: `sitemap.xml`
   - Click "SUBMIT"
   - Sitemap URL: https://devtalks.appsparkle.org/sitemap.xml

### Step 3: Test OG Image

**Test URLs:**
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Inspector: https://www.linkedin.com/post-inspector/

**Enter:** https://devtalks.appsparkle.org

**Expected:** Orange gradient OG image with DT logo and "DevTalks - Software Development Blog & Community" text

---

## Troubleshooting

### Issue 1: Build Failed with Merge Conflict Markers

**Symptom:**
```
Error: Expression expected
  × Expression expected
     ╭─[src/components/markdown-importer.tsx:138:1]
 138 │ <<<<<<< HEAD
```

**Cause:** Git rebase left conflict markers in the file

**Solution:**
```bash
# Edit the file and remove conflict markers
# Keep the desired version (in our case, paste modal only)

# Recommit
git add src/components/markdown-importer.tsx
git commit -m "Fix merge conflict - keep only paste modal version"
git push

# Pull on server
sheldon-ssh "cd /home/sheldon/DevProjects/DevTalks && git pull"

# Redeploy
sheldon-ssh "/home/sheldon/infra/scripts/enhanced-deploy-app.sh DevTalks devtalks.appsparkle.org"
```

### Issue 2: Missing NEXT_PUBLIC_SITE_URL Build Arg

**Symptom:** Deployment failed during Docker build

**Cause:** Added `NEXT_PUBLIC_SITE_URL` to `.env.local` but didn't declare it in Dockerfile

**Solution:**
```dockerfile
# Add to Dockerfile ARG section:
ARG NEXT_PUBLIC_SITE_URL

# Add to ENV section:
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
```

**Principle:** All `NEXT_PUBLIC_*` variables must be declared as `ARG` in Dockerfile for Next.js build-time inclusion.

### Issue 3: Favicon Not Showing

**Symptom:** Still seeing old favicon (e.g., Vercel default)

**Cause:** Browser caching

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`
2. Clear browser cache for the site
3. Close and reopen browser
4. Try incognito/private window

**Verification:**
```bash
curl -I https://devtalks.appsparkle.org/favicon.ico
# Should return HTTP/2 200
```

---

## Quick Reference

### Complete Deployment Workflow (Summary)

**On Laptop:**
```bash
# 1. Make code changes
cd ~/DevProjects/next_js/DevTalks
# ... edit files ...

# 2. Commit and push code
git add .
git commit -m "Description of changes"
git push

# 3. Store encrypted secrets
cd ~/DevProjects/infra
git pull
./secrets/simple-secret-manager.sh store DevTalks
git add .
git commit -m "Update DevTalks secrets - description"
git push
```

**On Sheldon (via SSH):**
```bash
# 4. Pull infrastructure updates
cd /home/sheldon/infra && git pull

# 5. Pull code updates
cd /home/sheldon/DevProjects/DevTalks && git pull

# 6. Deploy
/home/sheldon/infra/scripts/enhanced-deploy-app.sh DevTalks devtalks.appsparkle.org
```

### Key File Locations

**Local Development:**
```
~/DevProjects/next_js/DevTalks/        # Project repo
~/DevProjects/infra/                   # Infrastructure repo
~/DevProjects/infra/secrets/           # Secret manager
```

**Sheldon Server:**
```
/home/sheldon/DevProjects/DevTalks/    # Project repo
/home/sheldon/infra/                   # Infrastructure repo
/home/sheldon/infra/scripts/           # Deployment scripts
```

### Important Commands

**Secret Management:**
```bash
# Store secrets (encrypt and save)
./secrets/simple-secret-manager.sh store DevTalks

# Restore secrets (decrypt from vault)
./secrets/simple-secret-manager.sh restore DevTalks

# List all stored secrets
./secrets/simple-secret-manager.sh list
```

**Deployment:**
```bash
# Deploy/update app
/home/sheldon/infra/scripts/enhanced-deploy-app.sh DevTalks devtalks.appsparkle.org

# Check container status
docker ps | grep DevTalks

# View container logs
docker logs DevTalks-prod

# Restart container
docker restart DevTalks-prod
```

### Environment Variables

**Build-Time (NEXT_PUBLIC_*):**
- Must be declared in Dockerfile as `ARG`
- Inlined into JavaScript bundle during build
- Public and visible to browser

**Runtime (Server-Side):**
- Passed via `--env-file .env.local`
- Only available on server
- Private (Firebase Admin SDK credentials, etc.)

**Example .env.local:**
```bash
# Build-time (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_SITE_URL=https://devtalks.appsparkle.org

# Runtime-only (private)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
ADMIN_EMAIL=...
```

### Port Assignments

Managed by **Portkeeper** (tracks which ports are in use):
- DevTalks: **30001**
- Other apps get different ports automatically

### Caddy Reverse Proxy

**Config Pattern:**
```
{domain} {
    reverse_proxy localhost:{port}
}
```

**Restart Caddy:**
```bash
docker restart caddy
```

---

## Additional Documentation

**Related Docs:**
- `/docs/seo/PRODUCTION_READINESS_2025.md` - SEO checklist and strategy
- `/docs/seo/SEARCH_CONSOLE_SETUP_GUIDE.md` - Google Search Console setup
- `/docs/seo/DEPLOYMENT_CHECKLIST.md` - Pre/post-deployment checklist

**Infrastructure Repo:**
- Check `/home/sheldon/infra/README.md` for deployment script documentation
- Check secret manager help: `./secrets/simple-secret-manager.sh --help`

---

## Lessons Learned

1. **Always pull before making changes** - Avoids merge conflicts
2. **Check for merge conflict markers before pushing** - Build will fail with syntax errors
3. **All NEXT_PUBLIC_* vars need Dockerfile ARG declarations** - Required for Next.js builds
4. **Test builds locally before deploying** - `npm run build` catches most issues
5. **Two-repo sync is critical** - Code AND secrets must both be updated
6. **Favicons are heavily cached** - Hard refresh needed to see changes

---

**Deployment Completed:** October 25, 2025
**Site Live:** https://devtalks.appsparkle.org
**Status:** ✅ Deployed Successfully
**Next Steps:** Google Search Console verification and sitemap submission

---

*This workflow was documented immediately after successful deployment to capture exact steps and commands used.*
