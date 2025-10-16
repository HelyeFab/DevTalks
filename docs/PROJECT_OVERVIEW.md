# DevTalks - Project Overview

## About
DevTalks is a modern, full-stack blog platform built with Next.js 15 and Firebase, focusing on software development content, community interaction, and technical excellence.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.0.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons
- **Markdown**: MDX with syntax highlighting

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Analytics**: Firebase Analytics
- **Hosting**: Vercel/Firebase Hosting

### Development Tools
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

## Key Features

### Content Management
- MDX-based blog posts
- Dynamic project portfolio
- Announcement system
- Rich text editing with markdown

### User Features
- Authentication (Google, GitHub, Email)
- User profiles
- Comments and discussions
- Upvoting system
- Dark/light theme with 12 color palettes

### Admin Features
- Content moderation dashboard
- User management
- Analytics dashboard
- Bulk operations

### SEO & Performance
- Server-side rendering
- Dynamic sitemap generation
- Schema.org structured data
- Open Graph meta tags
- Optimized images with Next.js Image

## Project Structure

```
DevTalks/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── lib/          # Utilities and services
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript definitions
├── public/           # Static assets
├── config/           # Configuration files
├── docs/            # Documentation
└── __tests__/       # Test files
```

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run type-check` - Check TypeScript

## Environment Variables
Required environment variables are documented in `.env.example`

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License
This project is proprietary software. All rights reserved.