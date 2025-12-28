import React from 'react';

/**
 * PlaneIcon Component
 * SVG icon for airplane/flight representation
 */
interface PlaneIconProps {
  className?: string;
}

const PlaneIcon = React.memo<PlaneIconProps>(({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
));

PlaneIcon.displayName = 'PlaneIcon';

export default PlaneIcon;
