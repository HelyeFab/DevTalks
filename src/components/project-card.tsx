import Image from 'next/image'
import { Github, ExternalLink } from 'lucide-react'
import type { Project } from '@/types/project'
import { ProjectCardClient } from './project-card-client'
import { generateShimmerDataURL } from '@/lib/image-optimization'

// Server Component - renders project data and wraps with minimal Client Component for interactivity
export function ProjectCard({ project }: { project: Project }) {
  return (
    <ProjectCardClient slug={project.slug}>
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center-top transition-transform duration-300 group-hover:scale-105"
          quality={85}
          placeholder="blur"
          blurDataURL={generateShimmerDataURL()}
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 px-2 py-1 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {project.githubUrl && (
            <a
              data-card-link
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
          {project.liveUrl && (
            <a
              data-card-link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
              aria-label="View live project"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </ProjectCardClient>
  )
}
