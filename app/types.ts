export interface Song {
  title: string
  url: string
  platform?: 'youtube' | 'spotify' | 'apple' | 'youtube-music'
}

export interface Artist {
  name: string
  image: string
  songs: Song[]
  setTime?: string
  stage?: string
}

export interface PlaylistData {
  festivalName: string
  festivalDate: string
  artists: Artist[]
  totalSongs?: number
  estimatedDuration?: string
}

export interface FestivalInfo {
  name: string
  date: string
  location?: string
  website?: string
} 