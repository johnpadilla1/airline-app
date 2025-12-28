import { Flight, FlightStatus, FlightStats } from '@/shared/types';

/**
 * Get the accent color class for a flight status
 * @param status - Flight status
 * @returns Tailwind gradient class string
 */
export function getFlightStatusAccentColor(status: FlightStatus): string {
  const colors: Record<FlightStatus, string> = {
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
}

/**
 * Get status text display with proper formatting
 * @param status - Flight status
 * @returns Formatted status string
 */
export function getStatusDisplayText(status: FlightStatus): string {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Check if a flight is considered "live" (in the air)
 * @param flight - Flight object
 * @returns True if flight is in progress
 */
export function isFlightLive(flight: Flight): boolean {
  return flight.status === FlightStatus.IN_FLIGHT || flight.status === FlightStatus.DEPARTED;
}

/**
 * Check if a flight is delayed
 * @param flight - Flight object
 * @returns True if flight has any delay indicators
 */
export function isFlightDelayed(flight: Flight): boolean {
  return flight.status === FlightStatus.DELAYED || flight.delayMinutes > 0;
}

/**
 * Check if a flight is cancelled
 * @param flight - Flight object
 * @returns True if flight is cancelled
 */
export function isFlightCancelled(flight: Flight): boolean {
  return flight.status === FlightStatus.CANCELLED;
}

/**
 * Check if flight should match a status filter
 * Handles compound status logic (e.g., "IN_FLIGHT" matches both IN_FLIGHT and DEPARTED)
 * @param flight - Flight object
 * @param statusFilter - Status to filter by
 * @returns True if flight matches the filter
 */
export function flightMatchesStatusFilter(
  flight: Flight,
  statusFilter: FlightStatus | 'all'
): boolean {
  if (statusFilter === 'all') return true;
  if (flight.status === statusFilter) return true;

  // Compound status filters
  if (statusFilter === FlightStatus.IN_FLIGHT) {
    return flight.status === FlightStatus.IN_FLIGHT || flight.status === FlightStatus.DEPARTED;
  }

  if (statusFilter === FlightStatus.LANDED) {
    return flight.status === FlightStatus.LANDED || flight.status === FlightStatus.ARRIVED;
  }

  return false;
}

/**
 * Filter flights by search query
 * Searches across flight number, origin, destination, and airline
 * @param flights - Array of flights
 * @param searchQuery - Search query string
 * @returns Filtered array of flights
 */
export function filterFlightsBySearch(flights: Flight[], searchQuery: string): Flight[] {
  if (!searchQuery.trim()) return flights;

  const query = searchQuery.toLowerCase();

  return flights.filter((flight) => {
    return (
      flight.flightNumber?.toLowerCase().includes(query) ||
      flight.origin?.toLowerCase().includes(query) ||
      flight.destination?.toLowerCase().includes(query) ||
      flight.airline?.toLowerCase().includes(query)
    );
  });
}

/**
 * Filter flights by status
 * @param flights - Array of flights
 * @param statusFilter - Status filter
 * @returns Filtered array of flights
 */
export function filterFlightsByStatus(
  flights: Flight[],
  statusFilter: FlightStatus | 'all'
): Flight[] {
  if (statusFilter === 'all') return flights;

  return flights.filter((flight) => flightMatchesStatusFilter(flight, statusFilter));
}

/**
 * Calculate flight statistics
 * @param flights - Array of flights
 * @returns Flight statistics object
 */
export function calculateFlightStats(flights: Flight[]): FlightStats {
  return {
    total: flights.length,
    onTime: flights.filter((f) => f.status === FlightStatus.ON_TIME).length,
    scheduled: flights.filter((f) => f.status === FlightStatus.SCHEDULED).length,
    boarding: flights.filter((f) => f.status === FlightStatus.BOARDING).length,
    inFlight: flights.filter(
      (f) => f.status === FlightStatus.IN_FLIGHT || f.status === FlightStatus.DEPARTED
    ).length,
    delayed: flights.filter((f) => f.status === FlightStatus.DELAYED).length,
    cancelled: flights.filter((f) => f.status === FlightStatus.CANCELLED).length,
    landed: flights.filter((f) => f.status === FlightStatus.LANDED || f.status === FlightStatus.ARRIVED).length,
  };
}

/**
 * Sort flights by departure time
 * @param flights - Array of flights
 * @param ascending - Sort order (default: ascending)
 * @returns Sorted array of flights
 */
export function sortFlightsByDeparture(flights: Flight[], ascending = true): Flight[] {
  return [...flights].sort((a, b) => {
    const dateA = new Date(a.scheduledDeparture);
    const dateB = new Date(b.scheduledDeparture);
    return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });
}

/**
 * Get unique destinations from flights
 * @param flights - Array of flights
 * @returns Array of unique destination airport codes
 */
export function getUniqueDestinations(flights: Flight[]): string[] {
  const destinations = new Set(flights.map((f) => f.destination));
  return Array.from(destinations).sort();
}

/**
 * Get unique airlines from flights
 * @param flights - Array of flights
 * @returns Array of unique airline names
 */
export function getUniqueAirlines(flights: Flight[]): string[] {
  const airlines = new Set(flights.map((f) => f.airline));
  return Array.from(airlines).sort();
}
