import { Metadata } from 'next'
import { ProjectCard } from '@/components/project-card'
import { getAllProjects } from '@/lib/projects'
import { Project } from '@/types/project'
import { SITE_CONFIG, getCanonicalUrl } from '@/lib/seo/utils'
import { generateCollectionPageSchema, toJsonLd } from '@/lib/seo/schema'
import { Breadcrumbs } from '@/components/breadcrumbs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore our showcase of AI applications, web development projects, and innovative technology solutions.',
  keywords: [
    'web development projects',
    'AI applications',
    'technology solutions',
    'software projects',
    'open source projects',
    'react projects',
    'nextjs projects',
    'portfolio',
  ],
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: getCanonicalUrl('projects'),
    title: 'Projects | DevTalks',
    description: 'Explore our showcase of AI applications, web development projects, and innovative technology solutions.',
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: `${SITE_CONFIG.url}/api/og?type=projects&title=${encodeURIComponent('Projects Showcase')}`,
        width: 1200,
        height: 630,
        alt: 'Projects | DevTalks',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
    title: 'Projects | DevTalks',
    description: 'Explore our showcase of AI applications, web development projects, and innovative technology solutions.',
    images: [
      {
        url: `${SITE_CONFIG.url}/api/og?type=projects&title=${encodeURIComponent('Projects Showcase')}`,
        alt: 'Projects',
      },
    ],
  },
  alternates: {
    canonical: getCanonicalUrl('projects'),
    languages: {
      'en-US': getCanonicalUrl('projects'),
      'x-default': getCanonicalUrl('projects'),
    },
  },
}

export default async function ProjectsPage() {
  const result = await getAllProjects()
  const projects = result.items
  const featuredProjects = projects.filter((project: Project) => project.featured)
  const otherProjects = projects.filter((project: Project) => !project.featured)

  // Generate structured data
  const schema = generateCollectionPageSchema(
    'Projects',
    'A showcase of AI applications, web development projects, and innovative technology solutions',
    'projects'
  )

  const breadcrumbs = [
    { name: 'Projects', url: '/projects' }
  ]

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
      />

      <div className="container mx-auto px-4 max-w-6xl py-12">
        <Breadcrumbs items={breadcrumbs} className="mb-8" />
      <h1 className="text-4xl font-bold mb-8">Projects</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl">
        Here's a selection of my projects, focusing on AI applications, web development,
        and technology solutions. Each project represents a unique challenge and
        innovative solution.
      </p>

      {/* Featured Projects */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-8">Other Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  )
}
