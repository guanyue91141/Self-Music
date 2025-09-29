# GEMINI.md

## Project Overview

This is a modern, feature-rich music streaming web application built with Next.js and TypeScript. It's designed as a Progressive Web App (PWA) for a seamless, native-like experience on both desktop and mobile devices. The application features a sophisticated player interface with lyrics support, playlist management, and a themeable, responsive UI.

**Key Technologies:**

*   **Framework:** Next.js (with Turbopack)
*   **Language:** TypeScript
*   **UI:** React, Tailwind CSS, Radix UI, Framer Motion
*   **State Management:** Zustand
*   **Linting:** ESLint

**Architecture:**

*   The application follows a standard Next.js project structure with the App Router.
*   The core of the application is the music player, located in `src/app/play`.
*   The player state is managed globally using a Zustand store (`src/lib/store.ts`).
*   The UI is built with a combination of custom components and Radix UI primitives, styled with Tailwind CSS.
*   The application is designed to be a PWA, with a service worker and manifest for offline capabilities and installation.

## Building and Running

*   **Development:** `pnpm dev` or `pnpm dev:turbo`
*   **Build:** `pnpm build`
*   **Start:** `pnpm start`
*   **Lint:** `pnpm lint`

## Development Conventions

*   The project uses ESLint for code linting.
*   The project uses a custom theme provider for light/dark mode support.
*   The project uses a global audio manager to handle playback.
*   The project uses a PWA provider to manage the service worker.
*   The project uses a custom lyrics parser to display synchronized lyrics.
