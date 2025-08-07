# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development (with dev mode)
npm run build:dev

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## High-Level Architecture

This is a React/TypeScript productivity application with multiple domains:
- **Tasks & Projects**: Task management with project organization
- **Reading List**: URL bookmarking with metadata extraction
- **Pipeline**: Investment/deal tracking
- **Prompt Builder**: AI prompt generation and management
- **Calendar**: Microsoft Outlook integration
- **Nonnegotiables**: Habit tracking

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, React Router v6
- **UI**: shadcn/ui (Radix UI), Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Database**: PostgreSQL with typed schemas

### Key Architecture Patterns

**State Management**:
- Context API for global state (Auth, Sidebar)
- TanStack Query for server state caching
- Custom hooks for business logic (e.g., `useTasks`, `useProjects`)

**Data Flow**:
```
Component → Custom Hook → Supabase Client → Database
                ↓
         TanStack Query (caching)
```

**Component Structure**:
```
src/
├── components/
│   ├── auth/        # Authentication UI
│   ├── dashboard/   # Dashboard components
│   ├── layout/      # Navigation, sidebar
│   ├── modals/      # Modal dialogs
│   ├── tasks/       # Task management
│   ├── projects/    # Project management
│   ├── prompts/     # Prompt builder
│   ├── pipeline/    # Pipeline tracking
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── lib/            # Utilities and Supabase client
├── pages/          # Route components
└── types/          # TypeScript types
```

### Database Schema

Core entities with `created_by` relationships to users:
- `tasks`: Task management with categories, priorities, projects
- `projects`: Project organization with context and resources
- `reading_list`: URL bookmarks with metadata
- `prompts`: AI prompts with tags and categories
- `pipeline_companies`: Investment tracking
- `calendar_events`: Microsoft calendar sync
- `nonnegotiables`: Recurring habits

### Supabase Edge Functions

Located in `supabase/functions/`:
- `fetch-link-metadata`: Extract URL metadata
- `microsoft-auth`: Microsoft OAuth flow
- `sync-outlook-calendar`: Calendar synchronization
- `prompt_builder_generate`: AI prompt generation
- `prompt_builder_followups`: Prompt follow-up suggestions

### Development Guidelines

**When adding new features**:
1. Follow the existing hook pattern for data operations
2. Use TypeScript types from `src/integrations/supabase/types.ts`
3. Create components in appropriate domain folders
4. Use shadcn/ui components from `src/components/ui/`
5. Add new routes in `src/App.tsx`

**Authentication**:
- All routes except landing are protected
- Auth state managed via `AuthProvider` context
- Supabase handles JWT tokens automatically

**Styling**:
- Use Tailwind CSS classes
- Follow existing dark theme patterns
- Mobile-responsive by default

**External Integrations**:
- Use Edge Functions for external API calls
- Store sensitive keys in Supabase secrets
- Type all API responses

### Important Notes

- No test suite currently exists
- Development via Lovable platform auto-commits changes
- Path alias configured: `@/*` maps to `src/*`
- Dark theme is default
- Port 8080 for development server