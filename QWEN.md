# Self-Music Project - QWEN.md

## Project Overview

Self-Music is a modern music streaming platform that consists of a FastAPI backend and a Next.js frontend. It provides a complete music management system with features like playlist management, lyrics synchronization, mood-based tags, and a responsive music player interface.

### Key Features
- **Music Player**: Full-featured music player with play/pause, next/previous, volume control, and progress tracking
- **Lyrics Synchronization**: Real-time lyrics display with LRC format support
- **Mood-based Classification**: Music organized by mood tags
- **Artist and Album Management**: Full CRUD for artists, albums, and songs
- **Playlist System**: Ability to create, edit, and manage playlists
- **Responsive Design**: Works on both desktop and mobile devices
- **User Authentication**: JWT-based authentication for admin features
- **File Upload**: Audio file upload functionality
- **Search**: Search across songs, artists, albums, and playlists
- **Default Demo Content**: Includes sample song data and lyrics for demonstration purposes

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.8+
- **Database**: SQLite with raw SQL
- **Authentication**: JWT-based authentication
- **File Serving**: Static files for audio and images
- **Audio Streaming**: Built-in audio streaming functionality
- **Models**: Artists, Albums, Songs, Moods, Playlists with relationships

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **UI Components**: ShadCN/UI components with Tailwind CSS
- **State Management**: Zustand for global state management
- **Audio Playback**: HTML5 Audio API
- **Animation**: Framer Motion for UI animations
- **API Client**: Custom API client with caching capabilities

## Project Structure

```
Self-Music/
├── backend/
│   ├── main.py              # Main application with admin routes
│   ├── user.py              # Public user-facing API routes
│   ├── requirements.txt     # Python dependencies
│   ├── config.yaml          # Configuration file
│   ├── music.db             # SQLite database
│   └── Dockerfile           # Container configuration
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js 13+ App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities, store, API client
│   │   ├── styles/          # CSS and styling
│   │   └── types/           # TypeScript definitions
│   ├── package.json         # Node.js dependencies
│   ├── next.config.ts       # Next.js configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
├── uploads/                 # Uploaded audio files
└── static/                  # Static assets
```

## Technology Stack

### Backend
- **FastAPI**: Web framework for API endpoints
- **SQLite**: Database for storing music metadata
- **SQLAlchemy**: ORM for database operations (raw SQL used)
- **PyJWT**: JSON Web Token implementation for authentication
- **Mutagen**: Audio metadata extraction
- **PyYAML**: YAML parsing for configuration

### Frontend
- **Next.js 15**: React-based framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management solution
- **Framer Motion**: Animation library
- **React Query**: Client-side data fetching and caching
- **Lucide React**: Icon library

## API Endpoints

### Public (no authentication required)
- `GET /api/songs` - Get paginated list of songs
- `GET /api/songs/{id}` - Get song details
- `GET /api/songs/{id}/stream` - Stream audio file
- `GET /api/songs/{id}/lyrics` - Get song lyrics
- `GET /api/artists` - Get artists list
- `GET /api/artists/{id}` - Get artist details
- `GET /api/artists/{id}/songs` - Get songs by artist
- `GET /api/artists/{id}/albums` - Get albums by artist
- `GET /api/albums` - Get albums list
- `GET /api/albums/{id}` - Get album details
- `GET /api/albums/{id}/songs` - Get songs in album
- `GET /api/playlists` - Get public playlists
- `GET /api/playlists/{id}` - Get playlist details
- `GET /api/moods` - Get mood tags
- `GET /api/moods/{id}/songs` - Get songs by mood
- `GET /api/search?q={query}` - Search across all content
- `GET /api/recommendations` - Get recommended songs

### Admin (JWT authentication required)
- `POST /api/auth/login` - Authenticate admin user
- `GET/POST/PUT/DELETE /api/admin/artists` - Artist management
- `GET/POST/PUT/DELETE /api/admin/albums` - Album management
- `GET/POST/PUT/DELETE /api/admin/songs` - Song management
- `GET/POST/PUT/DELETE /api/admin/moods` - Mood tag management
- `GET/POST/PUT/DELETE /api/admin/playlists` - Playlist management
- `PUT /api/admin/playlists/{id}/reorder` - Reorder playlist songs
- `POST /api/admin/upload` - Upload audio files
- `POST /api/admin/import/batch` - Batch import music data

## Building and Running

### Backend
1. **Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run Development Server**:
   ```bash
   python main.py
   # or with uvicorn
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Database**: SQLite database is created automatically on first run

### Frontend
1. **Setup**:
   ```bash
   cd frontend
   pnpm install  # or npm install
   ```

2. **Run Development Server**:
   ```bash
   pnpm dev  # or npm run dev
   # Runs on http://localhost:3000
   ```

3. **Build for Production**:
   ```bash
   pnpm build  # or npm run build
   ```

## Development Notes

### Frontend Configuration
- The frontend expects the backend to be running on `http://localhost:8000`
- API calls are proxied from the frontend to the backend
- The API base URL is configured in `frontend/src/lib/base_url_config.ts`
- Image optimization is configured in `frontend/next.config.ts` to allow images from music services like NetEase Cloud Music (p1.music.126.net, etc.)

### Backend Configuration
- Default admin credentials can be set in `config.yaml`
- Default username is 'xbxb' with default password 'xbxbxb'
- The configuration file has the structure:
  ```yaml
  jwt_secret: "your-secret-key-change-this-in-production"
  admin:
    username: "your-username"
    password: "your-password"
  ```

### Key Features Implementation Details
- **Multi-artist Support**: Both songs and albums can have multiple artists through association tables
- **Lyrics Synchronization**: LRC format parsing for time-synchronized lyrics
- **Caching**: Frontend implements IndexedDB caching for audio and image files
- **Playlist Management**: Client-side playlist management with shuffle and repeat options, stored in localStorage
- **Playlist History**: Maintains history of recently played playlists in localStorage
- **Mood Tagging**: Mood-based organization with color and icon support
- **Responsive UI**: Different layouts for mobile and desktop with appropriate components

## Deployment

### Docker Deployment Options
The project includes a supervisord.conf file in the root directory which shows how the backend, frontend, and nginx are managed together in a containerized setup:

```ini
[supervisord]
nodaemon=true

[program:backend]
command=uvicorn main:app --host 0.0.0.0 --port 8000
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/data/logs/backend.log
stdout_logfile_maxbytes=1MB
stderr_logfile=/data/logs/backend.err
stderr_logfile_maxbytes=1MB

[program:frontend]
command=node server.js
directory=/app/frontend
autostart=true
autorestart=true
stdout_logfile=/data/logs/frontend.log
stdout_logfile_maxbytes=1MB
stderr_logfile=/data/logs/frontend.err
stderr_logfile_maxbytes=1MB
environment=PORT=3000,HOSTNAME=0.0.0.0

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/data/logs/nginx.log
stdout_logfile_maxbytes=1MB
stderr_logfile=/data/logs/nginx.err
stderr_logfile_maxbytes=1MB
```

### Manual Docker Deployment
```bash
# Backend
cd backend
docker build -t self-music-backend .
docker run -d -p 8000:8000 --name self-music-backend self-music-backend

# Frontend
cd frontend
docker build -t self-music-frontend .
docker run -d -p 3000:3000 --name self-music-frontend self-music-frontend
```

Note: A docker-compose.yml file would need to be created separately to orchestrate the multi-container setup based on the supervisord.conf configuration.

### Direct Hosting
- Backend: Needs Python 3.8+ with dependencies and SQLite support
- Frontend: Build the Next.js app and serve with any static file server
- Ensure CORS is configured appropriately for cross-origin requests

## Default Credentials
- Admin username: `xbxb`
- Admin password: `xbxbxb`
- Default credentials can be changed in `backend/config.yaml`