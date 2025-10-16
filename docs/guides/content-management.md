# Content Management Guide

Complete guide for creating and managing content in DevTalks.

## Content Types

DevTalks supports three main content types:

1. **Blog Posts** - Firestore-based posts with full CRUD
2. **MDX Posts** - File-based posts with React components
3. **Projects** - Project showcase items
4. **Announcements** - Platform-wide announcements

## Blog Posts (Firestore)

### Creating a Post

Blog posts are stored in Firestore and managed through the admin dashboard.

**Steps:**

1. Navigate to `/admin/posts/new`
2. Fill in the form:
   ```
   Title: Your Post Title
   Slug: your-post-title (auto-generated)
   Content: Post content in Markdown
   Excerpt: Brief description (optional)
   Tags: react, nextjs, typescript
   Image: /images/posts/your-image.jpg
   Published: ✓ (check to publish immediately)
   ```
3. Click "Create Post"

### Markdown Support

Blog posts support full Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

- Bullet point 1
- Bullet point 2

1. Numbered list
2. Second item

[Link text](https://example.com)

![Alt text](/images/example.jpg)

`inline code`

\`\`\`javascript
// Code block
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> Blockquote text

---
Horizontal rule
```

### Post Metadata

Each post includes:

- **Title**: Main heading (required)
- **Slug**: URL-friendly identifier (auto-generated)
- **Content**: Full post content in Markdown
- **Excerpt**: Short description for cards/previews
- **Author**: Author name (from user profile)
- **AuthorId**: Firebase user ID
- **PublishedAt**: Publication timestamp
- **UpdatedAt**: Last update timestamp
- **Tags**: Array of category tags
- **Image**: Featured image URL
- **Upvotes**: Number of upvotes
- **Published**: Publication status

### Images in Posts

**Upload Image:**

1. Use Firebase Storage or external hosting
2. Get image URL
3. Add to post:
   ```markdown
   ![Description](/images/posts/my-image.jpg)
   ```

**Best Practices:**

- Use WebP format for better performance
- Optimize images (max 500KB)
- Use descriptive alt text
- Maintain 16:9 aspect ratio for featured images

### Tags

Tags help with content organization and discovery:

```
Good tags: react, nextjs, typescript, tutorial, beginner
Bad tags: post, blog, article, content
```

**Best Practices:**

- Use 2-5 tags per post
- Be specific and relevant
- Use lowercase
- Keep consistent across posts

## MDX Posts (File-Based)

MDX posts are stored as files and support React components.

### Creating an MDX Post

1. Create file in `/public/blog/your-post-slug.mdx`

2. Add frontmatter:

```mdx
---
title: "Your Post Title"
date: "2025-10-16"
author: "Your Name"
excerpt: "Brief description of the post"
tags: ["react", "nextjs"]
image: "/images/posts/featured.jpg"
published: true
---

Your MDX content here with React components!

<CustomComponent prop="value" />

## Regular Markdown

Works as expected...
```

### MDX Features

MDX allows you to use React components in Markdown:

```mdx
import { Button } from '@/components/ui/button'

# My Post

Regular markdown content...

<Button onClick={() => alert('Hello!')}>
  Click Me
</Button>

More markdown...
```

### When to Use MDX vs Firestore

**Use MDX for:**
- Technical tutorials with interactive examples
- Documentation
- Posts with custom React components
- Version-controlled content

**Use Firestore for:**
- Regular blog posts
- Frequently updated content
- Content managed by non-technical users
- Dynamic content

## Projects

### Adding a Project

Projects showcase your work and are managed through the admin panel.

**Steps:**

1. Navigate to `/admin/projects/new`

2. Fill in project details:

```typescript
{
  title: "Project Name",
  description: "Brief project description",
  content: "Detailed markdown content about the project",
  technologies: ["React", "Next.js", "TypeScript"],
  image: "/images/projects/project-image.jpg",
  githubUrl: "https://github.com/user/repo",
  liveUrl: "https://project-demo.com",
  featured: true,
  slug: "project-name"
}
```

3. Click "Create Project"

### Project Images

**Requirements:**

- Size: 1200x630 pixels (recommended)
- Format: WebP, PNG, or JPEG
- Max file size: 500KB
- Aspect ratio: 16:9

**Creating Good Project Images:**

1. Take a high-quality screenshot
2. Crop to show key features
3. Add branding (optional)
4. Optimize for web
5. Upload to Firebase Storage or CDN

### Featured Projects

Featured projects appear on the homepage:

- Check "Featured" when creating/editing
- Limit to 3-6 featured projects
- Choose your best work

## Announcements

### Creating Announcements

Announcements appear site-wide to all users.

**Steps:**

1. Go to `/admin/announcements/new`

2. Fill in announcement:

```typescript
{
  title: "Important Update",
  content: "Announcement content with markdown support",
  type: "info",  // info, warning, success, error
  priority: "high",  // low, medium, high
  active: true
}
```

3. Submit

### Announcement Types

- **Info** (blue): General information
- **Success** (green): Positive updates
- **Warning** (yellow): Important notices
- **Error** (red): Critical alerts

### Announcement Priority

- **Low**: Minor updates
- **Medium**: Regular announcements
- **High**: Urgent/important messages

### Managing Announcements

- **Activate/Deactivate**: Toggle visibility
- **Edit**: Update content anytime
- **Delete**: Remove permanently
- **Order**: High priority shown first

## Content Best Practices

### Writing Style

1. **Be Clear**: Write in simple, understandable language
2. **Be Concise**: Get to the point quickly
3. **Be Consistent**: Maintain a consistent tone
4. **Use Headings**: Break content into sections
5. **Add Examples**: Include code examples and images

### SEO Optimization

1. **Descriptive Titles**: Include keywords naturally
2. **Meta Descriptions**: Write compelling excerpts
3. **URL Structure**: Use clean, descriptive slugs
4. **Internal Linking**: Link to related content
5. **Image Alt Text**: Describe images for accessibility

### Code Examples

When including code:

````markdown
```javascript
// Good: Add comments explaining the code
const user = await getUser(userId);

// Process user data
if (user) {
  console.log(`Hello, ${user.name}!`);
}
```
````

### Content Structure

**Introduction:**
- Hook the reader
- State the purpose
- Preview what they'll learn

**Body:**
- Use clear headings
- Break into logical sections
- Include examples and visuals
- Explain complex concepts

**Conclusion:**
- Summarize key points
- Call to action
- Links to related content

## Managing Comments

### Moderating Comments

As admin, you can:

1. **View All Comments**: Check all post comments
2. **Edit Comments**: Modify inappropriate content
3. **Delete Comments**: Remove spam or violations
4. **Reply to Comments**: Engage with users

### Comment Guidelines

Establish and enforce rules:

- Be respectful
- Stay on topic
- No spam or self-promotion
- No offensive language
- Constructive feedback only

## Content Workflow

### Publishing Workflow

```
1. Draft → 2. Review → 3. Edit → 4. Publish → 5. Promote
```

**1. Draft:**
- Write initial content
- Save as unpublished

**2. Review:**
- Check for errors
- Verify links work
- Test code examples
- Review formatting

**3. Edit:**
- Fix issues found in review
- Improve clarity
- Optimize SEO

**4. Publish:**
- Set published status
- Verify publication
- Check live version

**5. Promote:**
- Share on social media
- Notify subscribers
- Engage with comments

### Content Calendar

Plan content in advance:

```
Week 1: Tutorial on React Hooks
Week 2: Project showcase - Weather App
Week 3: Best practices guide
Week 4: Announcement - New feature
```

## Content Maintenance

### Regular Tasks

**Weekly:**
- Respond to comments
- Check for broken links
- Monitor engagement

**Monthly:**
- Update outdated content
- Refresh old posts
- Add new projects

**Quarterly:**
- Review all content
- Update tags/categories
- Archive old announcements

### Content Updates

When updating content:

1. Review current version
2. Update outdated information
3. Add new examples if needed
4. Update "last modified" date
5. Republish

## Content Analytics

Track content performance:

- **Page Views**: Most popular posts
- **Engagement**: Comments and upvotes
- **Bounce Rate**: Content quality indicator
- **Time on Page**: Reader interest
- **Traffic Sources**: Where visitors come from

## Troubleshooting

### Post Not Showing

**Check:**
- Published status is true
- No errors in content
- Slug is unique
- Image URLs are valid

### Markdown Not Rendering

**Solutions:**
- Check markdown syntax
- Verify code blocks use triple backticks
- Escape special characters if needed

### Images Not Loading

**Solutions:**
- Verify image URL is correct
- Check Firebase Storage permissions
- Ensure image file exists
- Try different image format

## Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [MDX Documentation](https://mdxjs.com/)
- [SEO Best Practices](https://developers.google.com/search/docs)
- [Content Writing Tips](https://mailchimp.com/resources/content-writing/)

---

**Last updated:** 2025-10-16
