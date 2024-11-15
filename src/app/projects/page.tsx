import { Metadata } from 'next'
import { ProjectCard } from '@/components/project-card'
import { projects } from '@/data/projects'

export const metadata: Metadata = {
  title: 'Projects - Emmanuel Fabiani',
  description: 'A showcase of my work in AI, web development, and technology.',
}

export default function ProjectsPage() {
  const featuredProjects = projects.filter((project) => project.featured)
  const otherProjects = projects.filter((project) => !project.featured)

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
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
  )
}
