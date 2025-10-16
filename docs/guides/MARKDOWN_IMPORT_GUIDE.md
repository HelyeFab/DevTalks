# Markdown Import Guide

## Overview

Your blog now supports importing posts from markdown files with YAML frontmatter. This allows you to write posts in your favorite markdown editor and import them with one click!

## Quick Start

1. **Download the Template**
   - Go to `/admin/posts/new`
   - Click "Import Markdown"
   - Click "Download Template"
   - Use this as your starting point

2. **Write Your Post**
   - Fill in the frontmatter
   - Write your content in markdown
   - Save as `.md` file

3. **Import**
   - Click "Import Markdown" button
   - Drag & drop your file OR click "Browse Files"
   - All fields auto-fill from your markdown
   - Review and publish!

## Markdown Format

### Frontmatter Structure

```yaml
---
# Basic Info (Required)
title: "Your Post Title Here"
subtitle: "Optional engaging subtitle"
date: "2025-01-15"
published: false

# SEO Fields (Highly Recommended)
seo:
  metaTitle: "Custom meta title (leave empty to use title)"
  metaDescription: "Compelling 120-160 char description for search results"
  focusKeyword: "main keyword"
  category: "Web Development"
  tags: ["javascript", "nextjs", "tutorial"]
  schemaType: "BlogPosting"  # or Article, NewsArticle, TechArticle

# Media (Optional)
image: "https://example.com/cover.jpg"  # or local path
imageAlt: "Description of cover image"

# Author (Optional - will use your profile if empty)
author:
  name: "Your Name"
  bio: "Short bio about you"
  credentials: "Senior Developer at Company"
---

# Your Post Title

*An engaging subtitle or introduction line*

## Introduction

Your content goes here...
```

### Smart Fallbacks

If you don't include frontmatter, the system will:
- ✅ Extract title from first `# H1` heading
- ✅ Extract subtitle from first *italic* text
- ✅ Auto-generate excerpt from first paragraph
- ✅ Create SEO-friendly slug from title
- ✅ Generate meta description from content

### Example: Minimal Markdown

```markdown
# Building a Terminal-Based Project Browser

*How we solved the "too many projects" problem*

As developers, we often find ourselves juggling multiple projects...
```

This will automatically populate:
- **Title**: "Building a Terminal-Based Project Browser"
- **Subtitle**: "How we solved the 'too many projects' problem"
- **Slug**: `building-a-terminal-based-project-browser`
- **Excerpt**: First 150 characters
- **Meta Description**: Auto-generated

## Image Handling

### Remote Images

```markdown
![Alt text](https://example.com/image.jpg)
```
These are preserved as-is.

### Local Images

```markdown
![Alt text](./images/screenshot.png)
```

When local images are detected:
1. A modal appears after import
2. Upload each image to Firebase Storage
3. System automatically replaces paths in your content
4. OR skip to keep original paths

## Features

### Real-Time SEO Analysis

After import, check the sidebar for:
- **SEO Score** (0-100%)
- **Title length** check
- **Meta description** quality
- **Keyword density** analysis
- **Content length** recommendations
- **Heading structure** validation

### Smart Suggestions

The editor provides:
- **Popular Tags** - from your existing posts
- **Keyword Suggestions** - based on your content library
- **Recent Categories** - quick-select options

### Template Download

Click "Download Template" to get a pre-formatted markdown file with:
- All frontmatter fields
- Helpful comments
- Example content structure
- Best practice guidance

## Workflow Examples

### Workflow 1: Full Frontmatter

```yaml
---
title: "Next.js 15 Performance Guide"
subtitle: "Boost your app speed by 300%"
seo:
  metaTitle: "Next.js 15 Performance: Complete Guide (2025)"
  metaDescription: "Learn advanced Next.js 15 optimization techniques. Improve loading times, reduce bundle size, and boost Core Web Vitals."
  focusKeyword: "nextjs 15 performance"
  category: "Web Development"
  tags: ["nextjs", "performance", "react"]
image: "https://images.unsplash.com/photo-..."
imageAlt: "Next.js logo with speed graph"
---

Content here...
```

**Result**: All fields pre-filled, 90%+ SEO score out of the box

### Workflow 2: Minimal Markdown

```markdown
# 10 Git Commands Every Developer Should Know

Git is essential for modern development. Here are the most useful commands...

## 1. git stash
Save your work without committing...
```

**Result**: System auto-generates everything, you just fine-tune

### Workflow 3: Existing Blog Post

Take any markdown blog post → Import → System extracts:
- H1 becomes title
- First paragraph becomes excerpt
- All headings indexed for SEO
- Code blocks preserved
- Links maintained

## Tips & Best Practices

### Do:
✅ Use the template as a starting point
✅ Fill in SEO fields for better rankings
✅ Include descriptive image alt text
✅ Write compelling meta descriptions
✅ Use focus keywords naturally

### Don't:
❌ Forget to set `published: false` for drafts
❌ Leave meta description empty
❌ Use generic image alt text
❌ Keyword stuff your content
❌ Skip the SEO analysis review

## File Organization

Recommended structure:
```
~/Documents/blog-drafts/
├── post-template.md
├── 2025-01-next-js-guide.md
├── 2025-01-react-patterns.md
└── images/
    ├── nextjs-cover.jpg
    └── react-diagram.png
```

## Keyboard Shortcuts

- **Import**: Click "Import Markdown" button
- **Browse**: Click inside drag-drop area
- **Template**: "Download Template" button

## Troubleshooting

### "Failed to parse markdown file"

**Issue**: YAML syntax error
**Fix**: Use the template or validate YAML at yamllint.com

### "Images not showing"

**Issue**: Local image paths not resolved
**Fix**: Either upload via image helper OR use absolute URLs

### "SEO score is low"

**Issue**: Missing key fields
**Fix**: Fill in meta description, focus keyword, and optimize title length

## Advanced: Custom Fields

You can add custom fields to frontmatter:
```yaml
---
title: "My Post"
customField: "custom value"
---
```

These are preserved in the post data but won't display in UI (unless you extend the editor).

## Next Steps

1. Download the template
2. Write your first post
3. Import and review
4. Check SEO score
5. Publish!

---

**Happy writing!** 🚀

For questions or issues, check the blog post editor at `/admin/posts/new`
