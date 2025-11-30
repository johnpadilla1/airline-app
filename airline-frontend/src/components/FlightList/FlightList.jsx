import FlightCard from './FlightCard';
import FlightGrid from './FlightGrid';

function FlightList({ flights, viewMode, isLoading, onFlightSelect }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center animate-fade-in">
          {/* Premium loading spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-theme"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-slate-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-slate-300 animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
          </div>
          <p className="text-theme-secondary font-medium">Loading flight data...</p>
        </div>
      </div>
    );
  }

  if (!flights || flights.length === 0) {
    return null; // App.jsx handles empty state
  }

  if (viewMode === 'grid') {
    return <FlightGrid flights={flights} onFlightSelect={onFlightSelect} />;
  }

  // Card View - with stagger animation
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
      {flights.map((flight, index) => (
        <div 
          key={flight.id} 
          className="animate-slide-up"
          style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
        >
          <FlightCard
            flight={flight}
            onClick={() => onFlightSelect(flight)}
          />
        </div>
      ))}
    </div>
  );
}

export default FlightList;
