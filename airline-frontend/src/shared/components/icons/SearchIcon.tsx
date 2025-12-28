import React from 'react';

/**
 * SearchIcon Component
 * SVG icon for search functionality
 */
interface SearchIconProps {
  className?: string;
}

const SearchIcon = React.memo<SearchIconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
));

SearchIcon.displayName = 'SearchIcon';

export default SearchIcon;
