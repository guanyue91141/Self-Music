# Self-Music Frontend - QWEN.md

## Project Overview

Self-Music is a modern music streaming platform frontend built with Next.js 15 and TypeScript. The project focuses on providing an elegant music playback experience with features like real-time lyrics synchronization, glassmorphism effects, mood-based tags, and playlist functionality. The frontend communicates with a FastAPI backend (located in a separate backend directory) to manage music content, user data, and playback.

### Key Technologies

- **Framework**: Next.js 15 with TypeScript
- **UI Components**: ShadCN/UI + Tailwind CSS
- **Animation**: Framer Motion
- **Audio Playback**: HTML5 Audio API
- **State Management**: Zustand
- **Styling**: Tailwind CSS with glassmorphism effects using `backdrop-filter`
- **Build Tool**: pnpm
- **Component Library**: Lucide React icons

### Project Architecture

```
self-music/
├── backend/                 # FastAPI backend (separate repository)
├── frontend/               # Next.js frontend (current directory)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utility functions and hooks
│   │   ├── styles/         # CSS and styling utilities
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── uploads/                # Audio files storage
└── static/                 # Static resources (album art, etc.)
```

### Core Features

1. **Music Player** - Core playback interface with controls, progress bar, and volume adjustment
2. **Lyrics Synchronization** - LRC format lyrics parsing, real-time scrolling display
3. **Glassmorphism Effect** - Dynamic glassmorphism based on album cover colors
4. **Mood Tags** - Multi-dimensional music classification based on mood
5. **Playlist Management** - Support for creating, editing playlists, songs can be added repeatedly
6. **File Upload** - Support for uploading audio files and metadata extraction

### API Interface Design

The frontend communicates with the backend API:

#### Song Management
- `GET /api/songs` - Retrieve song list
- `POST /api/songs/upload` - Upload audio files
- `GET /api/songs/{id}/stream` - Stream audio
- `GET /api/songs/{id}` - Retrieve song details

#### Playlist Management
- `GET /api/playlists` - Retrieve playlist list
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/{id}` - Update playlist
- `DELETE /api/playlists/{id}` - Delete playlist

#### Mood Tags
- `GET /api/moods` - Retrieve mood tags list
- `GET /api/moods/{mood}/songs` - Get songs for specific mood

#### Lyrics Service
- `GET /api/lyrics/{song_id}` - Retrieve song lyrics

## Building and Running

### Development Setup

1. **Install Dependencies**:
```bash
cd frontend
pnpm install
```

2. **Start Development Server**:
```bash
# Standard development server
pnpm run dev

# Or with Turbopack for faster builds
pnpm run dev:turbo
```

3. **Build Production Version**:
```bash
pnpm run build
```

4. **Start Production Server**:
```bash
pnpm run start
```

5. **Lint Code**:
```bash
pnpm run lint
```

6. **Type Check**:
```bash
pnpm run build
```

### Deployment

The application is configured for standalone deployment with Next.js:
```bash
pnpm run build
pnpm run start
```

## Development Conventions

### Code Structure
- Components are organized using Next.js App Router
- Path aliases are configured: `@/*` maps to `./src/*`
- UI components are in `@/components/ui`
- Utility functions are in `@/lib/utils`
- TypeScript types are defined in `@/types`

### Styling
- Tailwind CSS for styling with CSS variables
- ShadCN/UI components for consistent UI
- Glassmorphism effects using backdrop-filter
- Responsive design for desktop and mobile

### State Management
- Zustand for global state management
- React hooks for local component state
- Context API where appropriate for shared data

### Component Architecture
- Reusable UI components in `@/components/ui`
- Feature-specific components in their respective directories
- Atomic design principles for component organization
- TypeScript interfaces for all component props

## Special Configuration

### Next.js Configuration
- Standalone output mode for production builds
- Cross-origin requests allowed for development
- Webpack configuration optimized for hot reloading
- PWA support with service worker configuration
- Turbopack configured for development (with SVG loader)

### TypeScript Configuration
- Strict type checking enabled
- Path aliasing for cleaner imports
- Next.js plugin for enhanced type checking
- ES2017 target for modern browser support

## Project Characteristics

1. **Playback-Centric** - Landing page immediately shows playback interface, rather than traditional album view
2. **Visual Experience Priority** - Glassmorphism effect, animations, color coordination
3. **Emotional Interaction** - Connect music with emotions through mood tags
4. **Modern Tech Stack** - Built with latest web technologies

## Development Status

Based on the project structure and configuration:
- [x] Project basic structure setup
- [x] Next.js frontend framework setup
- [ ] Music player component development
- [ ] Glassmorphism UI effects implementation
- [ ] Lyrics synchronization functionality
- [ ] Mood tags and playlist system