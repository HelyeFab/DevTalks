import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'
import Link from 'next/link'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Override default components with custom styling
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    ),
    a: ({ href = '', children }) => {
      const isExternal = href.startsWith('http')
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            {children}
          </a>
        )
      }
      return (
        <Link
          href={href}
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {children}
        </Link>
      )
    },
    img: ({ src = '', alt = '' }) => (
      <div className="my-6">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={400}
          className="rounded-lg"
        />
      </div>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-2 text-gray-700 dark:text-gray-300">{children}</li>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary-600 dark:border-primary-400 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
        {children}
      </blockquote>
    ),
    ...components,
  }
}
