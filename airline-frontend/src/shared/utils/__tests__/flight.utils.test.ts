import { FlightStatus } from '@/shared/types';
import {
  getFlightStatusAccentColor,
  getStatusDisplayText,
  isFlightLive,
  isFlightDelayed,
  isFlightCancelled,
  flightMatchesStatusFilter,
  filterFlightsBySearch,
  filterFlightsByStatus,
  calculateFlightStats,
  sortFlightsByDeparture,
  getUniqueDestinations,
  getUniqueAirlines,
} from '../flight.utils';

describe('Flight Utilities', () => {
  const mockFlights = [
    {
      flightNumber: 'AA123',
      airline: 'American Airlines',
      origin: 'JFK',
      originCity: 'New York',
      destination: 'LAX',
      destinationCity: 'Los Angeles',
      status: FlightStatus.ON_TIME,
      scheduledDeparture: '2025-12-28T10:00:00Z',
      actualDeparture: '2025-12-28T10:00:00Z',
      scheduledArrival: '2025-12-28T13:00:00Z',
      actualArrival: null,
      gate: 'A12',
      terminal: 'T4',
      delayMinutes: 0,
      id: '1',
    },
    {
      flightNumber: 'UA456',
      airline: 'United Airlines',
      origin: 'SFO',
      originCity: 'San Francisco',
      destination: 'JFK',
      destinationCity: 'New York',
      status: FlightStatus.DELAYED,
      scheduledDeparture: '2025-12-28T14:00:00Z',
      actualDeparture: null,
      scheduledArrival: '2025-12-28T22:30:00Z',
      actualArrival: null,
      gate: 'B22',
      terminal: 'T7',
      delayMinutes: 30,
      id: '2',
    },
    {
      flightNumber: 'DL789',
      airline: 'Delta Airlines',
      origin: 'LAX',
      originCity: 'Los Angeles',
      destination: 'MIA',
      destinationCity: 'Miami',
      status: FlightStatus.IN_FLIGHT,
      scheduledDeparture: '2025-12-28T08:00:00Z',
      actualDeparture: '2025-12-28T08:05:00Z',
      scheduledArrival: '2025-12-28T16:00:00Z',
      actualArrival: null,
      gate: 'C15',
      terminal: 'T2',
      delayMinutes: 0,
      id: '3',
    },
    {
      flightNumber: 'SW101',
      airline: 'Southwest Airlines',
      origin: 'DEN',
      originCity: 'Denver',
      destination: 'PHX',
      destinationCity: 'Phoenix',
      status: FlightStatus.CANCELLED,
      scheduledDeparture: '2025-12-28T18:00:00Z',
      actualDeparture: null,
      scheduledArrival: '2025-12-28T19:30:00Z',
      actualArrival: null,
      gate: 'D5',
      terminal: 'T1',
      delayMinutes: 0,
      id: '4',
    },
    {
      flightNumber: 'BA202',
      airline: 'British Airways',
      origin: 'LHR',
      originCity: 'London',
      destination: 'JFK',
      destinationCity: 'New York',
      status: FlightStatus.DEPARTED,
      scheduledDeparture: '2025-12-28T06:00:00Z',
      actualDeparture: '2025-12-28T06:10:00Z',
      scheduledArrival: '2025-12-28T09:00:00Z',
      actualArrival: null,
      gate: 'E10',
      terminal: 'T7',
      delayMinutes: 0,
      id: '5',
    },
    {
      flightNumber: 'AF303',
      airline: 'Air France',
      origin: 'CDG',
      originCity: 'Paris',
      destination: 'JFK',
      destinationCity: 'New York',
      status: FlightStatus.LANDED,
      scheduledDeparture: '2025-12-28T03:00:00Z',
      actualDeparture: '2025-12-28T03:00:00Z',
      scheduledArrival: '2025-12-28T06:00:00Z',
      actualArrival: '2025-12-28T06:05:00Z',
      gate: 'F8',
      terminal: 'T1',
      delayMinutes: 0,
      id: '6',
    },
  ];

  describe('getFlightStatusAccentColor', () => {
    it('should return correct color for ON_TIME', () => {
      expect(getFlightStatusAccentColor(FlightStatus.ON_TIME)).toBe('from-emerald-400 to-emerald-500');
    });

    it('should return correct color for DELAYED', () => {
      expect(getFlightStatusAccentColor(FlightStatus.DELAYED)).toBe('from-amber-400 to-amber-500');
    });

    it('should return correct color for CANCELLED', () => {
      expect(getFlightStatusAccentColor(FlightStatus.CANCELLED)).toBe('from-red-400 to-red-500');
    });

    it('should return correct color for IN_FLIGHT', () => {
      expect(getFlightStatusAccentColor(FlightStatus.IN_FLIGHT)).toBe('from-cyan-400 to-cyan-500');
    });
  });

  describe('getStatusDisplayText', () => {
    it('should format status text correctly', () => {
      expect(getStatusDisplayText(FlightStatus.IN_FLIGHT)).toBe('In Flight');
      expect(getStatusDisplayText(FlightStatus.ON_TIME)).toBe('On Time');
      expect(getStatusDisplayText(FlightStatus.DELAYED)).toBe('Delayed');
    });

    it('should handle single word status', () => {
      expect(getStatusDisplayText(FlightStatus.LANDED)).toBe('Landed');
    });
  });

  describe('isFlightLive', () => {
    it('should return true for IN_FLIGHT flights', () => {
      const inFlightFlight = mockFlights.find((f) => f.status === FlightStatus.IN_FLIGHT);
      expect(isFlightLive(inFlightFlight!)).toBe(true);
    });

    it('should return true for DEPARTED flights', () => {
      const departedFlight = mockFlights.find((f) => f.status === FlightStatus.DEPARTED);
      expect(isFlightLive(departedFlight!)).toBe(true);
    });

    it('should return false for other statuses', () => {
      const onTimeFlight = mockFlights.find((f) => f.status === FlightStatus.ON_TIME);
      expect(isFlightLive(onTimeFlight!)).toBe(false);
    });
  });

  describe('isFlightDelayed', () => {
    it('should return true for DELAYED status', () => {
      const delayedFlight = mockFlights.find((f) => f.status === FlightStatus.DELAYED);
      expect(isFlightDelayed(delayedFlight!)).toBe(true);
    });

    it('should return true if delayMinutes > 0', () => {
      const delayedFlight = mockFlights.find((f) => f.flightNumber === 'UA456');
      expect(isFlightDelayed(delayedFlight!)).toBe(true);
    });

    it('should return false for non-delayed flights', () => {
      const onTimeFlight = mockFlights.find((f) => f.status === FlightStatus.ON_TIME);
      expect(isFlightDelayed(onTimeFlight!)).toBe(false);
    });
  });

  describe('isFlightCancelled', () => {
    it('should return true for CANCELLED flights', () => {
      const cancelledFlight = mockFlights.find((f) => f.status === FlightStatus.CANCELLED);
      expect(isFlightCancelled(cancelledFlight!)).toBe(true);
    });

    it('should return false for non-cancelled flights', () => {
      const onTimeFlight = mockFlights.find((f) => f.status === FlightStatus.ON_TIME);
      expect(isFlightCancelled(onTimeFlight!)).toBe(false);
    });
  });

  describe('flightMatchesStatusFilter', () => {
    it('should return true when filter is "all"', () => {
      const flight = mockFlights[0];
      expect(flightMatchesStatusFilter(flight, 'all')).toBe(true);
    });

    it('should return true when status matches filter', () => {
      const onTimeFlight = mockFlights[0];
      expect(flightMatchesStatusFilter(onTimeFlight, FlightStatus.ON_TIME)).toBe(true);
    });

    it('should match both IN_FLIGHT and DEPARTED for IN_FLIGHT filter', () => {
      const inFlightFlight = mockFlights.find((f) => f.status === FlightStatus.IN_FLIGHT);
      const departedFlight = mockFlights.find((f) => f.status === FlightStatus.DEPARTED);

      expect(flightMatchesStatusFilter(inFlightFlight!, FlightStatus.IN_FLIGHT)).toBe(true);
      expect(flightMatchesStatusFilter(departedFlight!, FlightStatus.IN_FLIGHT)).toBe(true);
    });

    it('should match both LANDED and ARRIVED for LANDED filter', () => {
      const landedFlight = mockFlights.find((f) => f.status === FlightStatus.LANDED);
      expect(flightMatchesStatusFilter(landedFlight!, FlightStatus.LANDED)).toBe(true);
    });

    it('should return false when status does not match filter', () => {
      const onTimeFlight = mockFlights[0];
      expect(flightMatchesStatusFilter(onTimeFlight, FlightStatus.DELAYED)).toBe(false);
    });
  });

  describe('filterFlightsBySearch', () => {
    it('should return all flights when query is empty', () => {
      const result = filterFlightsBySearch(mockFlights, '');
      expect(result).toHaveLength(mockFlights.length);
    });

    it('should return all flights when query is only whitespace', () => {
      const result = filterFlightsBySearch(mockFlights, '   ');
      expect(result).toHaveLength(mockFlights.length);
    });

    it('should filter by flight number', () => {
      const result = filterFlightsBySearch(mockFlights, 'AA123');
      expect(result).toHaveLength(1);
      expect(result[0].flightNumber).toBe('AA123');
    });

    it('should filter by origin', () => {
      const result = filterFlightsBySearch(mockFlights, 'JFK');
      // JFK appears as origin in 1 flight (AA123) and destination in 3 flights
      expect(result).toHaveLength(4);
    });

    it('should filter by destination', () => {
      const result = filterFlightsBySearch(mockFlights, 'LAX');
      // LAX appears as destination in 1 flight (AA123) and origin in 1 flight (DL789)
      expect(result).toHaveLength(2);
      expect(result.some(f => f.destination === 'LAX')).toBe(true);
      expect(result.some(f => f.origin === 'LAX')).toBe(true);
    });

    it('should filter by airline', () => {
      const result = filterFlightsBySearch(mockFlights, 'American');
      expect(result).toHaveLength(1);
      expect(result[0].airline).toContain('American');
    });

    it('should be case insensitive', () => {
      const result = filterFlightsBySearch(mockFlights, 'aa123');
      expect(result).toHaveLength(1);
    });

    it('should handle partial matches', () => {
      const result = filterFlightsBySearch(mockFlights, 'AA');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('filterFlightsByStatus', () => {
    it('should return all flights when filter is "all"', () => {
      const result = filterFlightsByStatus(mockFlights, 'all');
      expect(result).toHaveLength(mockFlights.length);
    });

    it('should filter by ON_TIME status', () => {
      const result = filterFlightsByStatus(mockFlights, FlightStatus.ON_TIME);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(FlightStatus.ON_TIME);
    });

    it('should filter by DELAYED status', () => {
      const result = filterFlightsByStatus(mockFlights, FlightStatus.DELAYED);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(FlightStatus.DELAYED);
    });

    it('should include both IN_FLIGHT and DEPARTED for IN_FLIGHT filter', () => {
      const result = filterFlightsByStatus(mockFlights, FlightStatus.IN_FLIGHT);
      expect(result).toHaveLength(2);
      expect(result.every((f) => f.status === FlightStatus.IN_FLIGHT || f.status === FlightStatus.DEPARTED)).toBe(true);
    });

    it('should include LANDED flights for LANDED filter', () => {
      const result = filterFlightsByStatus(mockFlights, FlightStatus.LANDED);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(FlightStatus.LANDED);
    });
  });

  describe('calculateFlightStats', () => {
    it('should calculate correct statistics', () => {
      const stats = calculateFlightStats(mockFlights);

      expect(stats.total).toBe(6);
      expect(stats.onTime).toBe(1);
      expect(stats.scheduled).toBe(0);
      expect(stats.boarding).toBe(0);
      expect(stats.inFlight).toBe(2); // IN_FLIGHT + DEPARTED
      expect(stats.delayed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.landed).toBe(1);
    });

    it('should return zeros for empty array', () => {
      const stats = calculateFlightStats([]);

      expect(stats.total).toBe(0);
      expect(stats.onTime).toBe(0);
      expect(stats.scheduled).toBe(0);
      expect(stats.boarding).toBe(0);
      expect(stats.inFlight).toBe(0);
      expect(stats.delayed).toBe(0);
      expect(stats.cancelled).toBe(0);
      expect(stats.landed).toBe(0);
    });
  });

  describe('sortFlightsByDeparture', () => {
    it('should sort flights by departure time ascending', () => {
      const result = sortFlightsByDeparture(mockFlights, true);

      expect(result[0].flightNumber).toBe('AF303'); // 03:00 UTC
      expect(result[result.length - 1].flightNumber).toBe('SW101'); // 18:00 UTC
    });

    it('should sort flights by departure time descending', () => {
      const result = sortFlightsByDeparture(mockFlights, false);

      expect(result[0].flightNumber).toBe('SW101'); // 18:00 UTC
      expect(result[result.length - 1].flightNumber).toBe('AF303'); // 03:00 UTC
    });

    it('should not mutate original array', () => {
      const originalOrder = [...mockFlights];
      sortFlightsByDeparture(mockFlights);

      expect(mockFlights).toEqual(originalOrder);
    });
  });

  describe('getUniqueDestinations', () => {
    it('should return unique destination airport codes', () => {
      const result = getUniqueDestinations(mockFlights);

      expect(result).toContain('LAX');
      expect(result).toContain('JFK');
      expect(result).toContain('MIA');
      expect(result).toContain('PHX');
    });

    it('should return sorted destinations', () => {
      const result = getUniqueDestinations(mockFlights);

      expect(result).toEqual([...result].sort());
    });

    it('should not have duplicates', () => {
      const result = getUniqueDestinations(mockFlights);

      const uniqueSet = new Set(result);
      expect(result.length).toBe(uniqueSet.size);
    });

    it('should return empty array for empty flights', () => {
      const result = getUniqueDestinations([]);
      expect(result).toEqual([]);
    });
  });

  describe('getUniqueAirlines', () => {
    it('should return unique airline names', () => {
      const result = getUniqueAirlines(mockFlights);

      expect(result).toContain('American Airlines');
      expect(result).toContain('United Airlines');
      expect(result).toContain('Delta Airlines');
      expect(result).toContain('Southwest Airlines');
      expect(result).toContain('British Airways');
      expect(result).toContain('Air France');
    });

    it('should return sorted airlines', () => {
      const result = getUniqueAirlines(mockFlights);

      expect(result).toEqual([...result].sort());
    });

    it('should not have duplicates', () => {
      const result = getUniqueAirlines(mockFlights);

      const uniqueSet = new Set(result);
      expect(result.length).toBe(uniqueSet.size);
    });

    it('should return empty array for empty flights', () => {
      const result = getUniqueAirlines([]);
      expect(result).toEqual([]);
    });
  });
});
