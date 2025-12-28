# Airline Frontend - SkyTrack

A modern, production-ready React 18 application for real-time flight tracking with AI-powered assistance.

## ✨ Features

- **Real-Time Flight Tracking** - Live updates via Server-Sent Events (SSE)
- **AI Chat Assistant** - Natural language queries about flight data with streaming responses
- **Responsive Design** - Beautiful UI with dark/light mode support
- **Type-Safe** - Built with TypeScript for enhanced developer experience
- **Performance Optimized** - React.memo, useMemo, and useCallback throughout
- **Accessible** - WCAG compliant with ARIA labels and keyboard navigation
- **Modern Stack** - React 18, Vite, Tailwind CSS, React Query

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (with type checking) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run preview` | Preview production build locally |

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatPanel/      # AI chat assistant
│   ├── ErrorBoundary/  # Error handling
│   ├── EventTicker/    # Real-time event display
│   ├── FlightDetails/  # Flight detail modal
│   ├── FlightList/     # Flight display components
│   ├── StatusBadge/    # Flight status indicators
│   └── ViewToggle/     # View mode switcher
├── hooks/              # Custom React hooks
│   └── useFlights.ts   # Flight data management
├── services/           # API services
│   ├── chatService.ts  # Chat API calls
│   └── flightService.ts # Flight API calls
├── types/              # TypeScript type definitions
│   ├── api.types.ts    # API interfaces
│   ├── component.types.ts # Component props
│   ├── flight.types.ts # Flight domain types
│   └── index.ts        # Type exports
├── utils/              # Utility functions
│   ├── date.utils.ts   # Date formatting
│   ├── flight.utils.ts # Flight utilities
│   └── index.ts
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## 🛠️ Tech Stack

### Core
- **React 18.3** - UI library with concurrent features
- **TypeScript 5.9** - Type safety and enhanced DX
- **Vite 5.4** - Build tool and dev server

### State Management
- **@tanstack/react-query 5.59** - Server state management
- **React hooks** - Local state management

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **@tailwindcss/typography** - Beautiful typography

### API & Data
- **Axios 1.7** - HTTP client
- **React Markdown** - Markdown rendering

### Code Quality
- **ESLint** - Linting with React/TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### Testing
- **Jest 30** - Testing framework
- **React Testing Library** - Component testing
- **jsdom** - DOM simulation

## 📋 Recent Updates (2025)

### ✅ Complete TypeScript Migration
The entire codebase has been migrated to TypeScript with:
- Strict type checking enabled
- Comprehensive type definitions
- All components `.jsx` → `.tsx`
- All services `.js` → `.ts`
- Type-safe utilities and hooks

### ✅ Performance Enhancements
- All components wrapped with `React.memo`
- All event handlers use `useCallback`
- Expensive computations use `useMemo`
- Optimized bundle configuration

### ✅ Accessibility Improvements
- Full WCAG 2.1 AA compliance
- Complete keyboard navigation
- Screen reader optimized
- Focus management implemented

### ✅ Error Handling
- Error boundary component added
- Graceful error recovery
- User-friendly error messages

### 📚 Additional Documentation
For detailed migration notes, see [REACT_MIGRATION.md](./REACT_MIGRATION.md)

## 🎯 React Best Practices Implemented

This application follows official [React Rules](https://react.dev/reference/rules) and 2025 community best practices.

### 1. Component Architecture
- ✅ Functional components with hooks (no class components)
- ✅ Composition over inheritance
- ✅ Proper prop typing with TypeScript interfaces
- ✅ Component co-location (features with their types/tests)
- ✅ Small, focused components with single responsibility
- ✅ Props interfaces exported for reuse

### 2. Performance Optimization
- ✅ `React.memo` on all components to prevent unnecessary re-renders
- ✅ `useCallback` for all event handlers
- ✅ `useMemo` for expensive computations (filtering, stats)
- ✅ Code splitting infrastructure ready
- ✅ Optimized React Query configuration (staleTime, gcTime)
- ✅ Bundle size optimization with Vite

### 3. TypeScript Best Practices
- ✅ Strict mode enabled (`strict: true`)
- ✅ Comprehensive type definitions in `src/types/`
- ✅ No `any` types (warnings enforced)
- ✅ Proper interface exports
- ✅ Generic types where appropriate
- ✅ Path aliases configured (`@/`, `@/components/`, etc.)
- ✅ Type checking in build pipeline

### 4. Accessibility (WCAG 2.1 AA)
- ✅ ARIA labels on all interactive elements
- ✅ Semantic HTML5 elements (`main`, `header`, `footer`, `nav`, `article`, `time`)
- ✅ Full keyboard navigation (Tab, Enter, Space, Escape)
- ✅ Focus management in modals
- ✅ Screen reader support with proper labels
- ✅ `aria-live` for dynamic content (live updates)
- ✅ `aria-modal` for dialogs
- ✅ `aria-pressed` for toggle buttons
- ✅ `role` attributes where needed
- ✅ Visible focus indicators

### 5. Error Handling
- ✅ Error boundary with fallback UI
- ✅ Proper error logging (ready for Sentry integration)
- ✅ User-friendly error messages
- ✅ Recovery mechanisms (retry buttons)
- ✅ API error handling with try-catch
- ✅ Loading states for all async operations

### 6. State Management
- ✅ React Query for server state (caching, invalidation, background updates)
- ✅ Local state with useState for UI-only data
- ✅ Custom hooks for logic reuse
- ✅ Proper cache management (staleTime, gcTime)
- ✅ SSE for real-time updates
- ✅ Optimistic updates pattern

### 7. Code Quality
- ✅ ESLint with TypeScript, React, Hooks, and Accessibility rules
- ✅ Prettier for consistent formatting
- ✅ Type checking before build (`tsc && vite build`)
- ✅ Test infrastructure with Jest and React Testing Library
- ✅ Husky-ready for pre-commit hooks

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🏗️ Build for Production

```bash
# Type check + build
npm run build

# Preview production build
npm run preview
```

The build will be in the `dist/` directory.

## 🔧 Configuration Files

- `tsconfig.json` - TypeScript configuration
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.eslintrc.cjs` - ESLint rules
- `.prettierrc` - Prettier formatting
- `jest.config.cjs` - Jest testing configuration

## 📦 API Integration

The app connects to a backend API at `/api`:
- `GET /api/flights` - Get all flights
- `GET /api/flights/:id` - Get flight by ID
- `GET /api/flights/events/recent` - Get recent events
- `POST /api/chat/stream` - Chat with streaming response
- `SSE /api/events/stream` - Real-time flight updates

## 🤝 Contributing

1. Follow the existing code style
2. Add types for all new components
3. Write tests for new features
4. Run `npm run lint` and `npm run type-check` before committing
5. Use `npm run format` to format your code

## 📝 License

This project is private and proprietary.
