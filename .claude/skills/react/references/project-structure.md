# React Project Structure - Feature-Based Architecture

This guide provides detailed recommendations for organizing React projects using feature-based architecture, based on official React documentation and 2025 community best practices.

## Table of Contents

1. [Overview](#overview)
2. [Feature-Based Structure](#feature-based-structure)
3. [Directory Organization](#directory-organization)
4. [Naming Conventions](#naming-conventions)
5. [Import Strategies](#import-strategies)
6. [Scaling Considerations](#scaling-considerations)
7. [Next.js Specific Structure](#nextjs-specific-structure)

## Overview

Feature-based architecture groups code by business features rather than technical layers. This approach:

- **Improves discoverability** - Related code is co-located
- **Enhances maintainability** - Easier to find and modify feature code
- **Supports team scaling** - Teams can own entire features
- **Enables code splitting** - Features can be lazy-loaded independently

## Feature-Based Structure

### Recommended Structure

```
src/
├── app/                          # Next.js app router or pages
├── features/                     # Business features
│   ├── auth/                    # Authentication feature
│   │   ├── components/          # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── index.ts
│   │   ├── hooks/               # Auth-specific hooks
│   │   │   ├── useAuth.ts
│   │   │   └── usePermissions.ts
│   │   ├── api/                 # API calls
│   │   │   └── authApi.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── auth.types.ts
│   │   ├── utils/               # Feature utilities
│   │   │   └── validation.ts
│   │   ├── constants.ts         # Feature constants
│   │   └── index.ts             # Public API
│   │
│   ├── dashboard/               # Dashboard feature
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── hooks/
│   │   │   └── useDashboardData.ts
│   │   ├── api/
│   │   │   └── dashboardApi.ts
│   │   ├── types/
│   │   │   └── dashboard.types.ts
│   │   └── index.ts
│   │
│   └── users/                   # User management feature
│       ├── components/
│       │   ├── UserList.tsx
│       │   ├── UserCard.tsx
│       │   └── UserForm.tsx
│       ├── hooks/
│       │   └── useUsers.ts
│       ├── api/
│       │   └── usersApi.ts
│       ├── types/
│       │   └── user.types.ts
│       └── index.ts
│
├── shared/                       # Shared utilities
│   ├── components/              # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── styles.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Card/
│   │
│   ├── hooks/                   # Shared custom hooks
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   └── index.ts
│   │
│   ├── utils/                   # Helper functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── date.ts
│   │   └── index.ts
│   │
│   ├── types/                   # Shared types
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── index.ts
│   │
│   └── constants/               # App-wide constants
│       ├── routes.ts
│       ├── api.ts
│       └── index.ts
│
├── lib/                          # External library configs
│   ├── react-query/
│   │   ├── Provider.tsx
│   │   ├── queryClient.ts
│   │   └── index.ts
│   ├── router/
│   │   └── routes.tsx
│   └── tests/
│       ├── setup.ts
│       └── utils.tsx
│
└── styles/                       # Global styles
    ├── globals.css
    └── themes.css
```

## Directory Organization

### features/

Each feature is a self-contained module with everything it needs:

```typescript
// features/auth/index.ts
// Public API for the auth feature

export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { useAuth } from './hooks/useAuth';
export { usePermissions } from './hooks/usePermissions';
export type { User, LoginCredentials } from './types';
```

**Benefits:**
- Clear public API for each feature
- Internal implementation can change without affecting other features
- Easy to move features between projects
- Simple to delete entire features

### shared/

Contains truly shared, reusable code:

**components/** - Generic UI components
- Not tied to specific business logic
- Highly configurable via props
- Examples: Button, Input, Modal, Card

**hooks/** - Generic reusable hooks
- Not tied to specific features
- Examples: useLocalStorage, useDebounce, useMediaQuery

**utils/** - Pure utility functions
- No side effects
- Examples: formatDate, formatCurrency, validation helpers

**types/** - Shared TypeScript types
- Types used across multiple features
- Examples: API response types, common domain types

**Rule of thumb:** If code is used by 3+ features, consider moving to shared/. Otherwise, keep it feature-specific.

### lib/

Configuration and setup for external libraries:

```typescript
// lib/react-query/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

Examples:
- React Query setup
- Router configuration
- Testing utilities
- Logger configuration

## Naming Conventions

### Files

**Components:** PascalCase
```
UserProfile.tsx
DataTable.tsx
FormInput.tsx
```

**Hooks:** camelCase with 'use' prefix
```
useUserProfile.ts
useDataTable.ts
useFormInput.ts
```

**Utilities:** camelCase
```
formatDate.ts
validateEmail.ts
calculateTotal.ts
```

**Types:** camelCase with '.types' suffix or PascalCase for type files
```
user.types.ts
api.types.ts
UserProfile.ts (if single export)
```

**Tests:** Same as file with '.test' suffix
```
UserProfile.test.tsx
useUserProfile.test.ts
formatDate.test.ts
```

### Folders

**Features:** lowercase, singular
```
features/auth/
features/user/
features/dashboard/
```

**Shared components:** PascalCase
```
shared/components/Button/
shared/components/Modal/
```

## Import Strategies

### Absolute Imports

Configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/lib/*": ["src/lib/*"]
    }
  }
}
```

Now you can import cleanly:

```tsx
// Instead of:
import { Button } from '../../../../../../shared/components/Button';

// Use:
import { Button } from '@/shared/components/Button';

// Or from feature:
import { LoginForm } from '@/features/auth';
```

### Feature Index Exports

Use `index.ts` files to create clean public APIs:

```typescript
// features/users/index.ts
export { UserList } from './components/UserList';
export { UserCard } from './components/UserCard';
export { useUsers } from './hooks/useUsers';
export type { User, UserFilters } from './types';

// Usage elsewhere
import { UserList, useUsers, type User } from '@/features/users';
```

## Scaling Considerations

### When to Extract to Shared

Move code from features to shared when:

1. **Used by 3+ features** - Code is genuinely shared
2. **Generic enough** - Not tied to specific business logic
3. **Stable API** - Unlikely to change frequently

### When to Keep in Features

Keep code feature-specific when:

1. **Used by 1-2 features** - Don't premature abstract
2. **Business logic** - Tied to specific domain
3. **Evolving API** - Still being refined

### Lazy Loading Features

Features can be code-split at the feature level:

```tsx
// app/dashboard/page.tsx
import { lazy } from 'react';

const DashboardLayout = lazy(() =>
  import('@/features/dashboard/components/DashboardLayout')
);

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLayout />
    </Suspense>
  );
}
```

## Next.js Specific Structure

### App Router (Next.js 13+)

```
src/
├── app/                          # App router
│   ├── (auth)/                  # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/             # Dashboard route group
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
│
├── features/                     # Same as above
└── shared/                       # Same as above
```

**Route groups** `(auth)`, `(dashboard)` organize routes without affecting URL structure.

### Page Components

Keep pages thin - delegate to features:

```tsx
// app/users/page.tsx
import { UserList } from '@/features/users';

export default function UsersPage() {
  return <UserList />;
}
```

## Common Patterns

### Feature Module Structure

```
feature-name/
├── components/          # Feature components
├── hooks/              # Feature hooks
├── api/                # API calls
├── types/              # Types
├── utils/              # Feature utilities
├── constants.ts        # Constants
├── index.ts            # Public API
└── [feature-name].test.tsx  # Integration tests
```

### Component Co-location

Keep related files together:

```
UserProfile/
├── UserProfile.tsx           # Component
├── UserProfile.test.tsx      # Tests
├── UserProfile.stories.tsx   # Stories
├── useUserProfileData.ts     # Hook
├── types.ts                  # Types
└── index.ts                  # Exports
```

## Anti-Patterns to Avoid

❌ **Don't organize by file type across entire app:**
```
src/
├── components/      # All components mixed together
├── hooks/           # All hooks mixed together
├── utils/           # All utilities mixed together
```

This makes it hard to find related code and doesn't scale.

❌ **Don't create shared code prematurely:**
Only extract to shared when genuinely needed. YAGNI (You Aren't Gonna Need It).

❌ **Don't deeply nest folders:**
```
features/
  auth/
    components/
      forms/
        login/
          LoginForm/
            LoginForm.tsx  # Too deep!
```

Keep it flat - 3-4 levels max.

## Key Takeaways

1. **Group by feature** - Organize around business capabilities
2. **Co-locate related code** - Keep components, hooks, types together
3. **Create public APIs** - Use index.ts to export feature APIs
4. **Keep shared lean** - Only move to shared when genuinely reusable
5. **Configure path aliases** - Use absolute imports for cleaner code
6. **Lazy load features** - Code-split at feature level for performance
