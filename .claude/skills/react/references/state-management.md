# State Management in React Applications

## Overview

This guide covers state management patterns in React applications, from local component state to global state solutions. Choose the right approach based on your specific use case.

## State Management Decision Tree

```
Is the state server data?
├── Yes → Use React Query / SWR (server state)
└── No → Is it used by multiple components?
    ├── Yes → Is it simple UI state?
    │   ├── Yes → Context API + useReducer
    │   └── No → Consider Zustand / Redux (complex global state)
    └── No → Use useState (local component state)
```

## 1. Local State with useState

**Best for:** Simple, independent component state

```tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

**Use cases:**
- Form inputs
- Toggle states (open/close, on/off)
- UI mode (view mode, selected tab)
- Temporary data

**Best practices:**
- Update state functionally when deriving from previous state
- Keep state as simple as possible
- Co-locate related state in a single object

```tsx
// ✅ Good: Functional update
setCount(prev => prev + 1);

// ✅ Good: Related state in one object
const [form, setForm] = useState({
  username: '',
  email: '',
  password: ''
});

// ❌ Avoid: Multiple related useState calls
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
```

## 2. Complex State with useReducer

**Best for:** Complex state logic with multiple sub-values or next state depends on previous state

```tsx
type State = {
  items: CartItem[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
};

type Action =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_STATUS'; payload: State['status'] }
  | { type: 'SET_ERROR'; payload: string };

const initialState: State = {
  items: [],
  status: 'idle',
  error: null,
};

function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        status: 'error',
      };
    default:
      return state;
  }
}

export function ShoppingCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  // ... component logic
}
```

**Use cases:**
- Forms with multiple fields and validation
- Shopping cart, todo list (collections with CRUD operations)
- Multi-step wizards
- State with complex transition logic

**Best practices:**
- Use TypeScript discriminated unions for actions
- Keep reducers pure and predictable
- Use action creators for complex actions

```tsx
// ✅ Good: Action creator
const addItem = (item: CartItem): Action => ({
  type: 'ADD_ITEM',
  payload: item,
});

dispatch(addItem(newItem));
```

## 3. Context API for Global State

**Best for:** Global UI state that doesn't change frequently (theme, auth, language)

### Creating a Context

```tsx
// src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: Credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await api.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
    }
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout: () => dispatch({ type: 'LOGOUT' }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for consuming context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Using Context

```tsx
// src/features/auth/components/LoginForm.tsx
import { useAuth } from '../context/AuthContext';

export function LoginForm() {
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };

  // ... component JSX
}
```

**Use cases:**
- Theme (dark/light mode)
- Authentication state
- User preferences
- Localization/i18n
- Application-wide settings

**Best practices:**
- Split contexts by domain (don't have one giant context)
- Use custom hooks to consume context
- Keep context values stable with useMemo/useCallback
- Avoid frequent updates to context (causes re-renders)

```tsx
// ✅ Good: Split contexts by concern
<ThemeProvider>
  <AuthProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </AuthProvider>
</ThemeProvider>

// ❌ Avoid: Single large context
<AppProvider>
  <App />
</AppProvider>
```

**Optimizing Context Re-renders**

```tsx
import { useMemo, useCallback } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

## 4. Server State with React Query / SWR

**Best for:** Server data synchronization, caching, and background updates

### Using React Query

```tsx
// src/features/users/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id, // Only run query if id exists
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### Using React Query in Components

```tsx
// src/features/users/components/UserList.tsx
import { useUsers, useCreateUser } from '../hooks/useUsers';

export function UserList() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser.mutate(newUser)}>
        Add User
      </button>
    </div>
  );
}
```

**Use cases:**
- Fetching data from APIs
- CRUD operations (Create, Read, Update, Delete)
- Real-time data synchronization
- Pagination and infinite scrolling
- Optimistic updates

**Best practices:**
- Use query keys that uniquely identify data
- Set appropriate stale time for caching
- Use invalidateQueries for cache invalidation
- Handle loading and error states properly

## 5. External State Management (Zustand/Redux)

**Best for:** Complex global state with frequent updates across many components

### Zustand Example

```tsx
// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart-storage' }
  )
);

// Usage in component
import { useCartStore } from '@/store/cartStore';

export function Cart() {
  const { items, addItem, removeItem } = useCartStore();

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {item.name}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

**When to use Zustand/Redux:**
- State needs to be accessed from many components
- Complex state with many actions
- Time-travel debugging needed
- State persistence required
- Frequent updates to global state

**When NOT to use:**
- Simple UI state (use Context API)
- Server data (use React Query)
- Local component state (use useState)

## 6. Form State Libraries

### React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Best Practices Summary

1. **Start simple** - Use useState for local state
2. **Server state ≠ client state** - Use React Query for server data
3. **Co-locate state** - Keep state as close to where it's used as possible
4. **Avoid prop drilling** - Use Context for truly global state
5. **Memoize context values** - Prevent unnecessary re-renders
6. **Type your state** - Use TypeScript for all state operations
7. **Handle errors** - Always handle loading and error states
8. **Optimize later** - Don't over-optimize state management prematurely

## Common Mistakes

❌ **Don't:**
```tsx
// Storing server data in useState
const [users, setUsers] = useState<User[]>([]); // ❌ Use React Query instead

// Storing derived state
const [fullName, setFullName] = useState(`${firstName} ${lastName}`); // ❌ Compute it

// Updating state in useEffect without proper dependencies
useEffect(() => {
  setCount(count + 1); // ❌ Will cause infinite loop
}, [count]);
```

✅ **Do:**
```tsx
// Use React Query for server data
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// Compute derived state
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

// Use functional updates
setCount(c => c + 1); // ✅ Correct
```

## Choosing the Right Tool

| Scenario | Recommended Tool |
|----------|-----------------|
| Local UI state | useState |
| Complex form state | useReducer or React Hook Form |
| Global UI state (theme, auth) | Context API |
| Server data | React Query / SWR |
| Complex global state | Zustand / Redux |
| URL state | URL search params or useState |
| Form validation | React Hook Form + Zod |
| Animation state | Framer Motion useAnimation |

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Hook Form](https://react-hook-form.com/)
- [Context API Guide](https://react.dev/learn/scaling-up-with-reducer-and-context)
