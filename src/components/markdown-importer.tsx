'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseMarkdownWithFrontmatter, generateMarkdownTemplate, type ParsedMarkdown } from '@/lib/markdown-parser'

interface MarkdownImporterProps {
  onImport: (parsed: ParsedMarkdown) => void
  className?: string
}

export function MarkdownImporter({ onImport, className = '' }: MarkdownImporterProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error'
    message: string
  }>({ type: 'idle', message: '' })

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      setStatus({
        type: 'error',
        message: 'Please upload a markdown file (.md or .markdown)'
      })
      return
    }

    try {
      const content = await file.text()
      const parsed = parseMarkdownWithFrontmatter(content)

      setStatus({
        type: 'success',
        message: `Successfully imported "${parsed.title}"`
      })

      // Call the import handler
      onImport(parsed)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' })
      }, 3000)
    } catch (error) {
      console.error('Error parsing markdown:', error)
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to parse markdown file'
      })
    }
  }, [onImport])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // Reset input so the same file can be selected again
    e.target.value = ''
  }, [handleFile])

  const downloadTemplate = useCallback(() => {
    const template = generateMarkdownTemplate()
    const blob = new Blob([template], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'post-template.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setStatus({
      type: 'success',
      message: 'Template downloaded! Check your downloads folder.'
    })

    setTimeout(() => {
      setStatus({ type: 'idle', message: '' })
    }, 3000)
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'} transition-colors`}>
            <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>

          <div>
            <p className="text-lg font-medium mb-1">
              {isDragging ? 'Drop your markdown file here' : 'Import from Markdown'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop a .md file or click to browse
            </p>
          </div>

          <input
            type="file"
            accept=".md,.markdown"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload markdown file"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const input = e.currentTarget.parentElement?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
                input?.click()
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Browse Files
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                downloadTemplate()
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {status.type !== 'idle' && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">Quick Tips:</p>
        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
          <li>Download the template to see the proper frontmatter format</li>
          <li>All SEO fields will be auto-filled from your markdown</li>
          <li>Local images will be detected (you'll be prompted to upload them)</li>
          <li>Missing fields will be smart-generated from your content</li>
        </ul>
      </div>
    </div>
  )
}
