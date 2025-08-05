import { PlaylistData, Artist, Song } from '../types'

// Mock festival database - in a real app, this would come from APIs
const FESTIVAL_DATABASE = {
  'coachella': {
    name: 'Coachella Valley Music and Arts Festival',
    dates: ['2024-04-12', '2024-04-19'],
    artists: {
      '2024-04-12': [
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
      ],
      '2024-04-19': [
        {
          name: 'The Weeknd',
          image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c2eae06e8',
          songs: [
            { title: 'Blinding Lights', url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ' },
            { title: 'Starboy', url: 'https://www.youtube.com/watch?v=34Na4j8AVgA' },
            { title: 'The Hills', url: 'https://www.youtube.com/watch?v=0KSOMA3QBU0' },
            { title: 'Can\'t Feel My Face', url: 'https://www.youtube.com/watch?v=KEI4qSrkPAs' },
            { title: 'Die For You', url: 'https://www.youtube.com/watch?v=0CQd9XcbS7U' }
          ]
        },
        {
          name: 'Post Malone',
          image: 'https://i.scdn.co/image/ab6761610000e5eb6be070d4d57a1e0c6c6e3b1a',
          songs: [
            { title: 'Rockstar', url: 'https://www.youtube.com/watch?v=UceaB4D0jPI' },
            { title: 'Circles', url: 'https://www.youtube.com/watch?v=wXhTHyIgQ_U' },
            { title: 'Sunflower', url: 'https://www.youtube.com/watch?v=ApXoWvfEYVU' },
            { title: 'Better Now', url: 'https://www.youtube.com/watch?v=UYwF-jdcVjY' },
            { title: 'Congratulations', url: 'https://www.youtube.com/watch?v=SC4xMk98Pdc' }
          ]
        }
      ]
    }
  },
  'tomorrowland': {
    name: 'Tomorrowland',
    dates: ['2024-07-19', '2024-07-21'],
    artists: {
      '2024-07-19': [
        {
          name: 'Martin Garrix',
          image: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3133a15fbb0',
          songs: [
            { title: 'Animals', url: 'https://www.youtube.com/watch?v=gCYcHz2k5x0' },
            { title: 'In the Name of Love', url: 'https://www.youtube.com/watch?v=RnBT9uUYb1w' },
            { title: 'Scared to Be Lonely', url: 'https://www.youtube.com/watch?v=2CQZ6DtNldw' },
            { title: 'There for You', url: 'https://www.youtube.com/watch?v=kTJczUoc26U' },
            { title: 'Ocean', url: 'https://www.youtube.com/watch?v=BDocp-VpM4Y' }
          ]
        },
        {
          name: 'David Guetta',
          image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
          songs: [
            { title: 'Titanium', url: 'https://www.youtube.com/watch?v=JRfuAukYTKg' },
            { title: 'Turn Me On', url: 'https://www.youtube.com/watch?v=QzcvRDWgRIE' },
            { title: 'Hey Mama', url: 'https://www.youtube.com/watch?v=HOQ-4jE1j48' },
            { title: '2U', url: 'https://www.youtube.com/watch?v=2vjPBrBU-TM' },
            { title: 'Flames', url: 'https://www.youtube.com/watch?v=9vJRopau0g0' }
          ]
        }
      ]
    }
  }
}

export class FestivalService {
  static async searchFestival(festivalName: string, festivalDate: string): Promise<PlaylistData | null> {
    // Normalize festival name for search
    const normalizedName = festivalName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Find festival in database
    const festival = FESTIVAL_DATABASE[normalizedName as keyof typeof FESTIVAL_DATABASE]
    
    if (!festival) {
      // If festival not found, return mock data for demonstration
      return this.generateMockPlaylist(festivalName, festivalDate)
    }

    const artists = festival.artists[festivalDate] || []
    
    return {
      festivalName: festival.name,
      festivalDate,
      artists,
      totalSongs: artists.reduce((total, artist) => total + artist.songs.length, 0),
      estimatedDuration: `${Math.round(artists.reduce((total, artist) => total + artist.songs.length, 0) * 3.5)} minutes`
    }
  }

  private static generateMockPlaylist(festivalName: string, festivalDate: string): PlaylistData {
    const mockArtists = [
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
      },
      {
        name: 'The Weeknd',
        image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c2eae06e8',
        songs: [
          { title: 'Blinding Lights', url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ' },
          { title: 'Starboy', url: 'https://www.youtube.com/watch?v=34Na4j8AVgA' },
          { title: 'The Hills', url: 'https://www.youtube.com/watch?v=0KSOMA3QBU0' },
          { title: 'Can\'t Feel My Face', url: 'https://www.youtube.com/watch?v=KEI4qSrkPAs' },
          { title: 'Die For You', url: 'https://www.youtube.com/watch?v=0CQd9XcbS7U' }
        ]
      }
    ]

    return {
      festivalName,
      festivalDate,
      artists: mockArtists,
      totalSongs: mockArtists.reduce((total, artist) => total + artist.songs.length, 0),
      estimatedDuration: `${Math.round(mockArtists.reduce((total, artist) => total + artist.songs.length, 0) * 3.5)} minutes`
    }
  }

  static async searchArtistSongs(artistName: string): Promise<Song[]> {
    // In a real implementation, this would call music APIs like Spotify, YouTube, etc.
    // For now, return mock data
    const mockSongs: { [key: string]: Song[] } = {
      'taylor swift': [
        { title: 'Cruel Summer', url: 'https://www.youtube.com/watch?v=ic8j13piAhQ' },
        { title: 'Anti-Hero', url: 'https://www.youtube.com/watch?v=b1kbLWxZqNk' },
        { title: 'Blank Space', url: 'https://www.youtube.com/watch?v=e-ORhEE9VVg' },
        { title: 'Shake It Off', url: 'https://www.youtube.com/watch?v=nfWlot6h_JM' },
        { title: 'Love Story', url: 'https://www.youtube.com/watch?v=8xg3vE8Ie_E' }
      ],
      'drake': [
        { title: 'God\'s Plan', url: 'https://www.youtube.com/watch?v=xpVfcZRZ0gw' },
        { title: 'One Dance', url: 'https://www.youtube.com/watch?v=WizkXKfw73g' },
        { title: 'Hotline Bling', url: 'https://www.youtube.com/watch?v=uxpDa-c-4Mc' },
        { title: 'Started From the Bottom', url: 'https://www.youtube.com/watch?v=RubBzkZzpUA' },
        { title: 'Hold On, We\'re Going Home', url: 'https://www.youtube.com/watch?v=2a4UxdyvjWY' }
      ]
    }

    const normalizedName = artistName.toLowerCase()
    return mockSongs[normalizedName] || []
  }
} 