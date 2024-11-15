import Link from 'next/link'
import { Github, Linkedin, Mail } from 'lucide-react'

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/yourusername',
    icon: Github,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/yourusername',
    icon: Linkedin,
  },
  {
    name: 'Email',
    href: 'mailto:your.email@example.com',
    icon: Mail,
  },
]

export function Footer() {
  return (
    <footer className="mt-auto py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Emmanuel Fabiani. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  aria-label={link.name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
