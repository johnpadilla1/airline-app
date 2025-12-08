import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFlights, useFlight, useFlightEvents, useRecentEvents } from '../useFlights';
import flightService from '../../services/flightService';

// Mock flightService
jest.mock('../../services/flightService', () => ({
    getAllFlights: jest.fn(),
    getFlightById: jest.fn(),
    getFlightEvents: jest.fn(),
    getRecentEvents: jest.fn(),
}));

// Mock EventSource
const mockEventSource = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    close: jest.fn(),
};

global.EventSource = jest.fn(() => mockEventSource);

// Create wrapper for react-query
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('useFlights Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEventSource.addEventListener.mockClear();
        mockEventSource.close.mockClear();
    });

    describe('useFlights', () => {
        it('fetches all flights on mount', async () => {
            const mockFlights = [
                { id: 1, flightNumber: 'AA123' },
                { id: 2, flightNumber: 'UA456' },
            ];
            flightService.getAllFlights.mockResolvedValue(mockFlights);

            const { result } = renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            // Initial loading state
            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.flights).toEqual(mockFlights);
            expect(flightService.getAllFlights).toHaveBeenCalled();
        });

        it('returns empty array when no flights', async () => {
            flightService.getAllFlights.mockResolvedValue([]);

            const { result } = renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.flights).toEqual([]);
        });

        it('handles error state', async () => {
            const error = new Error('Network error');
            flightService.getAllFlights.mockRejectedValue(error);

            const { result } = renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toBeDefined();
        });

        it('provides refetch function', async () => {
            flightService.getAllFlights.mockResolvedValue([]);

            const { result } = renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.refetch).toBe('function');
        });

        it('connects to SSE on mount', async () => {
            flightService.getAllFlights.mockResolvedValue([]);

            renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            expect(global.EventSource).toHaveBeenCalledWith('/api/events/stream');
        });

        it('sets up event listeners for SSE', async () => {
            flightService.getAllFlights.mockResolvedValue([]);

            renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
                'connected',
                expect.any(Function)
            );
            expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
                'flight-update',
                expect.any(Function)
            );
            expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
                'heartbeat',
                expect.any(Function)
            );
        });

        it('closes SSE connection on unmount', async () => {
            flightService.getAllFlights.mockResolvedValue([]);

            const { unmount } = renderHook(() => useFlights(), {
                wrapper: createWrapper(),
            });

            unmount();

            expect(mockEventSource.close).toHaveBeenCalled();
        });
    });

    describe('useFlight', () => {
        it('fetches single flight by ID', async () => {
            const mockFlight = { id: 1, flightNumber: 'AA123' };
            flightService.getFlightById.mockResolvedValue(mockFlight);

            const { result } = renderHook(() => useFlight(1), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual(mockFlight);
            expect(flightService.getFlightById).toHaveBeenCalledWith(1);
        });

        it('does not fetch when ID is not provided', async () => {
            const { result } = renderHook(() => useFlight(null), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(flightService.getFlightById).not.toHaveBeenCalled();
        });

        it('does not fetch when ID is undefined', async () => {
            const { result } = renderHook(() => useFlight(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(flightService.getFlightById).not.toHaveBeenCalled();
        });
    });

    describe('useFlightEvents', () => {
        it('fetches flight events by flight number', async () => {
            const mockEvents = [
                { id: 1, eventType: 'DELAY' },
                { id: 2, eventType: 'GATE_CHANGE' },
            ];
            flightService.getFlightEvents.mockResolvedValue(mockEvents);

            const { result } = renderHook(() => useFlightEvents('AA123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual(mockEvents);
            expect(flightService.getFlightEvents).toHaveBeenCalledWith('AA123');
        });

        it('does not fetch when flight number is not provided', async () => {
            const { result } = renderHook(() => useFlightEvents(null), {
                wrapper: createWrapper(),
            });

            expect(result.current.isLoading).toBe(false);
            expect(flightService.getFlightEvents).not.toHaveBeenCalled();
        });
    });

    describe('useRecentEvents', () => {
        it('fetches recent events', async () => {
            const mockEvents = [
                { id: 1, eventType: 'DELAY', flightNumber: 'AA123' },
                { id: 2, eventType: 'BOARDING_STARTED', flightNumber: 'UA456' },
            ];
            flightService.getRecentEvents.mockResolvedValue(mockEvents);

            const { result } = renderHook(() => useRecentEvents(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual(mockEvents);
            expect(flightService.getRecentEvents).toHaveBeenCalled();
        });
    });
});
