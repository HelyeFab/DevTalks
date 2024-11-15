'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Project } from '@/types/project'
import { ProjectCard } from './project-card'

interface Props {
  projects: Project[]
}

export function ProjectSlideshow({ projects }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % projects.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, projects.length])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((current) => (current - 1 + projects.length) % projects.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((current) => (current + 1) % projects.length)
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Featured Projects</h2>
        <div className="relative">
          {/* Project Card */}
          <div className="transition-opacity duration-500">
            <ProjectCard project={projects[currentIndex]} />
          </div>

          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors pointer-events-auto"
              aria-label="Previous project"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors pointer-events-auto"
              aria-label="Next project"
            >
              <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false)
                  setCurrentIndex(index)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary-600 dark:bg-primary-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Go to project ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
