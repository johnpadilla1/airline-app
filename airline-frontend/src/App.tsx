import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFlights, useRecentEvents } from '@/features/flights/hooks/useFlights';
import FlightList from '@/features/flights/components/FlightList';
import FlightDetails from '@/features/flights/components/FlightDetails';
import ChatPanel from '@/features/chat/components/ChatPanel';
import EventTicker from '@/features/events/components/EventTicker';
import { Flight, ViewMode, FlightStatus, FlightStats, StatPillProps } from '@/shared/types';
import { filterFlightsBySearch, filterFlightsByStatus, calculateFlightStats } from '@/shared/utils';

const { SCHEDULED, ON_TIME, BOARDING, IN_FLIGHT, DELAYED, CANCELLED, LANDED } = FlightStatus;

/**
 * SVG Icon Components
 */

interface PlaneIconProps {
  className?: string;
}

const PlaneIcon = React.memo<PlaneIconProps>(({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
));
PlaneIcon.displayName = 'PlaneIcon';

const SunIcon = React.memo<PlaneIconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
));
SunIcon.displayName = 'SunIcon';

const MoonIcon = React.memo<PlaneIconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
));
MoonIcon.displayName = 'MoonIcon';

const RefreshIcon = React.memo<PlaneIconProps & { spinning?: boolean }>(({ className = 'w-5 h-5', spinning = false }) => (
  <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12a9 9 0 11-2.2-5.9M21 3v6h-6" />
  </svg>
));
RefreshIcon.displayName = 'RefreshIcon';

const SearchIcon = React.memo<PlaneIconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
));
SearchIcon.displayName = 'SearchIcon';

/**
 * StatPill Component - Status filter button
 */
const StatPill = React.memo<StatPillProps>(({ label, value, color = 'slate', active, onClick }) => {
  const style: { dot: string; text: string; activeBg: string } = {
    slate: {
      dot: 'bg-slate-400',
      text: 'text-slate-600 dark:text-slate-300',
      activeBg: 'bg-slate-100 dark:bg-slate-800',
    },
    emerald: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-500/20',
    },
    cyan: {
      dot: 'bg-cyan-500',
      text: 'text-cyan-600 dark:text-cyan-400',
      activeBg: 'bg-cyan-50 dark:bg-cyan-500/20',
    },
    violet: {
      dot: 'bg-violet-500',
      text: 'text-violet-600 dark:text-violet-400',
      activeBg: 'bg-violet-50 dark:bg-violet-500/20',
    },
    amber: {
      dot: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-50 dark:bg-amber-500/20',
    },
    red: {
      dot: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      activeBg: 'bg-red-50 dark:bg-red-500/20',
    },
    teal: {
      dot: 'bg-teal-500',
      text: 'text-teal-600 dark:text-teal-400',
      activeBg: 'bg-teal-50 dark:bg-teal-500/20',
    },
    white: {
      dot: 'bg-white dark:bg-slate-300',
      text: 'text-slate-600 dark:text-slate-300',
      activeBg: 'bg-slate-100 dark:bg-slate-700',
    },
  }[color] || {
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-300',
    activeBg: 'bg-slate-100 dark:bg-slate-800',
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200 border
        ${active ? `${style.activeBg} ${style.text} border-current/30 shadow-sm` : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10'}
      `}
      aria-pressed={active}
      aria-label={`Filter by ${label}: ${value} flights`}
      type="button"
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{label}</span>
      <span className={`font-bold ${active ? '' : 'text-slate-900 dark:text-white'}`}>{value}</span>
    </button>
  );
});
StatPill.displayName = 'StatPill';

/**
 * App Component
 *
 * Main application component with flight tracking, filtering, and AI chat assistant.
 * Implements React best practices including performance optimization and accessibility.
 */
function App() {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlightStatus | 'all'>('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // React Query hooks
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

  // SSE Connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/flights/stream');

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'FLIGHT_UPDATE') {
        queryClient.invalidateQueries({ queryKey: ['flights'] });
        queryClient.invalidateQueries({ queryKey: ['recentEvents'] });
        setLastUpdate(new Date());
      }
    };

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => eventSource.close();
  }, [queryClient]);

  // Filter flights (memoized for performance)
  const filteredFlights = useMemo(() => {
    const bySearch = filterFlightsBySearch(flights, searchQuery);
    const byStatus = filterFlightsByStatus(bySearch, statusFilter);
    return byStatus;
  }, [flights, searchQuery, statusFilter]);

  // Stats calculation (memoized)
  const stats: FlightStats = useMemo(() => calculateFlightStats(flights), [flights]);

  // Event handlers (useCallback for performance)
  const handleRefresh = useCallback(() => {
    refetch();
    setLastUpdate(new Date());
  }, [refetch]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleFlightSelect = useCallback((flight: Flight | null) => {
    setSelectedFlight(flight);
  }, []);

  const handleStatusFilter = useCallback((status: FlightStatus | 'all') => {
    setStatusFilter((current) => (current === status ? 'all' : status));
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
  }, []);

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" role="alert" aria-live="assertive">
        <div className="glass-strong rounded-3xl p-12 text-center max-w-md animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Connection Lost</h2>
          <p className="text-slate-400 mb-8">{error?.message || 'Unable to connect to flight data service'}</p>
          <button onClick={handleRefresh} className="btn-primary px-8 py-3 text-lg" type="button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle noise overlay for texture */}
      <div className="noise-overlay" aria-hidden="true" />

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
                  aria-label="Search flights"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Live Status */}
              {sseConnected && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20" aria-live="polite">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" aria-hidden="true" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-emerald-400">Live</span>
                </div>
              )}

              {/* Last Update */}
              <div className="hidden lg:block text-sm text-slate-400 px-3">
                Updated <time dateTime={lastUpdate.toISOString()}>{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-glass p-3 rounded-xl hover:bg-white/10"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                type="button"
              >
                {isDarkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-slate-600" />}
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="btn-glass p-3 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
                aria-label="Refresh flight data"
                type="button"
              >
                <RefreshIcon spinning={isLoading} />
              </button>

              {/* View Toggle */}
              <div className="flex items-center glass-strong rounded-xl p-1" role="group" aria-label="View mode">
                <button
                  onClick={() => handleViewModeChange('card')}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === 'card' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Card View"
                  aria-pressed={viewMode === 'card'}
                  type="button"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="List View"
                  aria-pressed={viewMode === 'grid'}
                  type="button"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                  </svg>
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
        {/* Stats Dashboard */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8" role="group" aria-label="Flight status filters">
          <StatPill label="All" value={stats.total} active={statusFilter === 'all'} onClick={() => handleStatusFilter('all')} />
          <StatPill label="On Time" value={stats.onTime} color="emerald" active={statusFilter === ON_TIME} onClick={() => handleStatusFilter(ON_TIME)} />
          <StatPill label="Scheduled" value={stats.scheduled} color="slate" active={statusFilter === SCHEDULED} onClick={() => handleStatusFilter(SCHEDULED)} />
          <StatPill label="Boarding" value={stats.boarding} color="cyan" active={statusFilter === BOARDING} onClick={() => handleStatusFilter(BOARDING)} />
          <StatPill label="In Flight" value={stats.inFlight} color="violet" active={statusFilter === IN_FLIGHT} onClick={() => handleStatusFilter(IN_FLIGHT)} />
          <StatPill label="Delayed" value={stats.delayed} color="amber" active={statusFilter === DELAYED} onClick={() => handleStatusFilter(DELAYED)} />
          <StatPill label="Cancelled" value={stats.cancelled} color="red" active={statusFilter === CANCELLED} onClick={() => handleStatusFilter(CANCELLED)} />
          <StatPill label="Landed" value={stats.landed} color="white" active={statusFilter === LANDED} onClick={() => handleStatusFilter(LANDED)} />
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
              aria-label="Search flights"
            />
          </div>
        </div>

        {/* Active Filter Indicator */}
        {(statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-3 mb-6 animate-slide-up">
            <span className="text-sm text-slate-400">Showing:</span>
            {statusFilter !== 'all' && (
              <button
                onClick={() => handleStatusFilter('all')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
                type="button"
              >
                {statusFilter.replace('_', ' ')}
                <span className="text-slate-300">×</span>
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-colors"
                type="button"
              >
                "{searchQuery}"
                <span className="text-violet-300">×</span>
              </button>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm text-slate-500 hover:text-white transition-colors"
              type="button"
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
        <FlightList flights={filteredFlights} viewMode={viewMode} isLoading={isLoading} onFlightSelect={handleFlightSelect} />

        {/* Empty State */}
        {!isLoading && filteredFlights.length === 0 && (
          <div className="text-center py-20 animate-fade-in" role="status">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
              <PlaneIcon className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No flights found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
            <button onClick={handleClearFilters} className="btn-primary" type="button">
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Flight Details Modal */}
      {selectedFlight && <FlightDetails flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}

      {/* AI Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen((prev) => !prev)} />

      {/* Footer */}
      <footer className="mt-auto py-8 text-center">
        <p className="text-sm text-slate-600">
          Real-time flight data powered by Kafka • Built with ❤️
        </p>
      </footer>
    </div>
  );
}

export default App;
