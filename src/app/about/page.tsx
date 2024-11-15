import { Metadata } from 'next'
import Image from 'next/image'
import { Github, Mail, Linkedin } from 'lucide-react'
import { projects } from '@/data/projects'
import { ProjectSlideshow } from '@/components/project-slideshow'

export const metadata: Metadata = {
  title: 'About - Emmanuel Fabiani',
  description: 'Software engineer, writer, and creator.',
}

export default function AboutPage() {
  const featuredProjects = projects.filter(project => project.featured)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-16">
        <div className="relative w-48 h-48 mb-8">
          <Image
            src="/images/profile.png"
            alt="Emmanuel Fabiani"
            fill
            className="rounded-full object-cover"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-center">Emmanuel Fabiani</h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-400 text-center mt-2">
          Software Engineer & Writer
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* About Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                I'm Emmanuel, a software engineer based in Paris, France. I specialize in building
                modern web applications with a focus on user experience and performance.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                With a passion for clean code and innovative solutions, I enjoy tackling complex
                problems and creating seamless digital experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Experience Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Experience</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold">Senior Software Engineer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current Company • 2021 - Present
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Leading development of modern web applications using Next.js, React, and TypeScript.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Next.js', 'React', 'TypeScript', 'Node.js'].map((tech) => (
                    <span
                      key={tech}
                      className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Software Engineer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Previous Company • 2019 - 2021
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Developed and maintained full-stack applications using Node.js and React.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['React', 'Node.js', 'PostgreSQL', 'AWS'].map((tech) => (
                    <span
                      key={tech}
                      className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Slideshow */}
        <ProjectSlideshow projects={featuredProjects} />

        {/* Contact Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Feel free to reach out if you'd like to collaborate on a project or just want to connect.
            </p>
            <div className="space-y-4">
              <a
                href="mailto:emmanuelfabiani23@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>Send Email</span>
              </a>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
