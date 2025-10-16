import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Github, ExternalLink } from 'lucide-react'
import { getProjectBySlug } from '@/lib/projects'
import { Markdown } from '@/components/markdown'
import { generateProjectMetadata } from '@/lib/seo/meta-generator'
import { generateProjectSchema, generateBreadcrumbSchema, toJsonLd } from '@/lib/seo/schema'
import { Breadcrumbs } from '@/components/breadcrumbs'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const project = await getProjectBySlug(slug)

    if (!project) {
      return {
        title: 'Project Not Found',
      }
    }

    // Use the comprehensive meta generator with dynamic OG images
    return generateProjectMetadata(project, {
      generateOGImage: true, // Use dynamic OG image generation
    })
  } catch (error) {
    console.error('Error generating project metadata:', error)
    return {
      title: 'Error Loading Project'
    }
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params

  try {
    const project = await getProjectBySlug(slug)

    if (!project) {
      notFound()
    }

    // Generate structured data
    const projectSchema = generateProjectSchema(project)

    // Generate breadcrumbs
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Projects', url: '/projects' },
      { name: project.title, url: `/projects/${project.slug}` },
    ]

    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs)

    return (
      <>
        {/* Structured data - Project */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(projectSchema) }}
        />
        {/* Structured data - Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
        />

        <article className="container mx-auto px-4 py-12 max-w-4xl">
          <Breadcrumbs items={breadcrumbs} className="mb-8" />
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <header className="mb-12">
          <div className="relative aspect-[16/9] w-full mb-8">
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              className="object-cover object-center-top rounded-lg"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
          {project.subtitle && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              {project.subtitle}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <Github className="h-5 w-5" />
                <span>View Source</span>
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <ExternalLink className="h-5 w-5" />
                <span>View Live</span>
              </a>
            )}
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <Markdown content={project.content} />
        </div>
      </article>
      </>
    )
  } catch (error) {
    console.error('Error loading project:', error)
    notFound()
  }
}
