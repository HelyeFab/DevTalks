'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface DatePickerProps {
  value: string // ISO string
  onChange: (date: string) => void
  label?: string
  className?: string
}

export function DatePicker({ value, onChange, label = "Date", className = "" }: DatePickerProps) {
  const [localDate, setLocalDate] = useState('')
  const [localTime, setLocalTime] = useState('')

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      // Format for date input (YYYY-MM-DD)
      const dateStr = date.toISOString().split('T')[0]
      // Format for time input (HH:MM)
      const timeStr = date.toTimeString().slice(0, 5)
      setLocalDate(dateStr)
      setLocalTime(timeStr)
    }
  }, [value])

  const handleDateChange = (newDate: string) => {
    setLocalDate(newDate)
    updateDateTime(newDate, localTime)
  }

  const handleTimeChange = (newTime: string) => {
    setLocalTime(newTime)
    updateDateTime(localDate, newTime)
  }

  const updateDateTime = (dateStr: string, timeStr: string) => {
    if (dateStr && timeStr) {
      // Combine date and time and convert to ISO string
      const combinedDateTime = new Date(`${dateStr}T${timeStr}:00`)
      onChange(combinedDateTime.toISOString())
    }
  }

  const resetToNow = () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setLocalDate(dateStr)
    setLocalTime(timeStr)
    onChange(now.toISOString())
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Calendar className="inline h-4 w-4 mr-1" />
        {label}
      </label>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Date
          </label>
          <input
            type="date"
            value={localDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 text-sm"
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Time
          </label>
          <input
            type="time"
            value={localTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 text-sm"
          />
        </div>

        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={resetToNow}
            className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            Set to Now
          </button>
        </div>
      </div>

      {value && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Preview: {new Date(value).toLocaleString()}
        </div>
      )}
    </div>
  )
}
