import { Metadata } from 'next'
import Image from 'next/image'
import { Github, Mail, Linkedin } from 'lucide-react'
import { getAllProjects } from '@/lib/projects'
import { ProjectSlideshow } from '@/components/project-slideshow'

export const metadata: Metadata = {
  title: 'About',
  description: 'Software engineer, writer, and creator.',
}

export default async function AboutPage() {
  // Try to get featured projects, but have a fallback in case of errors
  let featuredProjects: Array<import('@/types/project').Project> = [];
  try {
    const result: any = await getAllProjects({ featuredOnly: true }); // Get featured projects
    featuredProjects = (result.projects || result.items || result) as any;
  } catch (error) {
    console.error('Error getting projects:', error);
    // Continue with empty array if there's an error
  }

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
        <h1 className="text-4xl font-bold text-center text-foreground">Emmanuel Fabiani</h1>
        <h2 className="text-xl text-muted-foreground text-center mt-2">
          Software Engineer & Writer
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* About Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">About</h2>
            <div className="prose max-w-none">
              <p className="text-muted-foreground">
                I'm Emmanuel, a software engineer based in Paris, France. I specialize in building
                modern web applications with a focus on user experience and performance.
              </p>
              <p className="text-muted-foreground mt-4">
                With a passion for clean code and innovative solutions, I enjoy tackling complex
                problems and creating seamless digital experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Skills Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">Skills & Technologies</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Frontend</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>React & Next.js</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>HTML/CSS</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Backend</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>Node.js</li>
                  <li>Python</li>
                  <li>Firebase</li>
                  <li>REST APIs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Tools</h3>
                <ul className="text-muted-foreground space-y-1">
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
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
            <div className="p-8">
              <ProjectSlideshow projects={featuredProjects} />
            </div>
          </div>
        )}

        {/* Contact Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">Get in Touch</h2>
            <div className="flex flex-col space-y-4">
              <a
                href="https://github.com/emmanuelfabiani"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5 mr-2" />
                <span>GitHub</span>
              </a>
              <a
                href="https://linkedin.com/in/emmanuelfabiani"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                <span>LinkedIn</span>
              </a>
              <a
                href="mailto:emmanuelfabiani23@gmail.com"
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
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
