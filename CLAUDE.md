# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in chat, and the AI generates React code that renders in real-time within a virtual file system.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development
npm run dev           # Start dev server with Turbopack at localhost:3000

# Build & Run
npm run build
npm start

# Testing
npm test              # Run Vitest tests
npm test -- path/to/file.test.ts  # Run single test file

# Linting
npm run lint

# Database
npm run db:reset      # Reset database with fresh migrations
```

## Architecture

### Core Data Flow

1. **Chat API** (`src/app/api/chat/route.ts`) - Receives user messages, invokes Claude with AI SDK, streams responses with tool calls
2. **Virtual File System** (`src/lib/file-system.ts`) - In-memory file system that stores generated components; no files written to disk
3. **AI Tools** - Two tools the AI uses to manipulate the virtual FS:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) - Create, view, and edit files
   - `file_manager` (`src/lib/tools/file-manager.ts`) - Rename and delete files
4. **Preview Frame** (`src/components/preview/PreviewFrame.tsx`) - Transforms JSX via Babel, creates import maps with blob URLs, renders in sandboxed iframe
5. **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) - Compiles JSX/TSX to JS, handles imports via esm.sh for third-party packages

### Context Providers

- `FileSystemProvider` - Manages virtual file system state, handles tool call side effects on client
- `ChatProvider` - Manages chat messages and AI streaming via Vercel AI SDK's `useChat`

### Key Conventions

- Entry point for generated apps is always `/App.jsx`
- Generated files use `@/` import alias mapping to virtual root `/`
- Third-party packages resolved via `https://esm.sh/{package}`
- Prisma client output is in `src/generated/prisma` (not node_modules)
- SQLite database at `prisma/dev.db`

### Authentication

- JWT-based sessions stored in cookies (`src/lib/auth.ts`)
- Anonymous users can use the app; projects persist only for authenticated users
- Password hashing via bcrypt

### Tech Stack

- Next.js 15 with App Router and Turbopack
- React 19
- Tailwind CSS v4
- Prisma with SQLite
- Vercel AI SDK with Anthropic Claude
- Monaco Editor for code editing
- Vitest + React Testing Library for tests
- Use comments sparingly. Only comment complex code.
- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need understand the structure of data stored in the database
- vitest config is in vitest.config.mts