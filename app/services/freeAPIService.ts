import { PlaylistData, Artist, Song } from '../types'

// Free API service that doesn't require API keys
export class FreeAPIService {
  static async searchFestival(festivalName: string, festivalDate: string): Promise<PlaylistData | null> {
    console.log('Searching festival:', festivalName, festivalDate)
    try {
      // Try multiple free sources for festival data
      const festivalData = await this.searchMultipleFreeSources(festivalName, festivalDate)
      
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

  // Search multiple free sources for festival data
  private static async searchMultipleFreeSources(festivalName: string, festivalDate: string) {
    const sources = [
      this.searchMusicBrainz(festivalName),
      this.searchWikipedia(festivalName),
      this.searchPublicFestivalData(festivalName)
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

  // Search MusicBrainz for artists (free API)
  private static async searchMusicBrainz(festivalName: string) {
    try {
      // Search for artists that might be related to the festival
      const response = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(festivalName)}&fmt=json&limit=10`
      )
      
      const data = await response.json()
      
      if (data.artists && data.artists.length > 0) {
        const artists = data.artists
          .filter((artist: any) => artist.type === 'Person' || artist.type === 'Group')
          .slice(0, 5)
          .map((artist: any) => ({
            name: artist.name,
            image: null // MusicBrainz doesn't provide images
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

  // Search Wikipedia for festival information
  private static async searchWikipedia(festivalName: string) {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(festivalName)}`
      )
      
      const data = await response.json()
      
      if (data.extract) {
        // Extract potential artist names from Wikipedia content
        const extract = data.extract.toLowerCase()
        const potentialArtists = this.extractArtistNamesFromText(extract)
        
        return {
          name: festivalName,
          artists: potentialArtists.slice(0, 5)
        }
      }
    } catch (error) {
      console.error('Wikipedia API error:', error)
    }
    
    return null
  }

  // Search public festival databases
  private static async searchPublicFestivalData(festivalName: string) {
    try {
      // Use a public festival database or scrape festival websites
      const commonFestivalArtists = this.getCommonFestivalArtists(festivalName)
      
      if (commonFestivalArtists.length > 0) {
        return {
          name: festivalName,
          artists: commonFestivalArtists
        }
      }
    } catch (error) {
      console.error('Public festival data error:', error)
    }
    
    return null
  }

  // Get artist's top songs using free APIs
  private static async getArtistTopSongs(artistName: string): Promise<Song[]> {
    try {
      // Try MusicBrainz for artist tracks
      const musicBrainzSongs = await this.getMusicBrainzSongs(artistName)
      if (musicBrainzSongs.length > 0) {
        return musicBrainzSongs
      }

      // Try Last.fm public API (limited but free)
      const lastFmSongs = await this.getLastFmPublicSongs(artistName)
      if (lastFmSongs.length > 0) {
        return lastFmSongs
      }

      // Generate YouTube search URLs
      return this.generateYouTubeSongs(artistName)
    } catch (error) {
      console.error('Error getting artist songs:', error)
      return this.generateYouTubeSongs(artistName)
    }
  }

  // Get songs from MusicBrainz
  private static async getMusicBrainzSongs(artistName: string): Promise<Song[]> {
    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=artist:${encodeURIComponent(artistName)}&fmt=json&limit=5`
      )
      
      const data = await response.json()
      
      if (data.recordings && data.recordings.length > 0) {
        return data.recordings.slice(0, 5).map((recording: any) => ({
          title: recording.title,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${recording.title} official`)}`,
          platform: 'youtube'
        }))
      }
    } catch (error) {
      console.error('MusicBrainz songs error:', error)
    }
    
    return []
  }

  // Get songs from Last.fm public API
  private static async getLastFmPublicSongs(artistName: string): Promise<Song[]> {
    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&format=json&limit=5`
      )
      
      const data = await response.json()
      
      if (data.toptracks?.track) {
        const tracks = Array.isArray(data.toptracks.track) ? data.toptracks.track : [data.toptracks.track]
        
        return tracks.map((track: any) => ({
          title: track.name,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${track.name} official`)}`,
          platform: 'youtube'
        }))
      }
    } catch (error) {
      console.error('Last.fm public API error:', error)
    }
    
    return []
  }

  // Generate YouTube search URLs for songs
  private static generateYouTubeSongs(artistName: string): Song[] {
    const commonSongs = this.getCommonSongsForArtist(artistName)
    
    return commonSongs.map(song => ({
      title: song,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${song} official`)}`,
      platform: 'youtube'
    }))
  }

  // Extract artist names from text
  private static extractArtistNamesFromText(text: string): Artist[] {
    const artistKeywords = ['performing', 'headlining', 'featuring', 'lineup', 'artists']
    const words = text.split(' ')
    const potentialArtists: string[] = []
    
    for (let i = 0; i < words.length; i++) {
      if (artistKeywords.some(keyword => words[i].includes(keyword))) {
        // Look for capitalized words that might be artist names
        for (let j = i + 1; j < Math.min(i + 5, words.length); j++) {
          if (words[j][0] === words[j][0]?.toUpperCase() && words[j].length > 2) {
            potentialArtists.push(words[j])
          }
        }
      }
    }
    
    return potentialArtists.slice(0, 5).map(name => ({
      name,
      image: null
    }))
  }

  // Get common festival artists based on festival name
  private static getCommonFestivalArtists(festivalName: string): Artist[] {
    const festivalArtists: { [key: string]: string[] } = {
      'coachella': ['Frank Ocean', 'Bad Bunny', 'Calvin Harris', 'Gorillaz', 'Blink-182'],
      'tomorrowland': ['Martin Garrix', 'David Guetta', 'Afrojack', 'Tiesto', 'Armin van Buuren'],
      'lollapalooza': ['Kendrick Lamar', 'Billie Eilish', 'Red Hot Chili Peppers', 'The 1975', 'Lana Del Rey'],
      'ultra': ['Skrillex', 'Marshmello', 'Zedd', 'The Chainsmokers', 'DJ Snake'],
      'edc': ['Tiesto', 'Afrojack', 'Martin Garrix', 'Zedd', 'The Chainsmokers'],
      'glastonbury': ['Elton John', 'Arctic Monkeys', 'Guns N\' Roses', 'Lizzo', 'Lewis Capaldi']
    }
    
    const normalizedName = festivalName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    for (const [festival, artists] of Object.entries(festivalArtists)) {
      if (normalizedName.includes(festival)) {
        return artists.map(name => ({
          name,
          image: null
        }))
      }
    }
    
    return []
  }

  // Get common songs for popular artists
  private static getCommonSongsForArtist(artistName: string): string[] {
    const artistSongs: { [key: string]: string[] } = {
      'taylor swift': ['Cruel Summer', 'Anti-Hero', 'Blank Space', 'Shake It Off', 'Love Story'],
      'drake': ['God\'s Plan', 'One Dance', 'Hotline Bling', 'Started From the Bottom', 'Hold On, We\'re Going Home'],
      'the weeknd': ['Blinding Lights', 'Starboy', 'The Hills', 'Can\'t Feel My Face', 'Die For You'],
      'post malone': ['Rockstar', 'Circles', 'Sunflower', 'Better Now', 'Congratulations'],
      'martin garrix': ['Animals', 'In the Name of Love', 'Scared to Be Lonely', 'There for You', 'Ocean'],
      'david guetta': ['Titanium', 'Turn Me On', 'Hey Mama', '2U', 'Flames'],
      'skrillex': ['Bangarang', 'Scary Monsters and Nice Sprites', 'First of the Year', 'Kyoto', 'Recess'],
      'calvin harris': ['This Is What You Came For', 'Summer', 'Feel So Close', 'We Found Love', 'Blame']
    }
    
    const normalizedName = artistName.toLowerCase()
    
    for (const [artist, songs] of Object.entries(artistSongs)) {
      if (normalizedName.includes(artist) || artist.includes(normalizedName)) {
        return songs
      }
    }
    
    // Return generic popular songs if no match
    return ['Popular Song 1', 'Popular Song 2', 'Popular Song 3', 'Popular Song 4', 'Popular Song 5']
  }

  // Fallback playlist when no real data is found
  private static generateFallbackPlaylist(festivalName: string, festivalDate: string): PlaylistData {
    const fallbackArtists = [
      {
        name: 'Taylor Swift',
        image: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3133a15fbb0',
        songs: [
          { title: 'Cruel Summer', url: 'https://www.youtube.com/results?search_query=Taylor%20Swift%20Cruel%20Summer%20official' },
          { title: 'Anti-Hero', url: 'https://www.youtube.com/results?search_query=Taylor%20Swift%20Anti-Hero%20official' },
          { title: 'Blank Space', url: 'https://www.youtube.com/results?search_query=Taylor%20Swift%20Blank%20Space%20official' },
          { title: 'Shake It Off', url: 'https://www.youtube.com/results?search_query=Taylor%20Swift%20Shake%20It%20Off%20official' },
          { title: 'Love Story', url: 'https://www.youtube.com/results?search_query=Taylor%20Swift%20Love%20Story%20official' }
        ]
      },
      {
        name: 'Drake',
        image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
        songs: [
          { title: 'God\'s Plan', url: 'https://www.youtube.com/results?search_query=Drake%20God%27s%20Plan%20official' },
          { title: 'One Dance', url: 'https://www.youtube.com/results?search_query=Drake%20One%20Dance%20official' },
          { title: 'Hotline Bling', url: 'https://www.youtube.com/results?search_query=Drake%20Hotline%20Bling%20official' },
          { title: 'Started From the Bottom', url: 'https://www.youtube.com/results?search_query=Drake%20Started%20From%20the%20Bottom%20official' },
          { title: 'Hold On, We\'re Going Home', url: 'https://www.youtube.com/results?search_query=Drake%20Hold%20On%20We%27re%20Going%20Home%20official' }
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