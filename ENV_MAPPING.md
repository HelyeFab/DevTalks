# Environment Variable Mapping for DevTalks

**Last Updated:** 2025-10-18
**Framework:** Next.js 15.0.3
**Services:** Firebase (Client SDK + Admin SDK)

---

## 📋 Overview

This document maps all environment variables used by [APP_NAME] and categorizes them by:
- **Lifecycle**: Build-time vs Runtime
- **Visibility**: Public (client-side) vs Private (server-side)
- **Security**: Secret vs Non-secret
- **Requirement**: Required vs Optional

---

## 🏗️ Build-Time Variables (Inlined into Bundle)

These variables are **embedded into the JavaScript bundle** during `docker build`.
They **cannot change** after the image is built.

| Variable | Purpose | Security | Required | Example Value |
|----------|---------|----------|----------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK authentication | Public | Yes | `AIzaSyCoulOe...` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier | Public | Yes | `efabiani-blog` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | Public | Yes | `efabiani-blog.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Public | Yes | `efabiani-blog.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Public | Yes | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app identifier | Public | Yes | `1:123:web:abc` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase analytics measurement ID | Public | No | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA site key | Public | Yes | `6LeIxAcTAAAAA...` |

**How to Pass**:
```bash
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=value \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=value \
  -t app:prod .
```

**Dockerfile Implementation**:
```dockerfile
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

---

## 🚀 Runtime Variables (Loaded at Container Start)

These variables are **loaded when the container starts**.
They **can change** between deployments without rebuilding the image.

| Variable | Purpose | Security | Required | Example Value |
|----------|---------|----------|----------|---------------|
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK project | Secret | Yes | `efabiani-blog` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Secret | Yes | `firebase-adminsdk@efabiani-blog.iam...` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | **CRITICAL SECRET** | Yes | `-----BEGIN PRIVATE...` |
| `ADMIN_EMAIL` | Admin user email | Non-secret | Yes | `efabiani.net@gmail.com` |

**How to Pass**:
```bash
# Create .env.local file, then:
docker run --env-file .env.local -p 3000:3000 app:prod
```

**Security Notes**:
- ⚠️ **NEVER** include these in Dockerfile
- ⚠️ **NEVER** commit .env.local to git
- ⚠️ Store securely (use secrets manager in production)

---

## 🔐 Security Classification

### Critical Secrets (Highest Protection)
- `FIREBASE_PRIVATE_KEY` - Service account private key
- Any API keys with write access
- Database passwords
- JWT signing keys

**Handling**: Runtime only, encrypted at rest, rotate regularly

### Moderate Secrets (Standard Protection)
- `FIREBASE_CLIENT_EMAIL` - Identifies service account
- Read-only API keys
- Third-party service credentials

**Handling**: Runtime only, access-controlled

### Public Configuration (No Protection Needed)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Intentionally public
- `NEXT_PUBLIC_APP_URL` - Publicly accessible
- Feature flags (non-sensitive)

**Handling**: Can be build-time (inlined)

---

## 📝 Environment File Structure

### .env.local (DO NOT COMMIT)
```bash
# Runtime secrets - Server-side only
FIREBASE_PROJECT_ID=actual-project-id
FIREBASE_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_EMAIL=admin@example.com
```

### .env.example (COMMIT TO GIT)
```bash
# Template showing all variables with placeholder values
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_EMAIL=admin@example.com
```

---

## ✅ Validation Checklist

Before deployment, verify:

- [ ] All `NEXT_PUBLIC_*` variables have `ARG` declarations in Dockerfile
- [ ] All `NEXT_PUBLIC_*` variables have `ENV` declarations in Dockerfile builder stage
- [ ] No secrets (FIREBASE_PRIVATE_KEY, etc.) appear in Dockerfile
- [ ] .env.local exists with all runtime variables
- [ ] .env.local is in .gitignore
- [ ] .env.example exists with placeholder values
- [ ] ENV_MAPPING.md (this file) is up to date
- [ ] DEPLOYMENT.md documents build args and runtime env requirements

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Putting secrets in `NEXT_PUBLIC_*` variables**
   - Client-visible, dangerous

2. ❌ **Using runtime variables for client-side code**
   - Won't work - not available in browser

3. ❌ **Including `FIREBASE_PRIVATE_KEY` in Dockerfile**
   - Security violation, exposed in image

4. ❌ **Forgetting to pass build args during `docker build`**
   - Build succeeds but app broken

5. ❌ **Not using `--env-file` during `docker run`**
   - Server-side features won't work

---

## 📚 References

- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [Docker Build Args](https://docs.docker.com/engine/reference/commandline/build/#set-build-time-variables---build-arg)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Maintained by:** [Your Name]
**Questions?** Check DEPLOYMENT.md or ask the team
