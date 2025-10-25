'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle2, ClipboardPaste } from 'lucide-react'
import { parseMarkdownWithFrontmatter, generateMarkdownTemplate, type ParsedMarkdown } from '@/lib/markdown-parser'
import { Modal } from '@/components/modal'

interface MarkdownImporterProps {
  onImport: (parsed: ParsedMarkdown) => void
  className?: string
}

export function MarkdownImporter({ onImport, className = '' }: MarkdownImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pastedContent, setPastedContent] = useState('')
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

  const handlePasteImport = useCallback(() => {
    if (!pastedContent.trim()) {
      setStatus({
        type: 'error',
        message: 'Please paste some markdown content'
      })
      return
    }

    try {
      const parsed = parseMarkdownWithFrontmatter(pastedContent)

      setStatus({
        type: 'success',
        message: `Successfully imported "${parsed.title}"`
      })

      // Call the import handler
      onImport(parsed)

      // Close modal and reset
      setShowPasteModal(false)
      setPastedContent('')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' })
      }, 3000)
    } catch (error) {
      console.error('Error parsing markdown:', error)
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to parse markdown content'
      })
    }
  }, [pastedContent, onImport])

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
<<<<<<< HEAD
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          console.log('Drag-drop area clicked')
          fileInputRef.current?.click()
        }}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
=======
      {/* Import Options */}
      <div className="relative border-2 border-dashed rounded-lg p-8 transition-all border-border hover:border-primary/50 hover:bg-muted/30">
>>>>>>> d76c76b (Add SEO assets, Google Search Console verification, and markdown importer improvements)
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="p-4 rounded-full bg-muted transition-colors">
            <ClipboardPaste className="h-8 w-8 text-muted-foreground" />
          </div>

          <div>
            <p className="text-lg font-medium mb-1">
              Import from Markdown
            </p>
            <p className="text-sm text-muted-foreground">
              Paste your markdown content with YAML frontmatter
            </p>
          </div>

<<<<<<< HEAD
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown"
            onChange={handleFileInput}
            className="hidden"
            aria-label="Upload markdown file"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('MarkdownImporter: Browse button clicked', {
                  hasRef: !!fileInputRef.current,
                  refElement: fileInputRef.current
                })
                if (fileInputRef.current) {
                  fileInputRef.current.click()
                  console.log('MarkdownImporter: File input click triggered')
                } else {
                  console.error('MarkdownImporter: File input ref is null!')
                  setStatus({
                    type: 'error',
                    message: 'File picker not initialized. Please refresh the page.'
                  })
                }
              }}
=======
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
>>>>>>> d76c76b (Add SEO assets, Google Search Console verification, and markdown importer improvements)
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste Markdown
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
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

      {/* Paste Modal */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => {
          setShowPasteModal(false)
          setPastedContent('')
          setStatus({ type: 'idle', message: '' })
        }}
        title="Paste Markdown Content"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-card-foreground">
              Markdown with YAML Frontmatter
            </label>
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder={`---
title: "Your Post Title"
subtitle: "Optional subtitle"
date: "${new Date().toISOString().split('T')[0]}"
seo:
  metaTitle: "SEO title"
  metaDescription: "Description"
  focusKeyword: "keyword"
  category: "Category"
tags: ["tag1", "tag2"]
image: "https://example.com/image.jpg"
imageAlt: "Image description"
---

# Your Content Here

Write your markdown content...`}
              className="w-full h-96 px-3 py-2 border border-border rounded-lg bg-input text-foreground font-mono text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {status.type === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{status.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowPasteModal(false)
                setPastedContent('')
                setStatus({ type: 'idle', message: '' })
              }}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasteImport}
              disabled={!pastedContent.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
