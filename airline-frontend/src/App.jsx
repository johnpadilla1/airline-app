import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFlights, useRecentEvents } from './hooks/useFlights';
import FlightList from './components/FlightList/FlightList';
import FlightDetails from './components/FlightDetails/FlightDetails';
import ViewToggle from './components/ViewToggle/ViewToggle';
import EventTicker from './components/EventTicker/EventTicker';
import ChatPanel from './components/ChatPanel/ChatPanel';

// Elegant SVG Icons - Fixed airplane that looks like actual airplane
const PlaneIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);

// Theme toggle icons
const SunIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const LiveIcon = () => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
  </span>
);

const GridIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ListIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5", spinning = false }) => (
  <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-2.2-5.9M21 3v6h-6" />
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

function App() {
  const [viewMode, setViewMode] = useState('card');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  
  const { flights = [], isLoading, isError, error, refetch } = useFlights();
  const { data: recentEvents = [] } = useRecentEvents();
  const queryClient = useQueryClient();

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // SSE Connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream');
    
    eventSource.onopen = () => {
      setSseConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'FLIGHT_UPDATE') {
        queryClient.invalidateQueries(['flights']);
        queryClient.invalidateQueries(['recentEvents']);
        setLastUpdate(new Date());
      }
    };
    
    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => eventSource.close();
  }, [queryClient]);

  // Filter flights
  const filteredFlights = flights.filter(flight => {
    const matchesSearch = !searchQuery || 
      flight.flightNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.airline?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle compound status filters
    let matchesStatus = statusFilter === 'all' || flight.status === statusFilter;
    
    // "In Flight" filter should match both IN_FLIGHT and DEPARTED
    if (statusFilter === 'IN_FLIGHT') {
      matchesStatus = flight.status === 'IN_FLIGHT' || flight.status === 'DEPARTED';
    }
    // "Landed" filter should match both LANDED and ARRIVED
    if (statusFilter === 'LANDED') {
      matchesStatus = flight.status === 'LANDED' || flight.status === 'ARRIVED';
    }
    
    return matchesSearch && matchesStatus;
  });

  // Stats calculation
  const stats = {
    total: flights.length,
    onTime: flights.filter(f => f.status === 'ON_TIME').length,
    scheduled: flights.filter(f => f.status === 'SCHEDULED').length,
    boarding: flights.filter(f => f.status === 'BOARDING').length,
    inFlight: flights.filter(f => f.status === 'IN_FLIGHT' || f.status === 'DEPARTED').length,
    delayed: flights.filter(f => f.status === 'DELAYED').length,
    cancelled: flights.filter(f => f.status === 'CANCELLED').length,
    landed: flights.filter(f => f.status === 'LANDED' || f.status === 'ARRIVED').length,
  };

  const handleRefresh = useCallback(() => {
    refetch();
    setLastUpdate(new Date());
  }, [refetch]);

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-12 text-center max-w-md animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Connection Lost</h2>
          <p className="text-slate-400 mb-8">{error?.message || 'Unable to connect to flight data service'}</p>
          <button onClick={handleRefresh} className="btn-primary px-8 py-3 text-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle noise overlay for texture */}
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-t-0 border-x-0">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20">
                  <PlaneIcon className="w-7 h-7 text-white transform rotate-45" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-theme-primary tracking-tight">SkyTrack</h1>
                <p className="text-xs text-theme-muted font-medium">Global Flight Intelligence</p>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search flights, routes, airlines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '60px' }}
                  className="input-glass w-full pr-4 py-3 rounded-xl text-theme-primary placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Live Status */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <LiveIcon />
                <span className="text-sm font-medium text-emerald-400">Live</span>
              </div>

              {/* Last Update */}
              <div className="hidden lg:block text-sm text-slate-400 px-3">
                Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-glass p-3 rounded-xl hover:bg-white/10"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-slate-600" />}
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="btn-glass p-3 rounded-xl hover:bg-white/10"
                title="Refresh"
              >
                <RefreshIcon className="w-5 h-5" spinning={isLoading} />
              </button>

              {/* View Toggle */}
              <div className="flex items-center glass-strong rounded-xl p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  title="Card View"
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  title="List View"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Event Ticker */}
      <EventTicker events={recentEvents} />

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Stats Dashboard - Clean & Minimal */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8">
          <StatPill label="All" value={stats.total} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <StatPill label="On Time" value={stats.onTime} color="emerald" active={statusFilter === 'ON_TIME'} onClick={() => setStatusFilter(statusFilter === 'ON_TIME' ? 'all' : 'ON_TIME')} />
          <StatPill label="Scheduled" value={stats.scheduled} color="slate" active={statusFilter === 'SCHEDULED'} onClick={() => setStatusFilter(statusFilter === 'SCHEDULED' ? 'all' : 'SCHEDULED')} />
          <StatPill label="Boarding" value={stats.boarding} color="cyan" active={statusFilter === 'BOARDING'} onClick={() => setStatusFilter(statusFilter === 'BOARDING' ? 'all' : 'BOARDING')} />
          <StatPill label="In Flight" value={stats.inFlight} color="violet" active={statusFilter === 'IN_FLIGHT'} onClick={() => setStatusFilter(statusFilter === 'IN_FLIGHT' ? 'all' : 'IN_FLIGHT')} />
          <StatPill label="Delayed" value={stats.delayed} color="amber" active={statusFilter === 'DELAYED'} onClick={() => setStatusFilter(statusFilter === 'DELAYED' ? 'all' : 'DELAYED')} />
          <StatPill label="Cancelled" value={stats.cancelled} color="red" active={statusFilter === 'CANCELLED'} onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? 'all' : 'CANCELLED')} />
          <StatPill label="Landed" value={stats.landed} color="white" active={statusFilter === 'LANDED'} onClick={() => setStatusFilter(statusFilter === 'LANDED' ? 'all' : 'LANDED')} />
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search flights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '60px' }}
              className="input-glass w-full pr-4 py-3 rounded-xl text-theme-primary placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Active Filter Indicator */}
        {(statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-3 mb-6 animate-slide-up">
            <span className="text-sm text-slate-400">Showing:</span>
            {statusFilter !== 'all' && (
              <button 
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
              >
                {statusFilter.replace('_', ' ')}
                <span className="text-slate-300">×</span>
              </button>
            )}
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-colors"
              >
                "{searchQuery}"
                <span className="text-violet-300">×</span>
              </button>
            )}
            <button 
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white">
            {filteredFlights.length} Flight{filteredFlights.length !== 1 ? 's' : ''}
            {filteredFlights.length !== flights.length && <span className="text-slate-500 font-normal"> of {flights.length}</span>}
          </h2>
        </div>

        {/* Flight List */}
        <FlightList
          flights={filteredFlights}
          viewMode={viewMode}
          isLoading={isLoading}
          onFlightSelect={setSelectedFlight}
        />

        {/* Empty State */}
        {!isLoading && filteredFlights.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
              <PlaneIcon className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No flights found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
            <button 
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              className="btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Flight Details Modal */}
      {selectedFlight && (
        <FlightDetails
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}

      {/* AI Chat Panel */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />

      {/* Footer */}
      <footer className="mt-auto py-8 text-center">
        <p className="text-sm text-slate-600">
          Real-time flight data powered by Kafka • Built with ❤️
        </p>
      </footer>
    </div>
  );
}

// Clean Stats Pill Component
function StatPill({ label, value, color = 'slate', active, onClick }) {
  const colors = {
    slate: { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300', activeBg: 'bg-slate-100 dark:bg-slate-800' },
    emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-50 dark:bg-emerald-500/20' },
    cyan: { dot: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', activeBg: 'bg-cyan-50 dark:bg-cyan-500/20' },
    violet: { dot: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', activeBg: 'bg-violet-50 dark:bg-violet-500/20' },
    amber: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-50 dark:bg-amber-500/20' },
    red: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', activeBg: 'bg-red-50 dark:bg-red-500/20' },
    teal: { dot: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', activeBg: 'bg-teal-50 dark:bg-teal-500/20' },
    white: { dot: 'bg-white dark:bg-slate-300', text: 'text-slate-600 dark:text-slate-300', activeBg: 'bg-slate-100 dark:bg-slate-700' },
  };

  const style = colors[color];

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200 border
        ${active 
          ? `${style.activeBg} ${style.text} border-current/30 shadow-sm` 
          : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10'
        }
      `}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
      <span>{label}</span>
      <span className={`font-bold ${active ? '' : 'text-slate-900 dark:text-white'}`}>{value}</span>
    </button>
  );
}

export default App;
