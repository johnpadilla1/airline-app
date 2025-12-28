# TypeScript in React Applications

## Overview

This guide covers TypeScript best practices, patterns, and type safety techniques for React applications.

## Basic Setup

### tsconfig.json Recommendations

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite Path Aliases (vite.config.ts)

```ts
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
});
```

## 1. Typing Component Props

### Basic Props with Interface

```tsx
// Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional prop
  variant?: 'primary' | 'secondary' | 'danger'; // Union type
}

export function Button({
  label,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### Using Type Exports

```tsx
// Export type alongside component for reuse
export type { ButtonProps };

// Other components can import the type
import type { ButtonProps } from './Button';
```

### Props with Children

```tsx
import type { ReactNode } from 'react';

interface CardProps {
  header: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Card({ header, children, footer }: CardProps) {
  return (
    <div className="card">
      <h2>{header}</h2>
      {children}
      {footer && <div className="footer">{footer}</div>}
    </div>
  );
}
```

### Function Props with Signatures

```tsx
type EventHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
type AsyncEventHandler = () => Promise<void>;

interface ActionButtonsProps {
  onSave: EventHandler;
  onCancel: EventHandler;
  onDelete: AsyncEventHandler;
}
```

### HTML Element Props Extension

```tsx
// Extend native HTML element props
interface InputProps extends React.ComponentProps<'input'> {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

## 2. Generic Components

### Generic Type Parameters

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage
interface User {
  id: string;
  name: string;
}

export function UserList({ users }: { users: User[] }) {
  return (
    <List
      items={users}
      renderItem={(user) => user.name}
      keyExtractor={(user) => user.id}
    />
  );
}
```

### Generic with Constraints

```tsx
interface SelectProps<T extends { id: string; name: string }> {
  options: T[];
  value: string;
  onChange: (value: string) => void;
}

export function Select<T extends { id: string; name: string }>({
  options,
  value,
  onChange
}: SelectProps<T>) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
```

## 3. Typing Hooks

### Custom Hook Types

```tsx
// useLocalStorage.ts
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = (value: T | ((val: T) => T)) => {
    setStoredValue(value);
  };

  return [storedValue, setValue];
}

// Usage
const [name, setName] = useLocalStorage<string>('name', '');
const [user, setUser] = useLocalStorage<User>('user', null);
```

### Typing useReducer

```tsx
type State = {
  count: number;
  status: 'idle' | 'loading' | 'error';
};

type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_STATUS'; payload: State['status'] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    default:
      return state;
  }
}

export function Counter() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    status: 'idle',
  });

  dispatch({ type: 'INCREMENT' });
}
```

### Typing useEffect and Dependencies

```tsx
import type { DependencyList } from 'react';

// Properly typed effect hook
useEffect(() => {
  const subscription = props.source.subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [props.source]); // TypeScript will verify props.source matches dependencies
```

## 4. Typing Forms

### Controlled Component with Types

```tsx
interface LoginForm {
  email: string;
  password: string;
}

export function LoginForm() {
  const [values, setValues] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form>
      <input
        type="email"
        name="email"
        value={values.email}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
      />
    </form>
  );
}
```

### Using Generics for Forms

```tsx
interface FormField<T> {
  name: keyof T;
  label: string;
  type: string;
  value: string;
  error?: string;
}

interface FormProps<T> {
  fields: FormField<T>[];
  values: T;
  onChange: (name: keyof T, value: string) => void;
}

export function Form<T extends Record<string, any>>({
  fields,
  values,
  onChange
}: FormProps<T>) {
  return (
    <form>
      {fields.map((field) => (
        <input
          key={String(field.name)}
          name={String(field.name)}
          value={values[field.name] || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      ))}
    </form>
  );
}
```

### Zod Integration

```tsx
import { z } from 'zod';

// Define schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Infer type from schema
type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleSubmit = (data: LoginFormData) => {
    // Type-safe validated data
  };

  return <form>{/* ... */}</form>;
}
```

## 5. Typing Context

### Context with Types

```tsx
// types.ts
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

// AuthContext.tsx
import { createContext, useContext } from 'react';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login: async (credentials) => {
      // implementation
    },
    logout: () => {
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook with type safety
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## 6. Typing API Responses

### API Types

```tsx
// types/api.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
```

### Typed API Functions

```tsx
// api/users.ts
import type { User, CreateUserData, UpdateUserData, PaginatedResponse, ApiError } from '@/types/api';

export async function getUsers(page = 1): Promise<PaginatedResponse<User>> {
  const response = await fetch(`/api/users?page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }
  return response.json();
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

### React Query with Types

```tsx
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, CreateUserData } from '@/types/api';
import * as usersApi from '@/api/users';

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.getUsers(page),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => usersApi.createUser(data),
    onSuccess: (newUser) => {
      queryClient.setQueryData(['users', newUser.id], newUser);
    },
  });
}
```

## 7. Utility Types

### Common Utility Types

```tsx
// Make all properties optional
type PartialUser = Partial<User>;

// Make all properties required
type RequiredUser = Required<Partial<User>>;

// Pick specific properties
type UserBasicInfo = Pick<User, 'id' | 'name' | 'email'>;

// Omit specific properties
type CreateUserRequest = Omit<User, 'id' | 'createdAt'>;

// Make properties readonly
type ReadonlyUser = Readonly<User>;

// Create from function return type
type UserReturnType = ReturnType<typeof createUser>;

// Extract promise type
type UserType = Awaited<Promise<User>>;

// Record type
type UserRecord = Record<string, User>;

// Union to intersection
type UserProps = { id: string } & { name: string } & { email: string };
```

### Custom Utility Types

```tsx
// Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type UpdateUser = PartialBy<User, 'name' | 'email'>;

// Deep readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// Nullable properties
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Required except specified
type RequiredExcept<T, K extends keyof T> = Omit<T, K> & Required<Omit<T, K>>;
```

## 8. Discriminated Unions

### Tagged Unions for State

```tsx
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function UserProfile() {
  const [state, setState] = useState<AsyncState<User>>({ status: 'idle' });

  if (state.status === 'loading') {
    return <div>Loading...</div>;
  }

  if (state.status === 'error') {
    return <div>Error: {state.error.message}</div>;
  }

  if (state.status === 'success') {
    return <div>Welcome {state.data.name}</div>;
  }

  return <div>Idle</div>;
}
```

### Event Actions

```tsx
type CounterAction =
  | { type: 'INCREMENT'; by?: number }
  | { type: 'DECREMENT'; by?: number }
  | { type: 'RESET' }
  | { type: 'SET'; value: number };

function reducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case 'INCREMENT':
      return state + (action.by ?? 1);
    case 'DECREMENT':
      return state - (action.by ?? 1);
    case 'RESET':
      return 0;
    case 'SET':
      return action.value;
    default:
      return state;
  }
}
```

## 9. Type Guards and Assertions

### Type Guards

```tsx
// User-defined type guard
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

// Usage
function processData(data: unknown) {
  if (isUser(data)) {
    // TypeScript knows data is User here
    console.log(data.name);
  }
}
```

### Discriminating Union Types

```tsx
type ApiResponse =
  | { success: true; data: User }
  | { success: false; error: { message: string } };

function handleResponse(response: ApiResponse) {
  if (response.success) {
    // TypeScript knows response.data exists
    return response.data;
  } else {
    // TypeScript knows response.error exists
    throw new Error(response.error.message);
  }
}
```

### Type Assertion Functions

```tsx
function assertIsUser(data: unknown): asserts data is User {
  if (!isUser(data)) {
    throw new Error('Data is not a User');
  }
}

function processUser(data: unknown) {
  assertIsUser(data);
  // After assertion, TypeScript knows data is User
  console.log(data.name);
}
```

## 10. React Component Type Patterns

### Compound Components Pattern

```tsx
interface CardContextValue {
  variant: 'primary' | 'secondary';
}

const CardContext = createContext<CardContextValue>({
  variant: 'primary',
});

interface CardProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Card({ variant = 'primary', children }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={`card card-${variant}`}>{children}</div>
    </CardContext.Provider>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
}

export function CardHeader({ children }: CardHeaderProps) {
  return <h2>{children}</h2>;
}

interface CardBodyProps {
  children: React.ReactNode;
}

export function CardBody({ children }: CardBodyProps) {
  return <div>{children}</div>;
}
```

### Polymorphic Components

```tsx
type AsProp<T extends React.ElementType> = {
  as?: T;
};

type PropsToAs<T extends AsProp<React.ElementType>, P> = Omit<P, keyof AsProp<T>> &
  AsProp<T>;

type PolymorphicComponentProps<T extends React.ElementType, P = {}> = P &
  PropsToAs<T, P> & {
    as?: T;
  };

export function Button<T extends React.ElementType = 'button'>({
  as,
  ...props
}: PolymorphicComponentProps<T, ButtonProps>) {
  const Component = as || 'button';
  return <Component {...props} />;
}

// Usage
<Button as="a" href="/home">Home</Button>
<Button as="button">Click me</Button>
```

## 11. Type Imports

### Importing Types

```tsx
// ✅ Good: Explicit type import
import type { ButtonProps } from './Button';
import { Button } from './Button';

// ✅ Good: Type-only import in same line
import { Button, type ButtonProps } from './Button';

// ❌ Avoid: Mixing type and value imports
import { ButtonProps } from './Button'; // Could be ambiguous
```

### Exporting Types

```tsx
// ✅ Good: Export type separately
export type { UserProps };

// ✅ Good: Export inline
export interface ButtonProps {
  // ...
}

// ✅ Good: Export alongside component
export function Button(props: ButtonProps) {}
export type { ButtonProps };
```

## 12. Strict TypeScript Configuration

### Enabling Strict Mode Benefits

```tsx
// Strict mode catches these issues:

// ❌ Error: undefined is not assignable to string
function greet(name?: string) {
  return `Hello ${name!.toUpperCase()}`; // Non-null assertion
}

// ✅ Better: Handle undefined
function greet(name?: string) {
  return name ? `Hello ${name.toUpperCase()}` : 'Hello stranger';
}

// ❌ Error: Property 'name' does not exist
function processUser(data: unknown) {
  console.log(data.name);
}

// ✅ Better: Type guard
function processUser(data: unknown) {
  if (isUser(data)) {
    console.log(data.name);
  }
}
```

## TypeScript Best Practices Checklist

- [ ] Always type component props with interfaces or types
- [ ] Use type-only imports with `import type`
- [ ] Leverage utility types (`Partial`, `Pick`, `Omit`)
- [ ] Use discriminated unions for state management
- [ ] Type all API requests and responses
- [ ] Use type guards for unknown data
- [ ] Enable strict mode in tsconfig.json
- [ ] Avoid `any` type, use `unknown` instead
- [ ] Use generics for reusable components
- [ ] Type all hooks (useState, useEffect, useReducer)
- [ ] Export types alongside components for reuse

## Common TypeScript Patterns

### Conditional Types

```tsx
type NonNullable<T> = T extends null | undefined ? never : T;

type Response<T> = T extends string
  ? { message: T }
  : { data: T };
```

### Template Literal Types

```tsx
type Color = 'red' | 'blue' | 'green';
type Size = 'sm' | 'md' | 'lg';

type ButtonClass = `btn-${Color}-${Size}`;
// 'btn-red-sm' | 'btn-red-md' | 'btn-blue-lg' | etc.
```

### Keyof Type Operator

```tsx
type User = {
  id: string;
  name: string;
  email: string;
};

type UserKeys = keyof User; // 'id' | 'name' | 'email'

function getValue(obj: T, key: K): T[K] {
  return obj[key];
}
```

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Total TypeScript](https://totaltypescript.com/)
