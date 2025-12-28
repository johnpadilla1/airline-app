import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import flightService from '@/shared/api/flightService';
import { Flight, FlightEvent, RecentEvent, FlightUpdateFunction } from '@/shared/types';

/**
 * Flight Hook
 * Custom React hooks for managing flight data with React Query
 * Provides caching, real-time updates, and optimistic updates
 */

// 30 minutes in milliseconds
const POLLING_INTERVAL = 30 * 60 * 1000;

/**
 * Flights query hook result type
 */
interface UseFlightsResult extends Pick<UseQueryResult<Flight[]>, 'isLoading' | 'isError' | 'error' | 'refetch'> {
  flights: Flight[];
  updateFlightInCache: (flightNumber: string, updateFn: FlightUpdateFunction) => void;
}

/**
 * Hook for fetching and managing all flights
 * Connects to SSE for real-time updates
 * @returns UseFlightsResult with flights data and update function
 */
export function useFlights(): UseFlightsResult {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  const query = useQuery({
    queryKey: ['flights'],
    queryFn: flightService.getAllFlights,
    refetchInterval: POLLING_INTERVAL,
    staleTime: 60000, // 1 minute
  });

  /**
   * Update a single flight in the cache
   * Useful for optimistic updates
   */
  const updateFlightInCache = useCallback((flightNumber: string, updateFn: FlightUpdateFunction) => {
    queryClient.setQueryData(['flights'], (oldData: Flight[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map((flight) =>
        flight.flightNumber === flightNumber ? updateFn(flight) : flight
      );
    });
  }, [queryClient]);

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    const connectSSE = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/flights/stream');
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', (event) => {
        console.log('SSE Connected:', event.data);
      });

      eventSource.addEventListener('flight-update', (event) => {
        try {
          const flightEvent = JSON.parse(event.data);
          console.log('Flight Update:', flightEvent);

          // Invalidate and refetch to get updated flight data
          queryClient.invalidateQueries({ queryKey: ['flights'] });

          // Also store the latest event
          queryClient.setQueryData(['latestEvent'], flightEvent);
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      });

      eventSource.addEventListener('heartbeat', (event) => {
        console.log('Heartbeat received:', event.data);
      });

      eventSource.onerror = () => {
        console.error('SSE Error: Connection lost');
        eventSource.close();

        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [queryClient]);

  return {
    flights: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateFlightInCache,
  };
}

/**
 * Hook for fetching a single flight by ID
 * @param id - Flight ID
 * @returns UseQueryResult with flight data
 */
export function useFlight(id: string): UseQueryResult<Flight> {
  return useQuery({
    queryKey: ['flight', id],
    queryFn: () => flightService.getFlightById(id),
    enabled: !!id,
  });
}

/**
 * Hook for fetching flight events
 * @param flightNumber - Flight number
 * @returns UseQueryResult with flight events
 */
export function useFlightEvents(flightNumber: string): UseQueryResult<FlightEvent[]> {
  return useQuery({
    queryKey: ['flightEvents', flightNumber],
    queryFn: () => flightService.getFlightEvents(flightNumber),
    enabled: !!flightNumber,
  });
}

/**
 * Hook for fetching recent flight events
 * @returns UseQueryResult with recent events
 */
export function useRecentEvents(): UseQueryResult<RecentEvent[]> {
  return useQuery({
    queryKey: ['recentEvents'],
    queryFn: flightService.getRecentEvents,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook for getting the latest event from cache
 * @returns Latest event or undefined
 */
export function useLatestEvent(): unknown {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(['latestEvent']);
}
