'use client'

import { useState } from 'react'
import { Search, Calendar, Music } from 'lucide-react'

interface FestivalFormProps {
  onSubmit: (festivalName: string, festivalDate: string) => void
  loading: boolean
}

export default function FestivalForm({ onSubmit, loading }: FestivalFormProps) {
  const [festivalName, setFestivalName] = useState('')
  const [festivalDate, setFestivalDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with:', festivalName, festivalDate)
    if (festivalName && festivalDate) {
      onSubmit(festivalName, festivalDate)
    }
  }

  return (
    <div className="card mb-8">
              <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Festival</h2>
          <p className="text-gray-700">Enter the festival name and date to discover the lineup</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="festivalName" className="block text-sm font-medium text-gray-800 mb-2">
              Festival Name
            </label>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="festivalName"
                value={festivalName}
                onChange={(e) => setFestivalName(e.target.value)}
                placeholder="e.g., Coachella, Tomorrowland, Lollapalooza"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="festivalDate" className="block text-sm font-medium text-gray-800 mb-2">
              Festival Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                id="festivalDate"
                value={festivalDate}
                onChange={(e) => setFestivalDate(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || !festivalName || !festivalDate}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Find Artists & Songs</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Popular Festivals */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Festivals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Coachella', date: '2024-04-12' },
            { name: 'Tomorrowland', date: '2024-07-19' },
            { name: 'Lollapalooza', date: '2024-08-01' },
            { name: 'Ultra Miami', date: '2024-03-22' },
          ].map((festival) => (
            <button
              key={festival.name}
              onClick={() => {
                console.log('Setting festival:', festival.name, festival.date)
                setFestivalName(festival.name)
                setFestivalDate(festival.date)
              }}
              className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors bg-white/80"
            >
              <div className="font-medium text-gray-900">{festival.name}</div>
              <div className="text-sm text-gray-500">{festival.date}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 