import { Flight, FlightStatus, RecentEvent } from './flight.types';

/**
 * View mode options for flight list display
 */
export type ViewMode = 'card' | 'grid';

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Stat pill color options
 */
export type StatPillColor = 'slate' | 'emerald' | 'cyan' | 'violet' | 'amber' | 'red' | 'teal' | 'white';

/**
 * FlightCard component props
 */
export interface FlightCardProps {
  /** Flight data to display */
  flight: Flight;
  /** Click handler */
  onClick: () => void;
}

/**
 * FlightList component props
 */
export interface FlightListProps {
  /** Array of flights to display */
  flights: Flight[];
  /** Display mode (card or grid) */
  viewMode: ViewMode;
  /** Loading state indicator */
  isLoading: boolean;
  /** Flight selection handler */
  onFlightSelect: (flight: Flight | null) => void;
}

/**
 * FlightDetails component props
 */
export interface FlightDetailsProps {
  /** Flight to show details for */
  flight: Flight;
  /** Close modal handler */
  onClose: () => void;
}

/**
 * StatusBadge component props
 */
export interface StatusBadgeProps {
  /** Flight status to display */
  status: FlightStatus;
  /** Optional custom className */
  className?: string;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * ViewToggle component props
 */
export interface ViewToggleProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** View change handler */
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * EventTicker component props
 */
export interface EventTickerProps {
  /** Array of recent events to display */
  events: RecentEvent[];
  /** Maximum number of events to show (default: 5) */
  maxEvents?: number;
}

/**
 * StatPill component props
 */
export interface StatPillProps {
  /** Label to display */
  label: string;
  /** Count/value to display */
  value: number;
  /** Color theme */
  color?: StatPillColor;
  /** Active state */
  active: boolean;
  /** Click handler */
  onClick: () => void;
}

/**
 * ChatPanel component props
 */
export interface ChatPanelProps {
  /** Panel open state */
  isOpen: boolean;
  /** Toggle handler */
  onToggle: () => void;
}

/**
 * ErrorBoundary component props
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Fallback component for error state */
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * ErrorBoundary state
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
}

/**
 * App component props (if externalized)
 */
export interface AppProps {
  /** Initial theme mode */
  initialTheme?: ThemeMode;
}
