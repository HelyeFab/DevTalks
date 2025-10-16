# Admin Setup Guide

Complete guide for setting up and using the DevTalks admin dashboard.

## Admin Access

### Setting Up Admin User

1. **Set Admin Email in Environment**

   Add to `.env.local`:
   ```bash
   ADMIN_EMAIL=your-admin@email.com
   ```

2. **Create Admin Document in Firestore**

   In Firebase Console > Firestore Database:
   - Collection: `env`
   - Document ID: `admin`
   - Field: `adminEmail` (string): `your-admin@email.com`

3. **Sign Up with Admin Email**

   - Go to `/auth/signup`
   - Register with the admin email
   - Sign in

4. **Verify Admin Access**

   - Navigate to `/admin/dashboard`
   - You should see the admin dashboard

## Admin Dashboard Features

### 1. Dashboard Overview (`/admin/dashboard`)

The main dashboard provides:
- Quick statistics
- Recent posts overview
- Recent comments
- Recent announcements
- Quick action buttons

### 2. Post Management (`/admin/posts`)

**View All Posts:**
- List of all blog posts (Firestore-based)
- Filter and search functionality
- View post stats (views, upvotes, comments)

**Create New Post:**
- Navigate to `/admin/posts/new`
- Fill in post details:
  - Title (required)
  - Slug (auto-generated from title)
  - Content (markdown editor)
  - Excerpt
  - Tags (comma-separated)
  - Feature image URL
  - Published status

**Edit Post:**
- Click edit button on any post
- Modify post details
- Save changes

**Delete Post:**
- Click delete button
- Confirm deletion

### 3. Project Management (`/admin/projects`)

**View Projects:**
- List all projects
- View project details

**Create Project:**
- Navigate to `/admin/projects/new`
- Required fields:
  - Title
  - Description
  - Technologies (array)
  - Image URL
- Optional fields:
  - GitHub URL
  - Live URL
  - Featured status

**Edit Project:**
- Click edit on project
- Update details
- Save changes

**Delete Project:**
- Click delete button
- Confirm deletion

### 4. Announcement Management (`/admin/announcements`)

**Create Announcement:**
- Navigate to `/admin/announcements/new`
- Fields:
  - Title (required)
  - Content (markdown supported)
  - Type: info, warning, success, error
  - Priority: low, medium, high
  - Active status

**Manage Announcements:**
- View all announcements
- Edit existing announcements
- Delete announcements
- Toggle active status

### 5. Image Management (if implemented)

Upload and manage images for:
- Blog post featured images
- Project images
- Content images

## Admin Workflows

### Creating a Blog Post

1. Navigate to `/admin/posts/new`
2. Enter post title
3. Write content in markdown
4. Add excerpt (optional)
5. Add tags
6. Upload/set featured image
7. Set publish status
8. Click "Create Post"

### Publishing an Announcement

1. Go to `/admin/announcements/new`
2. Write announcement title and content
3. Choose type (info/warning/success/error)
4. Set priority (low/medium/high)
5. Activate announcement
6. Submit

### Managing Projects

1. Navigate to `/admin/projects/new`
2. Fill in project details
3. Add technologies used
4. Upload project image
5. Add GitHub/Live URLs
6. Mark as featured (if desired)
7. Create project

## Security Best Practices

### Protecting Admin Routes

All admin routes check for:
1. User authentication
2. Email matches admin email
3. Valid Firebase token

### Admin Email Security

- **Never share your admin email**
- **Use a strong password**
- **Enable 2FA on your account**
- **Regularly rotate Firebase credentials**

### Content Moderation

As admin, you can:
- Delete inappropriate comments
- Remove spam posts
- Ban users (if feature is implemented)
- Edit/delete any content

## Troubleshooting

### Can't Access Admin Dashboard

**Symptoms:**
- 403 Forbidden error
- Redirected to homepage

**Solutions:**
1. Verify `ADMIN_EMAIL` in `.env.local` matches your signed-in email
2. Check Firestore `env/admin` document has correct email
3. Sign out and sign in again
4. Clear browser cache

### Admin Actions Not Working

**Solutions:**
1. Check Firebase Admin SDK credentials are correct
2. Verify Firestore security rules are deployed
3. Check browser console for errors
4. Ensure you're signed in

### Images Not Uploading

**Solutions:**
1. Check Firebase Storage rules
2. Verify file size is under limit (5MB)
3. Ensure correct file format (JPEG, PNG, WebP)
4. Check Storage is enabled in Firebase

## Admin API Reference

### Authentication

All admin API calls require:
```typescript
headers: {
  'Authorization': 'Bearer YOUR_FIREBASE_TOKEN'
}
```

### Key Admin Endpoints

- `POST /api/blog` - Create post (admin only)
- `PUT /api/blog/:id` - Update post (admin only)
- `DELETE /api/blog/:id` - Delete post (admin only)
- `POST /api/announcements` - Create announcement (admin only)
- `PUT /api/announcements` - Update announcement (admin only)
- `DELETE /api/announcements` - Delete announcement (admin only)

## Tips and Best Practices

### Content Creation

1. **Write Quality Content**: Focus on valuable, well-written posts
2. **Use Markdown**: Take advantage of markdown formatting
3. **Add Images**: Include relevant images for better engagement
4. **SEO Optimization**: Use descriptive titles and meta descriptions
5. **Tag Properly**: Use relevant tags for discoverability

### Project Showcase

1. **High-Quality Images**: Use professional project screenshots
2. **Detailed Descriptions**: Explain what the project does
3. **Working Links**: Ensure GitHub/Live URLs are accessible
4. **Technology Stack**: List all technologies accurately

### Announcements

1. **Be Concise**: Keep announcements short and clear
2. **Choose Right Type**: Use appropriate type (info/warning/etc.)
3. **Set Priority**: High priority for urgent announcements
4. **Deactivate Old**: Disable outdated announcements

## Maintenance Tasks

### Regular Maintenance

- **Weekly**: Review and moderate comments
- **Weekly**: Check for spam or inappropriate content
- **Monthly**: Update outdated posts
- **Monthly**: Review and update projects
- **Quarterly**: Clean up old announcements
- **Quarterly**: Review user feedback

### Database Maintenance

- Monitor Firestore usage
- Clean up deleted content
- Optimize indexes
- Review security rules

### Performance Monitoring

- Check page load times
- Monitor API response times
- Review Firebase Analytics
- Check for errors in logs

## Advanced Features

### Bulk Operations

Currently not implemented, but consider adding:
- Bulk delete posts
- Bulk update post status
- Bulk tag management

### Scheduled Publishing

Not currently implemented, but useful for:
- Schedule posts for future publication
- Auto-publish at specific times
- Draft management

### Analytics Dashboard

Consider adding:
- Post views tracking
- User engagement metrics
- Popular content analysis
- Traffic sources

## Getting Help

If you need assistance:

1. Check this documentation
2. Review [ARCHITECTURE.md](../ARCHITECTURE.md)
3. Check [API.md](../API.md) for API details
4. Contact technical support

---

**Last updated:** 2025-10-16
