# SEO Deployment Checklist

## Pre-Deployment

### 1. Content Verification
- [ ] All page titles are under 60 characters
- [ ] All meta descriptions are under 155 characters
- [ ] All images have proper alt text
- [ ] All URLs are absolute (not relative)
- [ ] Canonical URLs are correctly set

### 2. Image Verification
- [ ] OG images are 1200x630px
- [ ] Twitter images are appropriate size
- [ ] Fallback images exist at `/public/images/og-default.jpg`
- [ ] Profile image exists at `/public/images/profile.png`
- [ ] All favicon files are present

### 3. Build Test
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No SEO-related errors
- [ ] All routes compile

### 4. Local Testing
```bash
npm run dev
```
- [ ] Homepage loads correctly
- [ ] Blog posts load with proper metadata
- [ ] Projects load with proper metadata
- [ ] About page loads correctly
- [ ] OG images generate at `/api/og`

---

## Post-Deployment

### 1. Social Media Testing

#### Facebook
- [ ] Go to https://developers.facebook.com/tools/debug/
- [ ] Test homepage
- [ ] Test 2-3 blog posts
- [ ] Test 2-3 projects
- [ ] Test about page
- [ ] Verify images load correctly
- [ ] Verify titles and descriptions are correct
- [ ] Clear cache if needed

#### Twitter
- [ ] Go to https://cards-dev.twitter.com/validator
- [ ] Test homepage
- [ ] Test 2-3 blog posts
- [ ] Test 2-3 projects
- [ ] Test about page
- [ ] Verify card type (summary_large_image)
- [ ] Verify images load correctly

#### LinkedIn
- [ ] Go to https://www.linkedin.com/post-inspector/
- [ ] Test homepage
- [ ] Test 2-3 blog posts
- [ ] Test 2-3 projects
- [ ] Verify preview looks correct
- [ ] Clear cache if needed

### 2. Search Engine Testing

#### Google Rich Results
- [ ] Go to https://search.google.com/test/rich-results
- [ ] Test homepage
- [ ] Test 2-3 blog posts
- [ ] Test 2-3 projects
- [ ] Verify structured data is valid
- [ ] Check for any errors or warnings

#### Meta Tags Inspector
- [ ] Go to https://metatags.io/
- [ ] Test various pages
- [ ] Verify all meta tags are present
- [ ] Check image sizes and formats

### 3. Search Console Setup

#### Google Search Console
- [ ] Go to https://search.google.com/search-console
- [ ] Add property for your domain
- [ ] Get verification code
- [ ] Add code to `/src/app/layout.tsx` in `verification.google`
- [ ] Deploy updated code
- [ ] Verify ownership
- [ ] Submit sitemap (when created)

#### Bing Webmaster Tools
- [ ] Go to https://www.bing.com/webmasters
- [ ] Add your site
- [ ] Get verification code
- [ ] Add code to `/src/app/layout.tsx` in `verification.bing`
- [ ] Deploy updated code
- [ ] Verify ownership
- [ ] Submit sitemap (when created)

### 4. Social Platform Verification

#### Facebook Domain Verification
- [ ] Go to Facebook Business Manager
- [ ] Navigate to Brand Safety > Domains
- [ ] Add your domain
- [ ] Get verification code
- [ ] Add code to `/src/app/layout.tsx` in `verification.other['facebook-domain-verification']`
- [ ] Deploy updated code
- [ ] Verify domain

#### Pinterest Site Verification
- [ ] Go to https://help.pinterest.com/en/business/article/claim-your-website
- [ ] Get verification code
- [ ] Add code to `/src/app/layout.tsx` in `verification.other['pinterest-site-verification']`
- [ ] Deploy updated code
- [ ] Verify ownership

---

## Monitoring Setup

### 1. Analytics
- [ ] Google Analytics installed and tracking
- [ ] Track social shares
- [ ] Monitor page views
- [ ] Track user engagement

### 2. Search Console Monitoring
- [ ] Check Google Search Console weekly
- [ ] Monitor search impressions
- [ ] Track click-through rates
- [ ] Fix any errors that appear
- [ ] Monitor rich results status

### 3. Social Monitoring
- [ ] Track Facebook shares
- [ ] Track Twitter engagement
- [ ] Track LinkedIn shares
- [ ] Monitor Pinterest pins (if applicable)

---

## Ongoing Maintenance

### Weekly
- [ ] Check Google Search Console for errors
- [ ] Monitor social shares
- [ ] Review top-performing content

### Monthly
- [ ] Review and update meta descriptions
- [ ] Update OG images if needed
- [ ] Check for broken links
- [ ] Review keyword performance
- [ ] Test social sharing on new platforms

### Quarterly
- [ ] Complete SEO audit
- [ ] Update structured data if needed
- [ ] Review and optimize titles
- [ ] Analyze competitor SEO
- [ ] Update documentation

### Annually
- [ ] Major SEO review
- [ ] Update all meta tags
- [ ] Refresh OG images
- [ ] Review and update keywords
- [ ] Check all verification codes still valid

---

## Testing Commands

### Build and Test
```bash
# Clean build
rm -rf .next
npm run build

# Start production server
npm run start

# Test specific page
curl -I https://yourdomain.com/blog/post-slug
```

### Check Meta Tags
```bash
# Homepage
curl https://yourdomain.com | grep -i "og:"
curl https://yourdomain.com | grep -i "twitter:"

# Specific post
curl https://yourdomain.com/blog/post-slug | grep -i "og:"
```

### Test OG Image Generation
```bash
# Blog post
curl -I https://yourdomain.com/api/og?type=post&title=Test

# Project
curl -I https://yourdomain.com/api/og?type=project&title=Test

# Should return 200 OK and Content-Type: image/png
```

---

## Troubleshooting

### OG Images Not Showing
1. Check URL is absolute: `https://yourdomain.com/api/og?...`
2. Test endpoint directly in browser
3. Clear social platform cache
4. Check font files are present
5. Check edge runtime is enabled

### Meta Tags Not Updating
1. Clear browser cache
2. Clear CDN cache if using one
3. Rebuild and redeploy
4. Check page source (view-source:)
5. Use incognito/private browsing

### Structured Data Errors
1. Validate with Google Rich Results Test
2. Check JSON-LD syntax
3. Ensure all required fields present
4. Check date formats (ISO 8601)
5. Verify URLs are absolute

### Social Sharing Issues
1. Test in platform debugger
2. Clear platform cache
3. Check image size (1200x630)
4. Verify image is accessible publicly
5. Check for mixed content (HTTP/HTTPS)

---

## Quick Reference

### Meta Tag Limits
- **Title**: 60 characters
- **Description**: 155 characters (search), 200 (social)
- **Keywords**: 10 keywords maximum
- **OG Title**: 70 characters
- **Twitter Title**: 70 characters

### Image Sizes
- **Open Graph**: 1200x630px (1.91:1)
- **Twitter Large**: 1200x600px (2:1)
- **Twitter Summary**: 1200x1200px (1:1)
- **Favicon**: 32x32px, 16x16px
- **Apple Touch Icon**: 180x180px

### Important URLs
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/
- **Google Rich Results**: https://search.google.com/test/rich-results
- **Meta Tags**: https://metatags.io/
- **Schema Markup**: https://validator.schema.org/

---

## Success Criteria

Your SEO implementation is successful when:

- ✓ All pages have unique, optimized titles and descriptions
- ✓ Social shares show custom OG images
- ✓ Google Rich Results Test shows no errors
- ✓ All verification codes are active
- ✓ Search Console shows no critical issues
- ✓ Social sharing shows correct previews
- ✓ Mobile sharing works correctly
- ✓ Structured data is recognized by search engines
- ✓ CTR improves in search results
- ✓ Social engagement increases

---

## Support

If you encounter issues:

1. Check `/docs/seo/META_TAGS_GUIDE.md` for detailed documentation
2. Review `/docs/seo/SEO_IMPLEMENTATION_SUMMARY.md` for implementation details
3. Test with social debuggers
4. Check Next.js metadata documentation
5. Review code in `/src/lib/seo/` directory

---

**Last Updated**: 2025-10-16
**Version**: 1.0
**Status**: Ready for Deployment
