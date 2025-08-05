import { PlaylistData, Artist, Song } from '../types'

// Real API service for festival data
export class RealFestivalService {
  // API endpoints and keys
  private static readonly SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  private static readonly SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
  private static readonly YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  private static readonly LASTFM_API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY

  static async searchFestival(festivalName: string, festivalDate: string): Promise<PlaylistData | null> {
    try {
      // Try multiple sources for festival data
      const festivalData = await this.searchMultipleSources(festivalName, festivalDate)
      
      if (!festivalData || festivalData.artists.length === 0) {
        console.log('No real festival data found, using fallback')
        return this.generateFallbackPlaylist(festivalName, festivalDate)
      }

      // Get real song data for each artist
      const artistsWithSongs = await Promise.all(
        festivalData.artists.map(async (artist) => {
          const songs = await this.getArtistTopSongs(artist.name)
          return {
            ...artist,
            songs: songs.slice(0, 5) // Limit to top 5 songs
          }
        })
      )

      return {
        festivalName: festivalData.name,
        festivalDate,
        artists: artistsWithSongs,
        totalSongs: artistsWithSongs.reduce((total, artist) => total + artist.songs.length, 0),
        estimatedDuration: `${Math.round(artistsWithSongs.reduce((total, artist) => total + artist.songs.length, 0) * 3.5)} minutes`
      }
    } catch (error) {
      console.error('Error searching festival:', error)
      return this.generateFallbackPlaylist(festivalName, festivalDate)
    }
  }

  // Search multiple sources for festival data
  private static async searchMultipleSources(festivalName: string, festivalDate: string) {
    const sources = [
      this.searchLastFmEvents(festivalName, festivalDate),
      this.searchSpotifyArtists(festivalName),
      this.searchYouTubeMusic(festivalName)
    ]

    // Try all sources in parallel
    const results = await Promise.allSettled(sources)
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value && result.value.artists.length > 0) {
        return result.value
      }
    }

    return null
  }

  // Search Last.fm for events
  private static async searchLastFmEvents(festivalName: string, festivalDate: string) {
    if (!this.LASTFM_API_KEY) return null

    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=geo.getevents&location=${encodeURIComponent(festivalName)}&date=${festivalDate}&api_key=${this.LASTFM_API_KEY}&format=json`
      )
      
      const data = await response.json()
      
      if (data.events?.event) {
        const events = Array.isArray(data.events.event) ? data.events.event : [data.events.event]
        const artists = events.flatMap((event: any) => 
          event.artists?.artist ? 
            (Array.isArray(event.artists.artist) ? event.artists.artist : [event.artists.artist])
            .map((artist: any) => ({
              name: artist.name,
              image: artist.image?.[2]?.['#text'] || null
            })) : []
        )

        return {
          name: festivalName,
          artists: artists.slice(0, 10) // Limit to 10 artists
        }
      }
    } catch (error) {
      console.error('Last.fm API error:', error)
    }
    
    return null
  }

  // Search Spotify for artists related to festival
  private static async searchSpotifyArtists(festivalName: string) {
    if (!this.SPOTIFY_CLIENT_ID || !this.SPOTIFY_CLIENT_SECRET) return null

    try {
      const token = await this.getSpotifyToken()
      
      // Search for artists that might be related to the festival
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(festivalName)}&type=artist&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const data = await response.json()
      
      if (data.artists?.items) {
        const artists = data.artists.items.map((artist: any) => ({
          name: artist.name,
          image: artist.images?.[0]?.url || null
        }))

        return {
          name: festivalName,
          artists: artists.slice(0, 5) // Limit to 5 artists
        }
      }
    } catch (error) {
      console.error('Spotify API error:', error)
    }
    
    return null
  }

  // Search YouTube for music content related to festival
  private static async searchYouTubeMusic(festivalName: string) {
    if (!this.YOUTUBE_API_KEY) return null

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(`${festivalName} music festival lineup`)}&type=video&key=${this.YOUTUBE_API_KEY}&maxResults=10`
      )
      
      const data = await response.json()
      
      if (data.items) {
        // Extract potential artist names from video titles
        const potentialArtists = data.items
          .map((item: any) => item.snippet.title)
          .filter((title: string) => title.toLowerCase().includes('artist') || title.toLowerCase().includes('lineup'))
          .slice(0, 3)
          .map((title: string) => ({
            name: title.split(' ')[0], // Simple extraction
            image: null
          }))

        return {
          name: festivalName,
          artists: potentialArtists
        }
      }
    } catch (error) {
      console.error('YouTube API error:', error)
    }
    
    return null
  }

  // Get artist's top songs from Spotify
  private static async getArtistTopSongs(artistName: string): Promise<Song[]> {
    if (!this.SPOTIFY_CLIENT_ID || !this.SPOTIFY_CLIENT_SECRET) {
      return this.getLastFmTopSongs(artistName)
    }

    try {
      const token = await this.getSpotifyToken()
      
      // Search for artist
      const artistResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const artistData = await artistResponse.json()
      const artist = artistData.artists?.items?.[0]
      
      if (!artist) {
        return this.getLastFmTopSongs(artistName)
      }

      // Get artist's top tracks
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const tracksData = await tracksResponse.json()
      
      // Convert to Song objects and get YouTube links
      const songs = await Promise.all(
        tracksData.tracks?.slice(0, 5).map(async (track: any) => {
          const youtubeUrl = await this.getYouTubeMusicLink(artistName, track.name)
          return {
            title: track.name,
            url: youtubeUrl || track.external_urls.spotify,
            platform: youtubeUrl ? 'youtube' : 'spotify'
          }
        }) || []
      )

      return songs
      
    } catch (error) {
      console.error('Spotify API error:', error)
      return this.getLastFmTopSongs(artistName)
    }
  }

  // Get artist's top songs from Last.fm
  private static async getLastFmTopSongs(artistName: string): Promise<Song[]> {
    if (!this.LASTFM_API_KEY) return []

    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&api_key=${this.LASTFM_API_KEY}&format=json&limit=5`
      )
      
      const data = await response.json()
      
      if (data.toptracks?.track) {
        const tracks = Array.isArray(data.toptracks.track) ? data.toptracks.track : [data.toptracks.track]
        
        const songs = await Promise.all(
          tracks.map(async (track: any) => {
            const youtubeUrl = await this.getYouTubeMusicLink(artistName, track.name)
            return {
              title: track.name,
              url: youtubeUrl || `https://www.last.fm/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(track.name)}`,
              platform: youtubeUrl ? 'youtube' : 'lastfm'
            }
          })
        )

        return songs
      }
    } catch (error) {
      console.error('Last.fm API error:', error)
    }
    
    return []
  }

  // Get YouTube Music link for a song
  private static async getYouTubeMusicLink(artistName: string, songTitle: string): Promise<string | null> {
    if (!this.YOUTUBE_API_KEY) return null

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(`${artistName} ${songTitle} official`)}&type=video&key=${this.YOUTUBE_API_KEY}&maxResults=1`
      )
      
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId
        return `https://music.youtube.com/watch?v=${videoId}`
      }
    } catch (error) {
      console.error('YouTube API error:', error)
    }
    
    return null
  }

  // Get Spotify access token
  private static async getSpotifyToken(): Promise<string> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.SPOTIFY_CLIENT_ID}:${this.SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    })
    
    const data = await response.json()
    return data.access_token
  }

  // Fallback playlist when no real data is found
  private static generateFallbackPlaylist(festivalName: string, festivalDate: string): PlaylistData {
    const fallbackArtists = [
      {
        name: 'Taylor Swift',
        image: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3133a15fbb0',
        songs: [
          { title: 'Cruel Summer', url: 'https://www.youtube.com/watch?v=ic8j13piAhQ' },
          { title: 'Anti-Hero', url: 'https://www.youtube.com/watch?v=b1kbLWxZqNk' },
          { title: 'Blank Space', url: 'https://www.youtube.com/watch?v=e-ORhEE9VVg' },
          { title: 'Shake It Off', url: 'https://www.youtube.com/watch?v=nfWlot6h_JM' },
          { title: 'Love Story', url: 'https://www.youtube.com/watch?v=8xg3vE8Ie_E' }
        ]
      },
      {
        name: 'Drake',
        image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
        songs: [
          { title: 'God\'s Plan', url: 'https://www.youtube.com/watch?v=xpVfcZRZ0gw' },
          { title: 'One Dance', url: 'https://www.youtube.com/watch?v=WizkXKfw73g' },
          { title: 'Hotline Bling', url: 'https://www.youtube.com/watch?v=uxpDa-c-4Mc' },
          { title: 'Started From the Bottom', url: 'https://www.youtube.com/watch?v=RubBzkZzpUA' },
          { title: 'Hold On, We\'re Going Home', url: 'https://www.youtube.com/watch?v=2a4UxdyvjWY' }
        ]
      }
    ]

    return {
      festivalName,
      festivalDate,
      artists: fallbackArtists,
      totalSongs: fallbackArtists.reduce((total, artist) => total + artist.songs.length, 0),
      estimatedDuration: `${Math.round(fallbackArtists.reduce((total, artist) => total + artist.songs.length, 0) * 3.5)} minutes`
    }
  }
} 