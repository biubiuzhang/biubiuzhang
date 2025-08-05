import { PlaylistData, Artist, Song } from '../types'

// 100% Real Data Service - No mock data fallbacks
export class RealDataService {
  // API endpoints
  private static readonly SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  private static readonly SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
  private static readonly YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  private static readonly LASTFM_API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY

  static async searchFestival(festivalName: string, festivalDate: string): Promise<PlaylistData | null> {
    try {
      console.log('Searching for real festival data:', festivalName, festivalDate)
      let festivalData = await this.getRealFestivalLineup(festivalName, festivalDate)
      if (!festivalData || !festivalData.artists || festivalData.artists.length === 0) {
        // Fallback: try without the date
        console.log('No artists found for date, trying general festival search')
        festivalData = await this.getRealFestivalLineup(festivalName, undefined)
      }
      if (!festivalData || !festivalData.artists || festivalData.artists.length === 0) {
        console.log('No real festival data found')
        return null
      }
      // Filter out single-letter/invalid artist names
      festivalData.artists = festivalData.artists.filter(a => a.name && a.name.length > 1 && /[a-zA-Z]/.test(a.name) && a.name !== a.name.toUpperCase())
      // Get real song data for each artist (no limits)
      const artistsWithSongs = await Promise.all(
        festivalData.artists.map(async (artist) => {
          const songs = await this.getRealArtistSongs(artist.name)
          return {
            ...artist,
            songs: songs // No limit - get all available songs
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
      return null
    }
  }

  // Get real festival lineup from multiple sources
  private static async getRealFestivalLineup(festivalName: string, festivalDate: string | undefined) {
    const sources = [
      this.searchLastFmEvents(festivalName, festivalDate),
      this.searchMusicBrainzArtists(festivalName),
      this.searchSpotifyFestivalArtists(festivalName),
      this.searchWikipediaFestival(festivalName),
      this.searchFestivalWebsites(festivalName)
    ]

    // Try all sources and combine results
    const results = await Promise.allSettled(sources)
    const allArtists: Artist[] = []
    const seenArtists = new Set<string>()

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value && result.value.artists.length > 0) {
        for (const artist of result.value.artists) {
          if (!seenArtists.has(artist.name.toLowerCase())) {
            allArtists.push(artist)
            seenArtists.add(artist.name.toLowerCase())
          }
        }
      }
    }

    return {
      name: festivalName,
      artists: allArtists
    }
  }

  // Search Last.fm for real events
  private static async searchLastFmEvents(festivalName: string, festivalDate: string | undefined) {
    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=geo.getevents&location=${encodeURIComponent(festivalName)}&date=${festivalDate || ''}&api_key=${this.LASTFM_API_KEY || 'demo'}&format=json`
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
          artists
        }
      }
    } catch (error) {
      console.error('Last.fm API error:', error)
    }
    
    return null
  }

  // Search MusicBrainz for real artists
  private static async searchMusicBrainzArtists(festivalName: string) {
    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(festivalName)}&fmt=json&limit=50`
      )
      
      const data = await response.json()
      
      if (data.artists && data.artists.length > 0) {
        const artists = data.artists
          .filter((artist: any) => artist.type === 'Person' || artist.type === 'Group')
          .map((artist: any) => ({
            name: artist.name,
            image: null
          }))

        return {
          name: festivalName,
          artists
        }
      }
    } catch (error) {
      console.error('MusicBrainz API error:', error)
    }
    
    return null
  }

  // Search Spotify for festival-related artists
  private static async searchSpotifyFestivalArtists(festivalName: string) {
    if (!this.SPOTIFY_CLIENT_ID || !this.SPOTIFY_CLIENT_SECRET) return null

    try {
      const token = await this.getSpotifyToken()
      
      // Search for artists related to the festival
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(festivalName)}&type=artist&limit=50`,
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
          artists
        }
      }
    } catch (error) {
      console.error('Spotify API error:', error)
    }
    
    return null
  }

  // Search Wikipedia for festival information
  private static async searchWikipediaFestival(festivalName: string) {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(festivalName)}`
      )
      
      const data = await response.json()
      
      if (data.extract) {
        const extract = data.extract.toLowerCase()
        const potentialArtists = this.extractArtistNamesFromText(extract)
        
        return {
          name: festivalName,
          artists: potentialArtists
        }
      }
    } catch (error) {
      console.error('Wikipedia API error:', error)
    }
    
    return null
  }

  // Search festival websites and public databases
  private static async searchFestivalWebsites(festivalName: string) {
    try {
      // Search for festival lineup information from public sources
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(festivalName + ' festival lineup')}&sort=stars&order=desc&per_page=10`
      )
      
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        // Extract potential artist names from repository descriptions
        const potentialArtists = data.items
          .map((item: any) => item.description || '')
          .filter((desc: string) => desc.toLowerCase().includes('artist') || desc.toLowerCase().includes('lineup'))
          .slice(0, 10)
          .map((desc: string) => ({
            name: desc.split(' ')[0],
            image: null
          }))

        return {
          name: festivalName,
          artists: potentialArtists
        }
      }
    } catch (error) {
      console.error('Festival websites search error:', error)
    }
    
    return null
  }

  // Get real artist songs from multiple sources
  private static async getRealArtistSongs(artistName: string): Promise<Song[]> {
    const sources = [
      this.getSpotifyArtistSongs(artistName),
      this.getLastFmArtistSongs(artistName),
      this.getMusicBrainzArtistSongs(artistName),
      this.getYouTubeArtistSongs(artistName)
    ]

    const results = await Promise.allSettled(sources)
    const allSongs: Song[] = []
    const seenSongs = new Set<string>()

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        for (const song of result.value) {
          const songKey = `${song.title.toLowerCase()}-${artistName.toLowerCase()}`
          if (!seenSongs.has(songKey)) {
            allSongs.push(song)
            seenSongs.add(songKey)
          }
        }
      }
    }

    return allSongs
  }

  // Get songs from Spotify
  private static async getSpotifyArtistSongs(artistName: string): Promise<Song[]> {
    if (!this.SPOTIFY_CLIENT_ID || !this.SPOTIFY_CLIENT_SECRET) return []

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
      
      if (!artist) return []

      // Get artist's top tracks (no limit)
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const tracksData = await tracksResponse.json()
      
      // Get artist's albums for more songs
      const albumsResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/albums?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const albumsData = await albumsResponse.json()
      
      const songs: Song[] = []
      
      // Add top tracks
      if (tracksData.tracks) {
        for (const track of tracksData.tracks) {
          const youtubeUrl = await this.getYouTubeMusicLink(artistName, track.name)
          songs.push({
            title: track.name,
            url: youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${track.name}`)}`,
            platform: 'youtube'
          })
        }
      }

      // Add album tracks
      for (const album of albumsData.items || []) {
        const albumTracksResponse = await fetch(
          `https://api.spotify.com/v1/albums/${album.id}/tracks`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        const albumTracksData = await albumTracksResponse.json()
        
        for (const track of albumTracksData.items || []) {
          const youtubeUrl = await this.getYouTubeMusicLink(artistName, track.name)
          songs.push({
            title: track.name,
            url: youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${track.name}`)}`,
            platform: 'youtube'
          })
        }
      }

      return songs
      
    } catch (error) {
      console.error('Spotify API error:', error)
      return []
    }
  }

  // Get songs from Last.fm
  private static async getLastFmArtistSongs(artistName: string): Promise<Song[]> {
    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&format=json&limit=50`
      )
      
      const data = await response.json()
      
      if (data.toptracks?.track) {
        const tracks = Array.isArray(data.toptracks.track) ? data.toptracks.track : [data.toptracks.track]
        
        const songs = await Promise.all(
          tracks.map(async (track: any) => {
            const youtubeUrl = await this.getYouTubeMusicLink(artistName, track.name)
            return {
              title: track.name,
              url: youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${track.name}`)}`,
              platform: 'youtube'
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

  // Get songs from MusicBrainz
  private static async getMusicBrainzArtistSongs(artistName: string): Promise<Song[]> {
    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=artist:${encodeURIComponent(artistName)}&fmt=json&limit=50`
      )
      
      const data = await response.json()
      
      if (data.recordings && data.recordings.length > 0) {
        const songs = await Promise.all(
          data.recordings.map(async (recording: any) => {
            const youtubeUrl = await this.getYouTubeMusicLink(artistName, recording.title)
            return {
              title: recording.title,
              url: youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${recording.title}`)}`,
              platform: 'youtube'
            }
          })
        )

        return songs
      }
    } catch (error) {
      console.error('MusicBrainz songs error:', error)
    }
    
    return []
  }

  // Get songs from YouTube
  private static async getYouTubeArtistSongs(artistName: string): Promise<Song[]> {
    if (!this.YOUTUBE_API_KEY) return []

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(`${artistName} official music`)}&type=video&key=${this.YOUTUBE_API_KEY}&maxResults=50`
      )
      
      const data = await response.json()
      
      if (data.items) {
        return data.items.map((item: any) => ({
          title: item.snippet.title.replace(/official|music|video/gi, '').trim(),
          url: `https://music.youtube.com/watch?v=${item.id.videoId}`,
          platform: 'youtube'
        }))
      }
    } catch (error) {
      console.error('YouTube API error:', error)
    }
    
    return []
  }

  // Get YouTube Music link for a song
  private static async getYouTubeMusicLink(artistName: string, songTitle: string): Promise<string | null> {
    try {
      // Try to get YouTube link even without API key by constructing search URL
      const searchQuery = encodeURIComponent(`${artistName} ${songTitle} official`)
      return `https://www.youtube.com/results?search_query=${searchQuery}`
    } catch (error) {
      console.error('YouTube link generation error:', error)
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

  // Extract artist names from text
  private static extractArtistNamesFromText(text: string): Artist[] {
    const artistKeywords = ['performing', 'headlining', 'featuring', 'lineup', 'artists', 'band', 'singer']
    const words = text.split(' ')
    const potentialArtists: string[] = []
    
    for (let i = 0; i < words.length; i++) {
      if (artistKeywords.some(keyword => words[i].includes(keyword))) {
        // Look for capitalized words that might be artist names
        for (let j = i + 1; j < Math.min(i + 10, words.length); j++) {
          if (words[j][0] === words[j][0]?.toUpperCase() && words[j].length > 2) {
            potentialArtists.push(words[j])
          }
        }
      }
    }
    
    return potentialArtists.map(name => ({
      name,
      image: null
    }))
  }
} 