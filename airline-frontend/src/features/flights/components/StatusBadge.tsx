import React from 'react';
import { FlightStatus } from '@/shared/types';

/**
 * Status Badge Props
 */
interface StatusBadgeProps {
  /** Flight status to display */
  status: FlightStatus;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status configuration interface
 */
interface StatusConfig {
  label: string;
  className: string;
  dotColor: string;
  pulse?: boolean;
}

/**
 * Size type definition
 */
type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Get status configuration based on flight status
 * @param status - Flight status
 * @returns Status configuration object
 */
function getStatusConfig(status: FlightStatus): StatusConfig {
  switch (status) {
    case 'ON_TIME':
      return {
        label: 'On Time',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dotColor: 'bg-emerald-400',
      };
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        className: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        dotColor: 'bg-slate-400',
      };
    case 'DELAYED':
      return {
        label: 'Delayed',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dotColor: 'bg-amber-400',
        pulse: true,
      };
    case 'BOARDING':
      return {
        label: 'Boarding',
        className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        dotColor: 'bg-cyan-400',
        pulse: true,
      };
    case 'DEPARTED':
      return {
        label: 'Departed',
        className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        dotColor: 'bg-violet-400',
        pulse: true,
      };
    case 'IN_FLIGHT':
      return {
        label: 'In Flight',
        className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        dotColor: 'bg-violet-400',
        pulse: true,
      };
    case 'ARRIVED':
      return {
        label: 'Arrived',
        className: 'bg-white/10 text-slate-300 border-white/20',
        dotColor: 'bg-white',
      };
    case 'LANDED':
      return {
        label: 'Landed',
        className: 'bg-white/10 text-slate-300 border-white/20',
        dotColor: 'bg-white',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
        dotColor: 'bg-red-400',
      };
    default:
      return {
        label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
        className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dotColor: 'bg-slate-400',
      };
  }
}

/**
 * Get size classes for badge
 */
const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

/**
 * Get dot size classes
 */
const DOT_SIZES: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/**
 * StatusBadge Component
 *
 * Displays a flight status as a colored badge with an indicator dot.
 * Memoized for performance optimization.
 *
 * @example
 * ```tsx
 * <StatusBadge status={FlightStatus.ON_TIME} size="md" />
 * ```
 */
const StatusBadge = React.memo<StatusBadgeProps>(
  ({ status, size = 'md', className = '' }) => {
    const config = getStatusConfig(status);
    const sizeClass = SIZE_CLASSES[size];
    const dotSize = DOT_SIZES[size];

    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border uppercase tracking-wider ${config.className} ${sizeClass} ${className}`}
        role="status"
        aria-label={`Flight status: ${config.label}`}
      >
        <span className="relative flex">
          <span className={`${dotSize} rounded-full ${config.dotColor}`} />
          {config.pulse && (
            <span
              className={`absolute inset-0 ${dotSize} rounded-full ${config.dotColor} animate-ping opacity-75`}
              aria-hidden="true"
            />
          )}
        </span>
        <span>{config.label}</span>
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
