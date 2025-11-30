import { useFlightEvents } from '../../hooks/useFlights';
import StatusBadge from '../StatusBadge/StatusBadge';
import { useEffect } from 'react';

function FlightDetails({ flight, onClose }) {
  const { data: events, isLoading: eventsLoading } = useFlightEvents(flight.flightNumber);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventTypeConfig = (eventType) => {
    const configs = {
      DELAY: { label: 'Flight Delayed', icon: '⏱️', color: 'amber' },
      GATE_CHANGE: { label: 'Gate Changed', icon: '🚪', color: 'sky' },
      CANCELLATION: { label: 'Flight Cancelled', icon: '✕', color: 'red' },
      BOARDING_STARTED: { label: 'Boarding Started', icon: '🎫', color: 'emerald' },
      BOARDING_COMPLETED: { label: 'Boarding Complete', icon: '✓', color: 'emerald' },
      DEPARTED: { label: 'Flight Departed', icon: '🛫', color: 'violet' },
      ARRIVED: { label: 'Flight Arrived', icon: '🛬', color: 'emerald' },
      DIVERTED: { label: 'Flight Diverted', icon: '↪️', color: 'orange' },
      TERMINAL_CHANGE: { label: 'Terminal Changed', icon: '🏢', color: 'sky' },
      TIME_CHANGE: { label: 'Time Changed', icon: '🕐', color: 'slate' },
      STATUS_UPDATE: { label: 'Status Updated', icon: '📋', color: 'slate' },
    };
    return configs[eventType] || { label: eventType?.replace('_', ' '), icon: '📌', color: 'slate' };
  };

  const isDelayed = flight.status === 'DELAYED' || flight.delayMinutes > 0;
  const isLive = flight.status === 'IN_FLIGHT' || flight.status === 'DEPARTED';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative glass-strong rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient accent at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-violet-500 to-purple-500" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
        >
          <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-wider">{flight.flightNumber}</h2>
                  {isLive && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-slate-400">{flight.airline}</p>
              </div>
              <StatusBadge status={flight.status} size="lg" />
            </div>

            {/* Date Display */}
            <div className="text-sm text-slate-500 mb-8">
              {formatDate(flight.scheduledDeparture)}
            </div>

            {/* Route Visualization */}
            <div className="relative">
              <div className="flex items-start justify-between">
                {/* Origin */}
                <div className="text-center w-32">
                  <div className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">{flight.origin}</div>
                  <div className="text-sm text-slate-400 mb-4">{flight.originCity}</div>
                  <div className={`text-2xl font-bold font-mono ${isDelayed ? 'text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatTime(flight.actualDeparture || flight.scheduledDeparture)}
                  </div>
                  {isDelayed && flight.scheduledDeparture !== flight.actualDeparture && (
                    <div className="text-sm text-slate-500 line-through mt-1">
                      {formatTime(flight.scheduledDeparture)}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Departure</div>
                </div>

                {/* Flight Path */}
                <div className="flex-1 px-6 pt-4">
                  <div className="relative h-10">
                    {/* Background track */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-700" />
                    
                    {/* Progress track for live flights */}
                    {isLive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-400" />
                    )}
                    
                    {/* Origin dot */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-700" />
                    
                    {/* Destination dot */}
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full ${flight.status === 'LANDED' || flight.status === 'ARRIVED' ? 'bg-emerald-400' : 'bg-slate-600'} border-2 border-slate-700`} />
                    
                    {/* Plane - perfectly centered */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLive ? 'bg-cyan-500/20 shadow-lg shadow-cyan-500/20' : 'bg-theme-tertiary'}`}>
                        <svg className={`w-5 h-5 ${isLive ? 'text-cyan-400' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(90deg)' }}>
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Duration & Aircraft */}
                  <div className="text-center mt-8">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Aircraft</div>
                    <div className="text-sm text-slate-300">{flight.aircraft || 'Not specified'}</div>
                  </div>
                </div>

                {/* Destination */}
                <div className="text-center w-32">
                  <div className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">{flight.destination}</div>
                  <div className="text-sm text-slate-400 mb-4">{flight.destinationCity}</div>
                  <div className={`text-2xl font-bold font-mono ${flight.status === 'CANCELLED' ? 'text-red-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {formatTime(flight.actualArrival || flight.scheduledArrival)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Arrival</div>
                </div>
              </div>
            </div>

            {/* Delay Warning */}
            {isDelayed && flight.delayMinutes > 0 && (
              <div className="mt-8 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <span className="text-amber-400 font-medium">
                  This flight is delayed by {flight.delayMinutes} minutes
                </span>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-4 gap-4">
              <InfoCard label="Gate" value={flight.gate || '—'} icon="🚪" />
              <InfoCard label="Terminal" value={flight.terminal || '—'} icon="🏢" />
              <InfoCard label="Check-in" value={flight.checkInDesk || '—'} icon="🎫" />
              <InfoCard label="Baggage" value={flight.baggageClaim || '—'} icon="🧳" />
            </div>
          </div>

          {/* Event History */}
          <div className="px-8 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="12 8 12 12 14 14" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Flight Timeline</h3>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-700" />
                
                <div className="space-y-4">
                  {events.map((event, index) => {
                    const config = getEventTypeConfig(event.eventType);
                    return (
                      <div
                        key={event.id || index}
                        className="relative pl-12 animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-2 top-2 w-4 h-4 rounded-full bg-${config.color}-500/20 border-2 border-${config.color}-500 flex items-center justify-center`}>
                          <div className={`w-1.5 h-1.5 rounded-full bg-${config.color}-400`} />
                        </div>
                        
                        <div className="glass rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{config.icon}</span>
                              <span className="font-medium text-slate-900 dark:text-white">{config.label}</span>
                            </div>
                            <span className="text-xs text-slate-500">{formatDateTime(event.eventTimestamp)}</span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                          )}
                          {event.previousValue && event.newValue && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-400">{event.previousValue}</span>
                              <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">{event.newValue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-500">No events recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Card Sub-component
function InfoCard({ label, value, icon }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div className="text-xl mb-2">{icon}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{value}</div>
    </div>
  );
}

export default FlightDetails;
