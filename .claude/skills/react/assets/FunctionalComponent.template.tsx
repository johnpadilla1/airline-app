import { memo } from 'react';
import type { ReactNode } from 'react';

/**
 * ComponentName Component
 *
 * Description of what this component does and when to use it.
 *
 * @example
 * ```tsx
 * <ComponentName prop="value">
 *   Children content
 * </ComponentName>
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentNameProps {
  /**
   * Description of the prop
   * @default 'default value'
   */
  prop: string;
  /**
   * Optional prop description
   */
  optionalProp?: number;
  /**
   * Child components to render
   */
  children?: ReactNode;
  /**
   * Click handler
   */
  onClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComponentName({
  prop,
  optionalProp,
  children,
  onClick
}: ComponentNameProps) {
  // ============================================================================
  // HOOKS
  // ============================================================================
  // const [state, setState] = useState(initialState);
  // const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
  // const memoizedCallback = useCallback(() => { doSomething(a, b); }, [a, b]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  // const handleClick = () => {
  //   onClick?.();
  // };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="component-name" onClick={onClick}>
      {prop}
      {children}
    </div>
  );
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Memoized component to prevent unnecessary re-renders
 * Remove if component always needs to re-render when parent updates
 */
export default memo(ComponentName);

// ============================================================================
// STYLES (if using CSS Modules or styled-components)
// ============================================================================

// CSS Modules example:
// import styles from './ComponentName.module.css';
// return <div className={styles.container}>...</div>;

// styled-components example:
// import styled from 'styled-components';
// const Container = styled.div`...`;
// return <Container>...</Container>;

// ============================================================================
// EXPORTS
// ============================================================================

// Export type for reuse
export type { ComponentNameProps };

// ============================================================================
// TESTING (create ComponentName.test.tsx)
// ============================================================================

/**
 * @example
 * ```tsx
 * import { render, screen } from '@testing-library/react';
 * import { ComponentName } from './ComponentName';
 *
 * describe('ComponentName', () => {
 *   it('renders the prop value', () => {
 *     render(<ComponentName prop="test" />);
 *     expect(screen.getByText('test')).toBeInTheDocument();
 *   });
 *
 *   it('calls onClick when clicked', async () => {
 *     const handleClick = vi.fn();
 *     const user = userEvent.setup();
 *     render(<ComponentName prop="test" onClick={handleClick} />);
 *     await user.click(screen.getByText('test'));
 *     expect(handleClick).toHaveBeenCalledTimes(1);
 *   });
 * });
 * ```
 */
