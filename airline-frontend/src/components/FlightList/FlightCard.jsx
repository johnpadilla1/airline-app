import StatusBadge from '../StatusBadge/StatusBadge';

function FlightCard({ flight, onClick }) {
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status-based accent color
  const getAccentColor = (status) => {
    const colors = {
      SCHEDULED: 'from-slate-400 to-slate-500',
      ON_TIME: 'from-emerald-400 to-emerald-500',
      BOARDING: 'from-cyan-400 to-cyan-500',
      DEPARTED: 'from-violet-400 to-violet-500',
      IN_FLIGHT: 'from-cyan-400 to-cyan-500',
      LANDED: 'from-slate-300 to-white',
      ARRIVED: 'from-slate-300 to-white',
      DELAYED: 'from-amber-400 to-amber-500',
      CANCELLED: 'from-red-400 to-red-500',
    };
    return colors[status] || colors.SCHEDULED;
  };

  const isDelayed = flight.status === 'DELAYED' || flight.delayMinutes > 0;
  const isCancelled = flight.status === 'CANCELLED';
  const isLive = flight.status === 'IN_FLIGHT' || flight.status === 'DEPARTED';

  return (
    <div
      onClick={onClick}
      className="group relative glass-strong rounded-2xl overflow-hidden cursor-pointer card-hover h-[350px] flex flex-col"
    >
      {/* Gradient accent line at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getAccentColor(flight.status)} z-10`} />
      
      {/* Live flight indicator */}
      {isLive && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="p-5 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-wider">
                {flight.flightNumber}
              </span>
              <StatusBadge status={flight.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{flight.airline}</p>
          </div>
        </div>
      </div>

      {/* Route Display */}
      <div className="px-5 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Origin */}
          <div className="text-center flex-shrink-0">
            <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{flight.origin}</div>
            <div className="text-xs text-slate-500 mt-1 max-w-[80px] truncate">{flight.originCity}</div>
            <div className={`text-xl font-semibold mt-2 font-mono ${isDelayed ? 'text-amber-500 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {formatTime(flight.actualDeparture || flight.scheduledDeparture)}
            </div>
            {isDelayed && flight.scheduledDeparture !== flight.actualDeparture && (
              <div className="text-xs text-slate-500 line-through">
                {formatTime(flight.scheduledDeparture)}
              </div>
            )}
          </div>

          {/* Flight Path Visualization */}
          <div className="flex-1 mx-4 relative">
            <div className="relative h-8 flex items-center">
              {/* Dashed line */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-slate-300 dark:border-slate-600" />
              
              {/* Progress indicator for in-flight */}
              {isLive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 bg-cyan-400" />
              )}
              
              {/* Plane icon - perfectly centered */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <svg 
                  className={`w-5 h-5 ${isLive ? 'text-cyan-400' : 'text-slate-400'}`} 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ transform: 'rotate(90deg)' }}
                >
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="text-center flex-shrink-0">
            <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{flight.destination}</div>
            <div className="text-xs text-slate-500 mt-1 max-w-[80px] truncate">{flight.destinationCity}</div>
            <div className={`text-xl font-semibold mt-2 font-mono ${isCancelled ? 'text-red-500 dark:text-red-400 line-through' : 'text-slate-900 dark:text-white'}`}>
              {formatTime(flight.actualArrival || flight.scheduledArrival)}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-4">
            {/* Gate */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Gate</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                {flight.gate || '—'}
              </div>
            </div>
            {/* Terminal */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Terminal</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                {flight.terminal || '—'}
              </div>
            </div>
            
            {/* Subtle delay indicator */}
            {isDelayed && flight.delayMinutes > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10" title={`Delayed by ${flight.delayMinutes} minutes`}>
                <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <span className="text-xs font-medium text-amber-400">+{flight.delayMinutes}m</span>
              </div>
            )}
            
            {/* Subtle cancelled indicator */}
            {isCancelled && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10" title="Flight Cancelled">
                <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Date */}
          <div className="text-right">
            <div className="text-xs text-slate-400">
              {formatDate(flight.scheduledDeparture)}
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export default FlightCard;
