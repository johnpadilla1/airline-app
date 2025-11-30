import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import flightService from '../services/flightService';

// 30 minutes in milliseconds
const POLLING_INTERVAL = 30 * 60 * 1000;

export function useFlights() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef(null);

  const query = useQuery({
    queryKey: ['flights'],
    queryFn: flightService.getAllFlights,
    refetchInterval: POLLING_INTERVAL,
    staleTime: 60000, // 1 minute
  });

  // Update a single flight in the cache
  const updateFlightInCache = useCallback((flightNumber, updateFn) => {
    queryClient.setQueryData(['flights'], (oldData) => {
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

      const eventSource = new EventSource('/api/events/stream');
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

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
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

export function useFlight(id) {
  return useQuery({
    queryKey: ['flight', id],
    queryFn: () => flightService.getFlightById(id),
    enabled: !!id,
  });
}

export function useFlightEvents(flightNumber) {
  return useQuery({
    queryKey: ['flightEvents', flightNumber],
    queryFn: () => flightService.getFlightEvents(flightNumber),
    enabled: !!flightNumber,
  });
}

export function useRecentEvents() {
  return useQuery({
    queryKey: ['recentEvents'],
    queryFn: flightService.getRecentEvents,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useLatestEvent() {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(['latestEvent']);
}
