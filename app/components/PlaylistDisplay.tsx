'use client'

import { useState, useEffect } from 'react'
import { Play, Download, Share2, Music, Clock, Users } from 'lucide-react'
import { PlaylistData, Artist } from '../types'

interface PlaylistDisplayProps {
  playlistData: PlaylistData
}

// List of generic/invalid names to exclude
const INVALID_NAMES = new Set(['a', 'b', 'c', 'my', 'the', 'artist', 'band', 'group', 'unknown', 'untitled'])

function isValidArtistName(name: string) {
  if (!name) return false
  const lower = name.trim().toLowerCase()
  return (
    name.length > 1 &&
    /[a-zA-Z]/.test(name) &&
    !INVALID_NAMES.has(lower) &&
    name !== name.toUpperCase() &&
    !/^track|song|music|unknown|untitled|various|compilation|disc|cd|side|volume|vol|playlist|set$/i.test(lower)
  )
}

export default function PlaylistDisplay({ playlistData }: PlaylistDisplayProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'spotify' | 'youtube-music'>('youtube')
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null)

  // Filter out invalid artists
  const validArtists = (playlistData.artists || []).filter(artist => isValidArtistName(artist.name))

  // Debug: log the raw artist list and filtered list
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('Raw artists:', playlistData.artists)
    // eslint-disable-next-line no-console
    console.log('Valid artists:', validArtists)
  }, [playlistData.artists])

  const totalSongs = validArtists.reduce((total, artist) => total + (artist.songs?.length || 0), 0)
  const estimatedDuration = `${Math.round(totalSongs * 3.5)} minutes`

  const generatePlaylistUrl = (platform: string) => {
    const songUrls = validArtists.flatMap(artist => 
      (artist.songs || []).map(song => song.url)
    )
    
    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/playlist?list=${btoa(JSON.stringify(songUrls))}`
      case 'spotify':
        return `https://open.spotify.com/playlist/${btoa(JSON.stringify(songUrls))}`
      case 'youtube-music':
        return `https://music.youtube.com/playlist?list=${btoa(JSON.stringify(songUrls))}`
      default:
        return '#'
    }
  }

  const exportPlaylist = () => {
    const playlistText = validArtists.map(artist => 
      `${artist.name}:\n${(artist.songs || []).map(song => `- ${song.title}`).join('\n')}`
    ).join('\n\n')
    
    const blob = new Blob([playlistText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${playlistData.festivalName || 'playlist'}-playlist.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Festival Info Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{playlistData.festivalName || 'Unknown Festival'}</h2>
            <p className="text-gray-600">{playlistData.festivalDate || 'Unknown Date'}</p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Music className="w-4 h-4" />
              <span>{totalSongs} songs</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>~{estimatedDuration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{validArtists.length} artists</span>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        {totalSongs > 0 && (
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium text-gray-700">Export to:</span>
            {(['youtube', 'spotify', 'youtube-music'] as const).map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={
                  selectedPlatform === platform
                    ? 'btn-primary'
                    : 'btn-primary'
                }
              >
                {platform === 'youtube' ? 'YouTube' : platform === 'youtube-music' ? 'YouTube Music' : 'Spotify'}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {totalSongs > 0 && (
          <div className="flex items-center space-x-3">
            <a
              href={generatePlaylistUrl(selectedPlatform)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Open in {selectedPlatform === 'youtube' ? 'YouTube' : selectedPlatform === 'youtube-music' ? 'YouTube Music' : 'Spotify'}</span>
            </a>
            <button
              onClick={exportPlaylist}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export List</span>
            </button>
            <button
              onClick={() => navigator.share?.({ title: `${playlistData.festivalName || 'Festival'} Playlist`, text: `Check out this ${playlistData.festivalName || 'Festival'} playlist!` })}
              className="btn-primary flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        )}
      </div>

      {/* Artists List */}
      <div className="space-y-4">
        {validArtists.length === 0 && (
          <div className="card text-center text-gray-600">No valid artists found for this festival/date. Try a different date or festival.</div>
        )}
        {validArtists.map((artist, index) => (
          <div key={artist.name} className="card">
            <div className="flex items-center space-x-4">
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                  {artist.name[0]}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{artist.name}</h3>
                <p className="text-gray-600">{artist.songs?.length || 0} songs</p>
              </div>
              {artist.songs && artist.songs.length > 0 && (
                <button
                  onClick={() => setExpandedArtist(expandedArtist === artist.name ? null : artist.name)}
                  className="btn-primary"
                >
                  {expandedArtist === artist.name ? 'Hide Songs' : 'Show Songs'}
                </button>
              )}
            </div>

            {expandedArtist === artist.name && artist.songs && artist.songs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {artist.songs.map((song, songIndex) => (
                    <div key={songIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{song.title}</div>
                        <div className="text-sm text-gray-600">{artist.name}</div>
                      </div>
                      {song.url && (
                        <a
                          href={song.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-sm px-3 py-1"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 