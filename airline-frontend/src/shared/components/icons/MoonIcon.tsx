import React from 'react';

/**
 * MoonIcon Component
 * SVG icon for dark mode/night theme
 */
interface MoonIconProps {
  className?: string;
}

const MoonIcon = React.memo<MoonIconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
));

MoonIcon.displayName = 'MoonIcon';

export default MoonIcon;
