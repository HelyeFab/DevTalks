Here's a detailed walkthrough of how to add a new project to your website:

Project Image
Create a project image (recommended size: 1200x630 pixels)
Save it in the /public/images/projects/ directory
Format should be .webp for optimal performance
Example path: /public/images/projects/your-project-name.webp
Project Data Edit /src/data/projects.ts:
typescript
```
export const projects: Project[] = [
  {
    id: 'your-project-id',
    title: 'Your Project Title',
    subtitle: 'Optional subtitle',
    description: `
      A brief description of your project (2-3 sentences).
      This appears in the project card.
    `,
    content: `
      # Detailed Project Description
      
      A full markdown description of your project.
      
      ## Features
      - Feature 1
      - Feature 2
      
      ## Technology
      Technical details about your implementation.
    `,
    image: '/images/projects/your-project-name.webp',
    technologies: ['Tech1', 'Tech2', 'Tech3'],
    liveUrl: 'https://your-project-url.com', // Optional
    githubUrl: 'https://github.com/your/repo', // Optional
    featured: true, // Set to true to show in featured section
    slug: 'your-project-slug' // URL-friendly version of your title
  },
  // ... other projects
]

```
Required Fields:
id: Unique identifier for the project
title: Project name
description: Short description for the card view
content: Full markdown content for the project page
image: Path to project image
technologies: Array of technologies used
slug: URL-friendly identifier (used in /projects/[slug])
featured: Boolean to determine if it shows in featured section
Optional Fields:
subtitle: Additional context below the title
githubUrl: Link to GitHub repository
liveUrl: Link to live project
Content Format:
The content field supports Markdown formatting
Use headings (#, ##, ###) for structure
Include lists with bullet points (-)
You can add code blocks with triple backticks
Images can be included using Markdown syntax
Project Image Guidelines:
Use .webp format for better performance
Maintain 16:9 aspect ratio
Optimize for web (compress if needed)
Keep file size under 500KB
Minimum dimensions: 1200x630 pixels
Testing: After adding the project:
Run the development server: npm run dev
Visit /projects to see the project card
Click the card to test the project detail page
Check both desktop and mobile views
Verify all links work correctly
SEO Optimization:
Use descriptive titles
Write comprehensive descriptions
Include relevant technologies
Use meaningful image alt text
Remember to:

Keep descriptions clear and concise
Use high-quality images
Test on both desktop and mobile
Verify all links work
Check markdown formatting in the content
The project will automatically appear in:

/projects page (all projects)
Featured section (if featured: true)
Individual project page at /projects/[slug]
