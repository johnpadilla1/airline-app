# Performance Optimization in React Applications

## Overview

This guide covers performance optimization techniques for React applications. Performance optimization should be intentional and data-driven - measure first, then optimize.

## Golden Rule: Measure First

Before optimizing, always measure to identify actual bottlenecks.

### Measurement Tools

```bash
# React DevTools Profiler
# Install: npm install --save-dev @welldone-software/why-did-you-render

# Bundle analysis
npm install --save-dev @bundle-analyzer/webpack-bundle-analyzer

# Performance monitoring
npm install web-vitals
```

### Using React DevTools Profiler

```tsx
// Wrap your app with Profiler for development analysis
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (process.env.NODE_ENV === 'development') {
    console.log({
      id,
      phase,
      actualDuration,
      baseDuration,
    });
  }
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

## 1. Memoization with useMemo and useCallback

### useMemo for Expensive Calculations

**When to use:**
- Expensive computations (filtering large arrays, complex math)
- Referential equality checks (object dependencies)
- Derived state that shouldn't be recalculated every render

```tsx
import { useMemo } from 'react';

export function ProductList({ products, filter }: ProductListProps) {
  // ✅ Good: Memoize expensive filter operation
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);

  // ✅ Good: Memoize expensive calculation
  const statistics = useMemo(() => {
    return {
      total: products.length,
      average: products.reduce((sum, p) => sum + p.price, 0) / products.length,
      max: Math.max(...products.map(p => p.price)),
    };
  }, [products]);

  // ❌ Bad: Unnecessary memoization of simple operation
  const doubled = useMemo(() => count * 2, [count]); // Just compute it directly

  return <div>{/* render filtered products */}</div>;
}
```

### useCallback for Function References

**When to use:**
- Functions passed to memoized child components
- Functions used as dependencies in useEffect
- Functions used in useCallback dependencies themselves

```tsx
import { useCallback } from 'react';

export function ParentComponent() {
  const [items, setItems] = useState<Item[]>([]);

  // ✅ Good: Memoize function passed to memoized child
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // ✅ Good: Memoize function used in useEffect dependency
  const fetchUser = useCallback(async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }, []);

  useEffect(() => {
    fetchUser('123');
  }, [fetchUser]);

  return <MemoizedChild onDelete={handleDelete} />;
}

// ❌ Bad: Unnecessary callback
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // Just use regular function
```

## 2. Component Memoization with React.memo

### When to Use React.memo

**Use cases:**
- Pure functional components that re-render often with same props
- Components rendered in lists with many items
- Components that receive complex object props
- Expensive components that don't need frequent updates

```tsx
import { memo } from 'react';

// ✅ Good: Memoize expensive component
const ExpensiveChart = memo(function ExpensiveChart({ data }: ChartProps) {
  // Complex rendering logic
  return <div>{/* Chart rendering */}</div>;
});

// ✅ Good: Memoize list items
const ProductItem = memo(function ProductItem({
  product,
  onAddToCart
}: ProductItemProps) {
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => onAddToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.product.id === nextProps.product.id;
});

export function ProductList({ products }: { products: Product[] }) {
  return (
    <div>
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}
```

### When NOT to Use React.memo

```tsx
// ❌ Don't memoize if props change frequently
const Counter = memo(function Counter({ count }: { count: number }) {
  return <div>{count}</div>;
});
// Props change on every render, memoization is useless

// ❌ Don't memoize if component is cheap to render
const SimpleDiv = memo(function SimpleDiv({ text }: { text: string }) {
  return <div>{text}</div>;
});
// Too simple to benefit from memoization
```

## 3. Code Splitting and Lazy Loading

### Route-Based Code Splitting

```tsx
// App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Component-Based Code Splitting

```tsx
import { lazy, Suspense, useState } from 'react';

// Lazy load heavy component
const HeavyChart = lazy(() => import('./HeavyChart'));

export function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Analytics
      </button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

### Named Exports with Lazy Loading

```tsx
// Lazy load named exports
const { UserProfile } = lazy(() =>
  import('./components').then(module => ({ default: module.UserProfile }))
);
```

## 4. Virtualizing Long Lists

### Using react-window

```bash
npm install react-window
```

```tsx
import { FixedSizeList } from 'react-window';

export function VirtualizedList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Using react-virtuoso

```bash
npm install react-virtuoso
```

```tsx
import { Virtuoso } from 'react-virtuoso';

export function VirtualizedList({ items }: { items: Item[] }) {
  return (
    <Virtuoso
      style={{ height: '600px' }}
      data={items}
      itemContent={(index, item) => (
        <div>{item.name}</div>
      )}
    />
  );
}
```

## 5. Optimizing Context and State

### Context Optimization

```tsx
import { useMemo, createContext, useContext } from 'react';

// ❌ Bad: Causes re-renders for all consumers
const UserContext = createContext<{
  user: User | null;
  updateUser: (user: User) => void;
}>({
  user: null,
  updateUser: () => {},
});

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);

  // Creates new object every render
  const value = { user, updateUser: setUser };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ✅ Good: Memoized context value
function OptimizedUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);

  // Memoized value - only changes when user changes
  const value = useMemo(
    () => ({
      user,
      updateUser: setUser,
    }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
```

### Split Contexts

```tsx
// ✅ Good: Split context by concern
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<{
  updateUser: (user: User) => void;
} | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);

  const actions = useMemo(
    () => ({ updateUser: setUser }),
    []
  );

  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}

// Components only re-render when the context they use changes
function UserName() {
  const user = useContext(UserContext);
  return <div>{user?.name}</div>;
}

function UpdateButton() {
  const { updateUser } = useContext(UserActionsContext)!;
  return <button onClick={() => updateUser(newUser)}>Update</button>;
}
```

## 6. Optimizing Images and Assets

### Image Optimization

```tsx
// Use next/image for Next.js
import Image from 'next/image';

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={300}
      placeholder="blur"
      loading="lazy"
    />
  );
}

// For CRA, use lazy loading
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} loading="lazy" />;
}
```

### Font Optimization

```tsx
// next/font (Next.js)
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export function MyApp() {
  return <main className={inter.className}> {/* content */} </main>;
}
```

## 7. Bundle Size Optimization

### Tree Shaking

```tsx
// ✅ Good: Import specific components
import { Button } from 'material-ui'; // Tree-shakeable

// ❌ Bad: Import entire library
import * as MUI from 'material-ui'; // Bundles everything
```

### Analyzing Bundle Size

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# Add to package.json
"scripts": {
  "analyze": "webpack-bundle-analyzer build/static/js/*.js"
}
```

```tsx
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
};
```

### Compression

```tsx
// next.config.js (Next.js)
module.exports = {
  compress: true,
};

// For CRA, compression is handled by the web server
```

## 8. Optimizing Renders with Keys

```tsx
// ❌ Bad: Using index as key when list can change
{items.map((item, index) => (
  <Item key={index} item={item} /> // Causes issues with reordering
))}

// ✅ Good: Using unique identifier
{items.map(item => (
  <Item key={item.id} item={item} /> // Stable identity
))}
```

## 9. Debouncing and Throttling

```tsx
import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// Custom debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search component
export function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    // API call only runs 300ms after user stops typing
    searchUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}
```

## 10. Web Workers for Heavy Computation

```tsx
// worker.ts
self.onmessage = (e: MessageEvent) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

// Component
export function HeavyComputationComponent() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url));

    worker.onmessage = (e) => {
      setResult(e.data);
      worker.terminate();
    };

    worker.postMessage(largeDataSet);

    return () => worker.terminate();
  }, []);

  return <div>{/* display result */}</div>;
}
```

## Performance Checklist

### Component Level
- [ ] Used `useMemo` for expensive calculations
- [ ] Used `useCallback` for functions passed to children
- [ ] Used `React.memo` for components that re-render often with same props
- [ ] Proper keys for lists
- [ ] Avoided inline object/array creation in JSX

### Application Level
- [ ] Code splitting for routes
- [ ] Lazy loading for heavy components
- [ ] Virtualized long lists
- [ ] Optimized images (lazy loading, proper formats)
- [ ] Debounced user inputs (search, auto-save)

### Bundle Size
- [ ] Analyzed bundle size
- [ ] Removed unused dependencies
- [ ] Used tree-shakeable imports
- [ ] Enabled compression

### State Management
- [ ] Split contexts by concern
- [ ] Memoized context values
- [ ] Used React Query for server state
- [ ] Avoided unnecessary state updates

## Common Performance Pitfalls

❌ **Don't:**
```tsx
// Inline object creation in JSX
<div style={{ color: 'red' }}>...</div> // Creates new object every render

// Unnecessary re-renders from context
function Component() {
  const { user, updateTheme } = useContext(AppContext);
  // Re-renders when theme changes even if not using it
}

// Mapping without useMemo
{items.map(item => (
  <ExpensiveComponent key={item.id} item={item} />
))}
```

✅ **Do:**
```tsx
// Move styles outside or use useMemo
const containerStyle = { color: 'red' };
<div style={containerStyle}>...</div>

// Split contexts
function Component() {
  const user = useContext(UserContext); // Only re-renders when user changes
}

// Memo expensive component
const MemoizedExpensive = memo(ExpensiveComponent);
{items.map(item => (
  <MemoizedExpensive key={item.id} item={item} />
))}
```

## Measuring Performance Improvements

```tsx
// Core Web Vitals
import { useReportWebVitals } from 'web-vitals';

export function reportWebVitals(metric: any) {
  console.log(metric);
  // Send to analytics
}

// Lighthouse CI integration
// .github/workflows/lighthouse.yml
```

## Additional Resources

- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [react-window Documentation](https://react-window.vercel.app/)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/reference/useQuery)
