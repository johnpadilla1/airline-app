import React, { useCallback } from 'react';
import { ViewMode } from '@/shared/types';

/**
 * Icon component props
 */
interface IconProps {
  className?: string;
}

/**
 * Grid Icon Component
 */
const GridIcon = React.memo<IconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
));
GridIcon.displayName = 'GridIcon';

/**
 * List Icon Component
 */
const ListIcon = React.memo<IconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
  </svg>
));
ListIcon.displayName = 'ListIcon';

/**
 * ViewToggle Props
 */
interface ViewToggleProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onToggle: (mode: ViewMode) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ViewToggle Component
 *
 * Allows users to toggle between card and grid/list view modes.
 * Memoized for performance optimization.
 *
 * @example
 * ```tsx
 * <ViewToggle viewMode="card" onToggle={setViewMode} />
 * ```
 */
const ViewToggle = React.memo<ViewToggleProps>(({ viewMode, onToggle, className = '' }) => {
  const handleCardView = useCallback(() => {
    onToggle('card');
  }, [onToggle]);

  const handleGridView = useCallback(() => {
    onToggle('grid');
  }, [onToggle]);

  return (
    <div className={`flex items-center glass-strong rounded-xl p-1 ${className}`} role="group" aria-label="View mode toggle">
      <button
        onClick={handleCardView}
        className={`p-2.5 rounded-lg transition-all ${
          viewMode === 'card'
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Card View"
        aria-pressed={viewMode === 'card'}
        aria-label="Card view"
        type="button"
      >
        <GridIcon />
      </button>
      <button
        onClick={handleGridView}
        className={`p-2.5 rounded-lg transition-all ${
          viewMode === 'grid'
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
            : 'text-slate-400 hover:text-white'
        }`}
        title="List View"
        aria-pressed={viewMode === 'grid'}
        aria-label="List view"
        type="button"
      >
        <ListIcon />
      </button>
    </div>
  );
});

ViewToggle.displayName = 'ViewToggle';

export default ViewToggle;
