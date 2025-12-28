import React from 'react';
import StatusBadge from './StatusBadge';
import { Flight } from '@/shared/types';
import { formatTime, isFlightDelayed, isFlightLive } from '@/shared/utils';

/**
 * FlightGrid Props
 */
interface FlightGridProps {
  /** Array of flights to display */
  flights: Flight[];
  /** Flight selection handler */
  onFlightSelect: (flight: Flight) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FlightGrid Component
 *
 * Displays flights in a table/grid view format.
 * Optimized with React.memo for performance.
 *
 * @example
 * ```tsx
 * <FlightGrid flights={flights} onFlightSelect={setSelectedFlight} />
 * ```
 */
const FlightGrid = React.memo<FlightGridProps>(({ flights, onFlightSelect, className = '' }) => {
  return (
    <div className={`glass-strong rounded-2xl overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="border-b border-white/5">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-2">Flight</div>
          <div className="col-span-3">Route</div>
          <div className="col-span-2">Departure</div>
          <div className="col-span-2">Arrival</div>
          <div className="col-span-1">Gate</div>
          <div className="col-span-2">Status</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-white/5">
        {flights.map((flight, index) => {
          const isDelayed = isFlightDelayed(flight);
          const isLive = isFlightLive(flight);

          return (
            <div
              key={flight.id || `${flight.flightNumber}-${index}`}
              onClick={() => onFlightSelect(flight)}
              className="group grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.02] cursor-pointer transition-all duration-300 items-center animate-slide-up"
              style={{ animationDelay: `${Math.min(index * 0.03, 0.2)}s` }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFlightSelect(flight);
                }
              }}
              aria-label={`View details for flight ${flight.flightNumber} from ${flight.origin} to ${flight.destination}`}
            >
              {/* Flight Number & Airline */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white font-mono tracking-wider">
                    {flight.flightNumber}
                  </span>
                  {isLive && (
                    <span className="relative flex h-2 w-2" aria-live="polite" aria-label="Flight in progress">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"
                        aria-hidden="true"
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500">{flight.airline}</div>
              </div>

              {/* Route */}
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="font-bold text-slate-900 dark:text-white text-lg">{flight.origin}</span>
                    <div className="text-xs text-slate-500 max-w-[60px] truncate">{flight.originCity}</div>
                  </div>

                  <div className="flex-1 relative h-4 mx-2" aria-hidden="true">
                    {/* Line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" />
                    {/* Plane icon - centered */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center bg-theme-primary">
                      <svg
                        className="w-4 h-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ transform: 'rotate(90deg)' }}
                      >
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="font-bold text-slate-900 dark:text-white text-lg">
                      {flight.destination}
                    </span>
                    <div className="text-xs text-slate-500 max-w-[60px] truncate">
                      {flight.destinationCity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Departure */}
              <div className="col-span-2">
                <div
                  className={`font-semibold font-mono text-lg ${
                    isDelayed ? 'text-amber-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatTime(flight.actualDeparture || flight.scheduledDeparture)}
                </div>
                {isDelayed && flight.delayMinutes > 0 && (
                  <div
                    className="flex items-center gap-1 text-xs text-amber-400/80"
                    aria-label={`Delayed by ${flight.delayMinutes} minutes`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    +{flight.delayMinutes}m
                  </div>
                )}
              </div>

              {/* Arrival */}
              <div className="col-span-2">
                <div
                  className={`font-semibold font-mono text-lg ${
                    flight.status === 'CANCELLED' ? 'text-red-400 line-through' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatTime(flight.actualArrival || flight.scheduledArrival)}
                </div>
              </div>

              {/* Gate */}
              <div className="col-span-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-mono font-semibold bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">
                  {flight.gate || '—'}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center justify-between">
                <StatusBadge status={flight.status} size="sm" />

                {/* Hover arrow */}
                <svg
                  className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

FlightGrid.displayName = 'FlightGrid';

export default FlightGrid;
