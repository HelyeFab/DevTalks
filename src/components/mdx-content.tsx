'use client'

import { MDXRemote } from 'next-mdx-remote'
import components from './mdx-components'

interface MDXContentProps {
  source: any // Using any temporarily to fix type issues
}

export function MDXContent({ source }: MDXContentProps) {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <MDXRemote {...source} components={components} />
    </article>
  )
}
