# Migration Notes - Security Updates

## Files Requiring Updates

The following files still contain hardcoded `ADMIN_EMAIL` references and should be updated to use custom claims:

### 1. `/src/app/user/profile/page.tsx`

**Current Issue:**
- Line 16: Hardcoded `ADMIN_EMAIL` constant
- Line 138-139: Email-based admin check
- Line 399: Email-based UI conditional

**Required Changes:**
```typescript
// Remove hardcoded constant
- const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

// Update admin check to use custom claims
const checkIsAdmin = async (user: User) => {
  const idTokenResult = await user.getIdTokenResult()
  return idTokenResult.claims.admin === true
}

// Update UI conditionals
- if (user.email === ADMIN_EMAIL && !profileData?.isAdmin)
+ const isAdmin = await checkIsAdmin(user)
+ if (isAdmin && !profileData?.isAdmin)
```

### 2. `/src/app/api/announcements/route.ts`

**Current Issue:**
- Line 9: Hardcoded `ADMIN_EMAIL` constant
- Line 26: Email-based admin verification

**Required Changes:**
```typescript
// Remove hardcoded constant
- const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

// Use auth-middleware instead
import { withAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  return withAuth(request, async (authContext) => {
    // authContext.isAdmin is already verified via custom claims
    if (!authContext.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    // Your code here
  })
}
```

### 3. `/src/lib/blog.ts`

**Location of Issue:**
```bash
grep -n "ADMIN_EMAIL" /home/beano/DevProjects/next_js/DevTalks/src/lib/blog.ts
```

**Required Action:** Review and update to use server-side admin checks

### 4. `/src/lib/projects.ts`

**Location of Issue:**
```bash
grep -n "ADMIN_EMAIL" /home/beano/DevProjects/next_js/DevTalks/src/lib/projects.ts
```

**Required Action:** Review and update to use server-side admin checks

### 5. `/src/lib/firebase-admin.ts`

**Current Status:** This file is deprecated

**Required Action:**
- This file should NOT be used anymore
- All imports should be changed to use `/src/lib/server/firebase-admin.ts`
- Contains mock implementation which is kept for backward compatibility during migration
- Plan to remove after all references are updated

## Migration Priority

### High Priority (Breaks Security)
1. `/src/app/api/announcements/route.ts` - API route with admin check
2. Any other API routes still using email-based admin checks

### Medium Priority (UX Issues)
3. `/src/app/user/profile/page.tsx` - Profile page admin UI
4. `/src/lib/blog.ts` - Blog operations
5. `/src/lib/projects.ts` - Project operations

### Low Priority (Cleanup)
6. `/src/lib/firebase-admin.ts` - Deprecated file, kept for compatibility

## Step-by-Step Migration Guide

### Phase 1: API Routes (Critical)

1. **Find all API routes using ADMIN_EMAIL:**
   ```bash
   grep -r "ADMIN_EMAIL" src/app/api/
   ```

2. **For each file, update to use `withAuth`:**
   ```typescript
   import { withAuth } from '@/lib/auth-middleware'

   export async function POST(request: NextRequest) {
     return withAuth(request, async (authContext) => {
       // Use authContext.isAdmin instead of email comparison
     }, true) // true = require admin
   }
   ```

### Phase 2: Server-Side Operations

1. **Update lib files to use server-side admin checks:**
   ```typescript
   import { isUserAdmin } from '@/lib/server/admin-check'

   const isAdmin = await isUserAdmin(userId)
   ```

### Phase 3: Client Components

1. **Update React components to check custom claims:**
   ```typescript
   const checkAdminStatus = async () => {
     if (!user) return false
     const idTokenResult = await user.getIdTokenResult()
     return idTokenResult.claims.admin === true
   }
   ```

### Phase 4: Cleanup

1. **Remove old firebase-admin.ts:**
   ```bash
   # After all references updated
   git rm src/lib/firebase-admin.ts
   ```

2. **Remove all ADMIN_EMAIL constants**

3. **Update tests**

## Testing After Migration

### For Each Updated File:

- [ ] Admin user can access admin features
- [ ] Non-admin user is blocked from admin features
- [ ] Error messages are clear
- [ ] No console errors
- [ ] Custom claims are being checked

### End-to-End Tests:

1. **Test Admin Access:**
   - Set admin claims: `npx tsx src/scripts/setup-admin-claims.ts admin@example.com`
   - Sign in as admin
   - Verify admin features work
   - Check admin routes accessible

2. **Test Non-Admin:**
   - Sign in as regular user
   - Verify admin features hidden/blocked
   - Check admin routes redirect/error

3. **Test Admin Revocation:**
   - Revoke admin claims (create revoke script)
   - Verify admin features no longer accessible
   - Verify user treated as regular user

## Rollback Plan

If issues arise during migration:

1. **Keep old firebase-admin.ts for now**
2. **Gradual migration** - update one file at a time
3. **Feature flags** - could add env var to toggle new vs old admin check
4. **Monitor logs** - watch for auth errors after each change

## Known Issues

1. **Custom Claims Cache:**
   - Firebase caches custom claims in the ID token
   - Token refresh needed after admin status change
   - Users must sign out and back in to see updated status
   - Consider force token refresh in UI

2. **Development Mode:**
   - Mock implementation still uses email-based check
   - This is OK for development
   - Production MUST use custom claims

## Success Criteria

Migration complete when:

- [ ] No `ADMIN_EMAIL` constants in codebase (except .env)
- [ ] All API routes use `withAuth` middleware
- [ ] All admin checks use custom claims
- [ ] Old `firebase-admin.ts` removed
- [ ] All tests passing
- [ ] Admin functionality works in production

## Timeline

Suggested timeline for migration:

- **Week 1:** API routes (critical)
- **Week 2:** Server-side operations and lib files
- **Week 3:** Client components
- **Week 4:** Testing and cleanup

## Questions?

If you encounter issues during migration:

1. Check [SECURITY.md](./SECURITY.md) for patterns
2. Review [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md) for examples
3. Look at already-migrated files for reference
4. Ask in team chat

---

Last Updated: October 16, 2025
