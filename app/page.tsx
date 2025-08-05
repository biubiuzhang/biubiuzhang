'use client'

import { useState } from 'react'
import { Search, Music, Calendar, Download, Play } from 'lucide-react'
import FestivalForm from './components/FestivalForm'
import PlaylistDisplay from './components/PlaylistDisplay'
import DynamicBackground from './components/DynamicBackground'
import { Artist, Song, PlaylistData } from './types'
import { RealDataService } from './services/realDataService'

export default function Home() {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFestivalSubmit = async (festivalName: string, festivalDate: string) => {
    setLoading(true)
    try {
      const playlistData = await RealDataService.searchFestival(festivalName, festivalDate)
      
      if (playlistData) {
        setPlaylistData(playlistData)
      } else {
        console.error('No festival data found')
      }
    } catch (error) {
      console.error('Error generating playlist:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">Festival Playlist Tool</h1>
          </div>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Enter a music festival and date to discover artists and create the perfect playlist for your experience
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <FestivalForm onSubmit={handleFestivalSubmit} loading={loading} />
          
          {playlistData && (
            <PlaylistDisplay playlistData={playlistData} />
          )}
        </div>
      </div>
    </div>
  )
} 