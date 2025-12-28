import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFlights, useRecentEvents } from '@/features/flights/hooks/useFlights';
import FlightList from '@/features/flights/components/FlightList';
import FlightDetails from '@/features/flights/components/FlightDetails';
import ChatPanel from '@/features/chat/components/ChatPanel';
import EventTicker from '@/features/events/components/EventTicker';
import { PlaneIcon, SunIcon, MoonIcon, RefreshIcon, SearchIcon } from '@/shared/components/icons';
import StatPill from '@/shared/components/StatPill';
import { Flight, ViewMode, FlightStatus, FlightStats } from '@/shared/types';
import { filterFlightsBySearch, filterFlightsByStatus, calculateFlightStats } from '@/shared/utils';

const { SCHEDULED, ON_TIME, BOARDING, IN_FLIGHT, DELAYED, CANCELLED, LANDED } = FlightStatus;

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
