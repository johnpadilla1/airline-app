# Testing React Applications

## Overview

This guide covers testing patterns and best practices for React applications using React Testing Library, Jest, and related testing tools.

## Testing Philosophy

**The more your tests resemble the way your software is used, the more confidence they can give you.** - Testing Library

### Key Principles

1. **Test user behavior, not implementation details**
2. **Test what users see and interact with**
3. **Avoid testing implementation (internal state, methods)**
4. **Write tests that are resilient to refactoring**

## 1. Setting Up Testing Environment

### Dependencies

```bash
# For Vite projects
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# For Create React App (already included)
# @testing-library/react
# @testing-library/jest-dom
# @testing-library/user-event

# Additional recommended packages
npm install --save-dev @testing-library/dom vitest @vitest/ui

# For Next.js
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Vitest Configuration (vite.config.ts)

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

### Test Setup File (src/test/setup.ts)

```ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## 2. Testing Components

### Basic Component Test

```tsx
// Button.tsx
export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      data-testid="button"
    >
      {label}
    </button>
  );
}

// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders the button label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button label="Click me" onClick={handleClick} />);

    await user.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the correct variant class', () => {
    render(
      <Button label="Click me" onClick={() => {}} variant="secondary" />
    );
    expect(screen.getByTestId('button')).toHaveClass('btn-secondary');
  });
});
```

### Testing User Interactions

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments count when increment button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /increment/i }));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('decrements count when decrement button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);

    await user.click(screen.getByRole('button', { name: /decrement/i }));
    expect(screen.getByText('Count: 4')).toBeInTheDocument();
  });
});
```

### Testing Forms

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Async Components

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { getUser } from './api';

// Mock API call
vi.mock('./api', () => ({
  getUser: vi.fn(),
}));

describe('UserProfile', () => {
  it('shows loading state initially', () => {
    vi.mocked(getUser).mockImplementation(() => new Promise(() => {}));
    render(<UserProfile userId="1" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays user data after loading', async () => {
    vi.mocked(getUser).mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    });

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    vi.mocked(getUser).mockRejectedValue(new Error('Failed to fetch'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## 3. Testing Custom Hooks

```tsx
// useCounter.ts
export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

### Testing Hooks with Dependencies

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';
import * as api from './api';

vi.mock('./api');

describe('useUsers', () => {
  it('fetches users on mount', async () => {
    const mockUsers = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];
    vi.mocked(api.fetchUsers).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockUsers);
  });
});
```

## 4. Testing Context

```tsx
// AuthContext.test.tsx
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  it('provides auth state to consumers', () => {
    const TestComponent = () => {
      const { isAuthenticated } = useAuth();
      return <div>{isAuthenticated ? 'Logged in' : 'Logged out'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Logged out')).toBeInTheDocument();
  });

  it('allows login and logout', async () => {
    const TestComponent = () => {
      const { user, login, logout } = useAuth();
      return (
        <div>
          {user ? <div>{user.name}</div> : <div>No user</div>}
          <button onClick={() => login({ name: 'John' })}>Login</button>
          <button onClick={logout}>Logout</button>
        </div>
      );
    };

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: /login/i }));
    expect(screen.getByText('John')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(screen.getByText('No user')).toBeInTheDocument();
  });
});
```

## 5. Testing React Router

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navigation } from './Navigation';

// Helper function to render with router
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Navigation', () => {
  it('navigates to different pages', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const aboutLink = screen.getByRole('link', { name: /about/i });
    await user.click(aboutLink);

    expect(window.location.pathname).toBe('/about');
  });
});
```

## 6. Mocking External Dependencies

### Mocking API Calls

```tsx
// users.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UsersList } from './UsersList';
import * as api from './api';

vi.mock('./api');

describe('UsersList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays users from API', async () => {
    const mockUsers = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];
    vi.mocked(api.getUsers).mockResolvedValue(mockUsers);

    render(<UsersList />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });

    expect(api.getUsers).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking React Query

```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Users } from './Users';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe('Users with React Query', () => {
  it('displays loading state', () => {
    const queryClient = createTestQueryClient();
    vi.spyOn(api, 'getUsers').mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <Users />
      </QueryClientProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Mocking Components

```tsx
// Mock a heavy chart component
vi.mock('./HeavyChart', () => ({
  HeavyChart: () => <div data-testid="mock-chart">Chart</div>,
}));

// Now in tests, the mock will be used instead of real component
```

## 7. Integration Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('User Registration Flow', () => {
  it('allows user to complete registration', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to registration
    await user.click(screen.getByRole('link', { name: /register/i }));

    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });
});
```

## 8. Test Organization and Structure

### Recommended File Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── LoginForm/
│       ├── LoginForm.tsx
│       ├── LoginForm.test.tsx
│       └── index.ts
├── features/
│   └── auth/
│       ├── components/
│       │   └── LoginForm/
│       └── __tests__/
│           └── login.integration.test.tsx
└── test/
    ├── setup.ts
    ├── utils.tsx
    └── mocks.ts
```

### Test Utilities

```tsx
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function AllProviders({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return render(<AllProviders>{ui}</AllProviders>, options);
}
```

## 9. Best Practices

### DO's

```tsx
// ✅ Test user behavior
it('allows user to submit form', async () => {
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ✅ Query by accessible role
expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument();

// ✅ Test what users see
expect(screen.getByText('Loading...')).toBeInTheDocument();

// ✅ Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### DON'Ts

```tsx
// ❌ Test implementation details
it('updates count state', () => {
  // Don't test internal state
});

// ❌ Use data-testid unnecessarily
expect(screen.getByTestId('submit-button')).toBeInTheDocument();
// Use getByRole instead

// ❌ Test class names
expect(container.querySelector('.btn-primary')).toBeInTheDocument();

// ❌ Test internal methods
const component = mount(<MyComponent />);
component.instance().handleClick();
```

## 10. Common Testing Scenarios

### Testing Event Handlers

```tsx
it('calls onChange when input changes', async () => {
  const handleChange = vi.fn();
  const user = userEvent.setup();

  render(<input onChange={handleChange} />);

  await user.type(screen.getByRole('textbox'), 'hello');

  expect(handleChange).toHaveBeenCalledTimes(5);
});
```

### Testing Conditional Rendering

```tsx
it('shows error message when validation fails', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

### Testing Lists

```tsx
it('renders list of items', () => {
  const items = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];

  render(<ItemList items={items} />);

  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});
```

## 11. Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Coverage Goals

- Aim for 80%+ code coverage
- Focus on critical paths
- Don't chase 100% coverage at expense of maintainability

## Additional Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Playground](https://testing-playground.com/)
- [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest Documentation](https://vitest.dev/)
