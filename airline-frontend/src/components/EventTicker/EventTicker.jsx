import { useState, useEffect, useRef } from 'react';

function EventTicker({ events }) {
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef(null);

  if (!events || events.length === 0) return null;

  const getEventConfig = (eventType) => {
    const configs = {
      CANCELLATION: { icon: '✕', label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
      DELAY: { icon: '⏱️', label: 'Delayed', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
      GATE_CHANGE: { icon: '🚪', label: 'Gate Change', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
      BOARDING_STARTED: { icon: '🎫', label: 'Boarding', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      DEPARTED: { icon: '🛫', label: 'Departed', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
      ARRIVED: { icon: '🛬', label: 'Arrived', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    };
    return configs[eventType] || { icon: '📋', label: 'Update', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Duplicate events for seamless loop
  const displayEvents = [...events.slice(0, 10), ...events.slice(0, 10)];

  return (
    <div className="relative overflow-hidden border-y border-theme bg-theme-secondary">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent z-10 pointer-events-none" />
      
      <div className="py-3 px-4">
        <div className="flex items-center">
          {/* Live badge */}
          <div className="flex-shrink-0 flex items-center gap-2 mr-6 pr-6 border-r border-theme">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Live Updates</span>
          </div>

          {/* Scrolling ticker */}
          <div 
            className="flex-1 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div 
              ref={tickerRef}
              className={`flex items-center gap-6 ${isPaused ? '' : 'animate-ticker'}`}
              style={{ width: 'fit-content' }}
            >
              {displayEvents.map((event, index) => {
                const config = getEventConfig(event.eventType);
                return (
                  <div
                    key={`${event.id || index}-${index}`}
                    className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${config.bg} ${config.border} flex-shrink-0 transition-transform hover:scale-105`}
                  >
                    <span className="text-sm">{config.icon}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{event.flightNumber}</span>
                      <span className={`text-sm ${config.color}`}>
                        {event.description || config.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{formatTime(event.eventTimestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventTicker;
