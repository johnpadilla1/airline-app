import React from 'react';

/**
 * RefreshIcon Component
 * SVG icon for refresh/reload action with optional spinning animation
 */
interface RefreshIconProps {
  className?: string;
  spinning?: boolean;
}

const RefreshIcon = React.memo<RefreshIconProps>(({ className = 'w-5 h-5', spinning = false }) => (
  <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12a9 9 0 11-2.2-5.9M21 3v6h-6" />
  </svg>
));

RefreshIcon.displayName = 'RefreshIcon';

export default RefreshIcon;
