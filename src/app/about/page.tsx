import { Metadata } from 'next'
import Image from 'next/image'
import { Github, Mail, Linkedin } from 'lucide-react'
import { getAllProjects } from '@/lib/projects'
import { ProjectSlideshow } from '@/components/project-slideshow'
import { generateProfileMetadata } from '@/lib/seo/meta-generator'
import { generateAboutPageSchema, toJsonLd } from '@/lib/seo/schema'
import { Breadcrumbs } from '@/components/breadcrumbs'

export const metadata: Metadata = generateProfileMetadata({
  name: 'Emmanuel Fabiani',
  bio: 'Software Engineer, Certified Salesforce Administrator, and Computer Science student passionate about web development and technology. Experienced in React, Next.js, TypeScript, and modern web technologies.',
  image: '/images/profile.png',
  url: 'about',
  socials: {
    twitter: '@emmanuelfabiani',
    github: 'https://github.com/emmanuelfabiani',
    linkedin: 'https://linkedin.com/in/emmanuelfabiani',
  },
})

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

  // Generate structured data
  const schema = generateAboutPageSchema()

  const breadcrumbs = [
    { name: 'About', url: '/about' }
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
      {/* Header Section */}
      <div className="flex flex-col items-center mb-16">
        <div className="relative w-48 h-48 mb-8">
          <Image
            src="/images/profile.png"
            alt="Emmanuel Fabiani"
            fill
            sizes="(max-width: 768px) 192px, 192px"
            className="rounded-full object-cover object-center-top"
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
                I am a certified Salesforce Administrator with a multidisciplinary background in web development, project management, and user-focused design. Currently completing a BSc in Computer Science with The Open University, I bring a strong foundation in both technical implementation and strategic problem-solving.
              </p>
              <p className="text-muted-foreground mt-4">
                Over the years, I have developed and managed digital projects that reflect a commitment to quality, usability, and results. My work—ranging from running my own web design agency to designing automation flows and managing client expectations—demonstrates my ability to deliver structured, scalable solutions in dynamic environments.
              </p>
              <p className="text-muted-foreground mt-4">
                I am highly self-motivated, well-organized, and accustomed to working independently in remote settings. My approach is both analytical and people-oriented: I enjoy translating complex requirements into actionable plans and ensuring systems are intuitive for users. As I move forward in my Salesforce career, I am looking to join a team where I can contribute meaningfully, continue growing, and help drive business value through smart use of technology.
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
    </>
  )
}
