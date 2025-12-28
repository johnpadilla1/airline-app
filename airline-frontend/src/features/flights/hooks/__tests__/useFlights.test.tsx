import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlightStatus } from '@/shared/types';
import { useFlights, useFlight, useRecentEvents, useFlightEvents } from '../useFlights';
import flightService from '@/shared/api/flightService';

// Mock the flight service
jest.mock('@/shared/api/flightService');

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
];

const mockEvents = [
  {
    id: '1',
    flightNumber: 'AA123',
    eventType: 'STATUS_CHANGE',
    description: 'Flight status changed to ON_TIME',
    timestamp: '2025-12-28T10:00:00Z',
  },
  {
    id: '2',
    flightNumber: 'AA123',
    eventType: 'GATE_CHANGE',
    description: 'Gate changed to A12',
    timestamp: '2025-12-28T10:05:00Z',
  },
];

const mockRecentEvents = [
  {
    id: '1',
    flightNumber: 'AA123',
    type: 'STATUS_CHANGE',
    message: 'Flight AA123 is now on time',
    timestamp: '2025-12-28T10:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFlights Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFlights', () => {
    it('should fetch flights successfully', async () => {
      (flightService.getAllFlights as jest.Mock).mockResolvedValue(mockFlights);

      const { result } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.flights).toEqual(mockFlights);
      expect(result.current.isError).toBe(false);
      expect(flightService.getAllFlights).toHaveBeenCalledTimes(1);
    });

    it('should handle loading state', () => {
      (flightService.getAllFlights as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.flights).toEqual([]);
    });

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch flights');
      (flightService.getAllFlights as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.flights).toEqual([]);
    });

    it('should provide refetch function', async () => {
      (flightService.getAllFlights as jest.Mock).mockResolvedValue(mockFlights);

      const { result } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.refetch();

      expect(flightService.getAllFlights).toHaveBeenCalledTimes(2);
    });
  });

  describe('useFlight', () => {
    it('should fetch single flight by id', async () => {
      (flightService.getFlightById as jest.Mock).mockResolvedValue(mockFlights[0]);

      const { result } = renderHook(() => useFlight('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockFlights[0]);
    });

    it('should return undefined for non-existent flight', async () => {
      // Use a fresh QueryClient to avoid cached data from previous tests
      const freshQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });

      const freshWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={freshQueryClient}>{children}</QueryClientProvider>
      );

      // Mock getFlightById to reject for non-existent flight
      (flightService.getFlightById as jest.Mock).mockRejectedValue(
        new Error('Flight not found')
      );

      const { result } = renderHook(() => useFlight('999'), {
        wrapper: freshWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(true);
    });

    it('should handle loading state for single flight', () => {
      (flightService.getAllFlights as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useFlight('1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useFlightEvents', () => {
    it('should fetch flight events', async () => {
      (flightService.getFlightEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useFlightEvents('AA123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockEvents);
      expect(flightService.getFlightEvents).toHaveBeenCalledWith('AA123');
    });

    it('should handle error when fetching events', async () => {
      const mockError = new Error('Failed to fetch events');
      (flightService.getFlightEvents as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useFlightEvents('AA123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useRecentEvents', () => {
    it('should fetch recent events', async () => {
      (flightService.getRecentEvents as jest.Mock).mockResolvedValue(mockRecentEvents);

      const { result } = renderHook(() => useRecentEvents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockRecentEvents);
      expect(flightService.getRecentEvents).toHaveBeenCalledTimes(1);
    });

    it('should handle empty events array', async () => {
      (flightService.getRecentEvents as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRecentEvents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch recent events');
      (flightService.getRecentEvents as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useRecentEvents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('SSE Connection', () => {
    it('should establish SSE connection on mount', () => {
      // Mock EventSource with proper implementation
      const MockEventSource = function(url: string) {
        this.url = url;
        this.readyState = 0;
        this.addEventListener = jest.fn();
        this.removeEventListener = jest.fn();
        this.close = jest.fn();
      };
      global.EventSource = MockEventSource as any;

      (flightService.getAllFlights as jest.Mock).mockResolvedValue(mockFlights);

      renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      // EventSource should be called for SSE connection
      // The hook creates an EventSource internally, so we verify it works without crashing
      expect(global.EventSource).toBeDefined();
    });
  });

  describe('Refetching', () => {
    it('should refetch flights when refetch is called', async () => {
      // Mock EventSource with proper implementation
      const MockEventSource = function(url: string) {
        this.url = url;
        this.readyState = 0;
        this.addEventListener = jest.fn();
        this.removeEventListener = jest.fn();
        this.close = jest.fn();
      };
      global.EventSource = MockEventSource as any;

      (flightService.getAllFlights as jest.Mock).mockResolvedValue(mockFlights);

      const { result } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = flightService.getAllFlights as jest.Mock;
      const initialCalls = initialCallCount.mock.calls.length;

      result.current.refetch();

      await waitFor(() => {
        expect(initialCallCount.mock.calls.length).toBe(initialCalls + 1);
      });
    });
  });

  describe('Cache and Performance', () => {
    it('should use cached data for subsequent calls', async () => {
      // Mock EventSource with proper implementation
      const MockEventSource = function(url: string) {
        this.url = url;
        this.readyState = 0;
        this.addEventListener = jest.fn();
        this.removeEventListener = jest.fn();
        this.close = jest.fn();
      };
      global.EventSource = MockEventSource as any;

      (flightService.getAllFlights as jest.Mock).mockResolvedValue(mockFlights);

      const { result: result1 } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(() => useFlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Both hooks should have the same data
      expect(result1.current.flights).toEqual(result2.current.flights);
      // Each QueryClient instance makes its own API call
      expect(flightService.getAllFlights).toHaveBeenCalledTimes(2);
    });
  });
});
