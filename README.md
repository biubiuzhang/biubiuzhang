# Festival Playlist Tool 🎵

A modern web application that helps you discover artists performing at music festivals and creates personalized playlists with their most popular songs. Perfect for preparing for your next music festival experience!

## Features ✨

- **Festival Search**: Enter any music festival name and date to discover the lineup
- **Artist Discovery**: View artists performing on specific dates with their photos
- **Song Recommendations**: Get the most likely songs each artist will perform
- **Multi-Platform Export**: Export playlists to YouTube Music, Spotify, or YouTube
- **Easy Sharing**: Share playlists with friends or export as text files
- **Beautiful UI**: Modern, responsive design with smooth animations

## How It Works 🎯

1. **Enter Festival Details**: Input the festival name and date you're attending
2. **Discover Artists**: View the lineup of artists performing on that specific date
3. **Explore Songs**: See the most popular songs each artist is likely to perform
4. **Create Playlist**: Generate playlists for your preferred music platform
5. **Export & Share**: Download playlists or share them with friends

## Supported Platforms 🎧

- **YouTube Music**: Direct playlist creation
- **Spotify**: Export to Spotify playlists
- **YouTube**: Create YouTube playlists
- **Text Export**: Download as text file for manual playlist creation

## Getting Started 🚀

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd festival-playlist-tool
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage Examples 📝

### Example 1: Coachella 2024
- Festival: Coachella
- Date: 2024-04-12
- Result: Taylor Swift, Drake, and other artists with their top songs

### Example 2: Tomorrowland 2024
- Festival: Tomorrowland  
- Date: 2024-07-19
- Result: Martin Garrix, David Guetta, and EDM artists with their hits

## Technology Stack 🛠

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Deployment**: Vercel-ready

## Project Structure 📁

```
festival-playlist-tool/
├── app/
│   ├── components/
│   │   ├── FestivalForm.tsx      # Festival search form
│   │   └── PlaylistDisplay.tsx   # Playlist results display
│   ├── services/
│   │   └── festivalService.ts    # Festival data and API logic
│   ├── types.ts                  # TypeScript type definitions
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # Tailwind configuration
├── next.config.js               # Next.js configuration
└── README.md                    # This file
```

## API Integration 🔌

The tool now uses **real APIs** to fetch festival data:

### Current Free APIs Used:
- **MusicBrainz API**: For artist and song data (free, no key required)
- **Last.fm Public API**: For artist top tracks (free, limited)
- **Wikipedia API**: For festival information (free, no key required)
- **YouTube Search**: Direct search URLs for music videos

### Enhanced APIs (Optional):
For even better data, you can add API keys to `.env.local`:

```bash
# Spotify API (for better artist data and top tracks)
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# YouTube Data API (for direct video links)
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key

# Last.fm API (for better artist data)
NEXT_PUBLIC_LASTFM_API_KEY=your_lastfm_api_key
```

### How to Get API Keys:

1. **Spotify API**: 
   - Go to https://developer.spotify.com/dashboard
   - Create a new app
   - Get Client ID and Client Secret

2. **YouTube Data API**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a new project
   - Enable YouTube Data API v3
   - Create API key

3. **Last.fm API**:
   - Go to https://www.last.fm/api/account/create
   - Create an account and get API key

The tool works without API keys but provides enhanced data with them!

## Customization 🎨

### Adding New Festivals

Edit `app/services/festivalService.ts` to add new festivals to the database:

```typescript
const FESTIVAL_DATABASE = {
  'your-festival': {
    name: 'Your Festival Name',
    dates: ['2024-06-15', '2024-06-16'],
    artists: {
      '2024-06-15': [
        {
          name: 'Artist Name',
          image: 'artist-image-url',
          songs: [
            { title: 'Song Title', url: 'youtube-url' }
          ]
        }
      ]
    }
  }
}
```

### Styling Customization

Modify `tailwind.config.js` to customize colors and themes:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom color palette
      }
    }
  }
}
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements 🚀

- [ ] Real-time festival lineup data
- [ ] Spotify API integration
- [ ] YouTube Data API integration
- [ ] User accounts and saved playlists
- [ ] Mobile app version
- [ ] Social sharing features
- [ ] Festival recommendations
- [ ] Artist set times and stage information

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

**Happy Festival Season! 🎉🎵** 