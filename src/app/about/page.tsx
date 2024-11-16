import { Metadata } from 'next'
import Image from 'next/image'
import { Github, Mail, Linkedin } from 'lucide-react'
import { projects } from '@/data/projects'
import { ProjectSlideshow } from '@/components/project-slideshow'

export const metadata: Metadata = {
  title: 'About - DevTalks',
  description: 'Software engineer, writer, and creator.',
}

export default function AboutPage() {
  const featuredProjects = projects.filter(project => project.featured)

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-16">
        <div className="relative w-48 h-48 mb-8">
          <Image
            src="/images/profile.png"
            alt="Emmanuel Fabiani"
            fill
            sizes="(max-width: 768px) 192px, 192px"
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

        {/* Skills Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Skills & Technologies</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Frontend</h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>React & Next.js</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>HTML/CSS</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Backend</h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Node.js</li>
                  <li>Python</li>
                  <li>Firebase</li>
                  <li>REST APIs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tools</h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Git</li>
                  <li>VS Code</li>
                  <li>Docker</li>
                  <li>AWS</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Projects Card */}
        {featuredProjects.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
            <div className="p-8">
              <ProjectSlideshow projects={featuredProjects} />
            </div>
          </div>
        )}

        {/* Contact Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <div className="flex flex-col space-y-4">
              <a
                href="https://github.com/emmanuelfabiani"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Github className="h-5 w-5 mr-2" />
                <span>GitHub</span>
              </a>
              <a
                href="https://linkedin.com/in/emmanuelfabiani"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                <span>LinkedIn</span>
              </a>
              <a
                href="mailto:emmanuelfabiani23@gmail.com"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Mail className="h-5 w-5 mr-2" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
