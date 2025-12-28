import React, { useState, useCallback, useMemo } from 'react';
import { RecentEvent } from '@/shared/types';
import { formatRelativeTime } from '@/shared/utils';

/**
 * Event configuration interface
 */
interface EventConfig {
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

/**
 * EventTicker Props
 */
interface EventTickerProps {
  /** Array of recent events to display */
  events: RecentEvent[];
  /** Maximum number of events to show (default: 10) */
  maxEvents?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get event configuration based on event type
 * @param eventType - Event type string
 * @returns Event configuration object
 */
function getEventConfig(eventType: string): EventConfig {
  const configs: Record<string, EventConfig> = {
    CANCELLATION: {
      icon: '✕',
      label: 'Cancelled',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    DELAY: {
      icon: '⏱️',
      label: 'Delayed',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    GATE_CHANGE: {
      icon: '🚪',
      label: 'Gate Change',
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
    },
    BOARDING_STARTED: {
      icon: '🎫',
      label: 'Boarding',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    DEPARTED: {
      icon: '🛫',
      label: 'Departed',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    ARRIVED: {
      icon: '🛬',
      label: 'Arrived',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
    },
  };

  return (
    configs[eventType] || {
      icon: '📋',
      label: 'Update',
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
    }
  );
}

/**
 * EventTicker Component
 *
 * Displays a scrolling ticker of recent flight events.
 * Pauses on hover for accessibility.
 * Memoized for performance optimization.
 *
 * @example
 * ```tsx
 * <EventTicker events={recentEvents} maxEvents={10} />
 * ```
 */
const EventTicker = React.memo<EventTickerProps>(({ events, maxEvents = 10, className = '' }) => {
  // Early return BEFORE any hooks
  if (!events || events.length === 0) {
    return null;
  }

  const [isPaused, setIsPaused] = useState(false);

  // Handle pause state for accessibility
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Duplicate events for seamless loop (memoized)
  const displayEvents = useMemo(() => {
    const eventsToShow = events.slice(0, maxEvents);
    return [...eventsToShow, ...eventsToShow];
  }, [events, maxEvents]);

  return (
    <div className={`relative overflow-hidden border-y border-theme bg-theme-secondary ${className}`}>
      {/* Gradient overlays for fade effect */}
      <div
        className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="py-3 px-4">
        <div className="flex items-center">
          {/* Live badge */}
          <div
            className="flex-shrink-0 flex items-center gap-2 mr-6 pr-6 border-r border-theme"
            aria-live="polite"
            aria-label="Live updates"
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                aria-hidden="true"
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
              Live Updates
            </span>
          </div>

          {/* Scrolling ticker */}
          <div
            className="flex-1 overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="region"
            aria-label="Recent flight events"
          >
            <div
              className={`flex items-center gap-6 ${isPaused ? '' : 'animate-ticker'}`}
              style={{ width: 'fit-content' }}
            >
              {displayEvents.map((event, index) => {
                const config = getEventConfig(event.type);
                return (
                  <div
                    key={`${event.id || index}-${index}`}
                    className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${config.bg} ${config.border} flex-shrink-0 transition-transform hover:scale-105`}
                    role="article"
                    aria-label={`${event.flightNumber}: ${config.label}`}
                  >
                    <span className="text-sm" aria-hidden="true">
                      {config.icon}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                        {event.flightNumber}
                      </span>
                      <span className={`text-sm ${config.color}`}>
                        {event.message || config.label}
                      </span>
                    </div>
                    <time className="text-xs text-slate-500" dateTime={event.timestamp}>
                      {formatRelativeTime(event.timestamp)}
                    </time>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

EventTicker.displayName = 'EventTicker';

export default EventTicker;
