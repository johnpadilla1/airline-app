import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FlightDetails from '../FlightDetails';

// Mock the useFlightEvents hook
jest.mock('../../../hooks/useFlights', () => ({
    useFlightEvents: jest.fn(),
}));

import { useFlightEvents } from '../../../hooks/useFlights';

// Create a wrapper with QueryClient for testing
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

describe('FlightDetails', () => {
    const mockFlight = {
        id: 1,
        flightNumber: 'AA123',
        airline: 'American Airlines',
        origin: 'JFK',
        originCity: 'New York',
        destination: 'LAX',
        destinationCity: 'Los Angeles',
        status: 'ON_TIME',
        gate: 'A12',
        terminal: 'T4',
        checkInDesk: '45-48',
        baggageClaim: 'B3',
        aircraft: 'Boeing 737-800',
        scheduledDeparture: '2024-12-08T10:00:00Z',
        scheduledArrival: '2024-12-08T13:00:00Z',
        actualDeparture: null,
        actualArrival: null,
        delayMinutes: 0,
    };

    const mockEvents = [
        {
            id: 1,
            eventType: 'BOARDING_STARTED',
            eventTimestamp: '2024-12-08T09:30:00Z',
            description: 'Boarding has begun',
        },
        {
            id: 2,
            eventType: 'GATE_CHANGE',
            eventTimestamp: '2024-12-08T08:00:00Z',
            description: 'Gate changed',
            previousValue: 'A10',
            newValue: 'A12',
        },
    ];

    const mockOnClose = jest.fn();

    beforeEach(() => {
        mockOnClose.mockClear();
        useFlightEvents.mockReturnValue({
            data: mockEvents,
            isLoading: false,
        });
    });

    describe('Rendering', () => {
        it('renders flight number', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('AA123')).toBeInTheDocument();
        });

        it('renders airline name', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('American Airlines')).toBeInTheDocument();
        });

        it('renders origin and destination airports', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('JFK')).toBeInTheDocument();
            expect(screen.getByText('LAX')).toBeInTheDocument();
        });

        it('renders city names', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('New York')).toBeInTheDocument();
            expect(screen.getByText('Los Angeles')).toBeInTheDocument();
        });

        it('renders status badge', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('On Time')).toBeInTheDocument();
        });

        it('renders aircraft information', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Boeing 737-800')).toBeInTheDocument();
        });
    });

    describe('Info Cards', () => {
        it('renders gate information', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Gate')).toBeInTheDocument();
            // A12 appears both in gate card and in event timeline
            expect(screen.getAllByText('A12').length).toBeGreaterThanOrEqual(1);
        });

        it('renders terminal information', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Terminal')).toBeInTheDocument();
            expect(screen.getByText('T4')).toBeInTheDocument();
        });

        it('renders check-in desk information', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Check-in')).toBeInTheDocument();
            expect(screen.getByText('45-48')).toBeInTheDocument();
        });

        it('renders baggage claim information', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Baggage')).toBeInTheDocument();
            expect(screen.getByText('B3')).toBeInTheDocument();
        });

        it('displays dash for missing info', () => {
            const flightWithoutInfo = { ...mockFlight, gate: null, terminal: null };
            render(<FlightDetails flight={flightWithoutInfo} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Delay Warning', () => {
        it('shows delay warning for delayed flights', () => {
            const delayedFlight = { ...mockFlight, status: 'DELAYED', delayMinutes: 30 };
            render(<FlightDetails flight={delayedFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText(/delayed by 30 minutes/i)).toBeInTheDocument();
        });

        it('does not show delay warning for on-time flights', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.queryByText(/delayed by/i)).not.toBeInTheDocument();
        });
    });

    describe('Flight Timeline', () => {
        it('renders flight timeline section', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Flight Timeline')).toBeInTheDocument();
        });

        it('renders events when available', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('Boarding Started')).toBeInTheDocument();
            expect(screen.getByText('Gate Changed')).toBeInTheDocument();
        });

        it('shows loading spinner when events are loading', () => {
            useFlightEvents.mockReturnValue({
                data: null,
                isLoading: true,
            });

            const { container } = render(
                <FlightDetails flight={mockFlight} onClose={mockOnClose} />,
                { wrapper: createWrapper() }
            );

            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });

        it('shows empty state when no events', () => {
            useFlightEvents.mockReturnValue({
                data: [],
                isLoading: false,
            });

            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });

            expect(screen.getByText('No events recorded yet')).toBeInTheDocument();
        });

        it('shows value changes for gate change event', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });
            expect(screen.getByText('A10')).toBeInTheDocument();
            // A12 appears both in gate card and in event timeline
            const a12Elements = screen.getAllByText('A12');
            expect(a12Elements.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });

            const closeButton = screen.getByRole('button');
            fireEvent.click(closeButton);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when backdrop is clicked', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });

            const backdrop = screen.getByText('AA123').closest('.fixed');
            fireEvent.click(backdrop);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('does not call onClose when modal content is clicked', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });

            const modalContent = screen.getByText('American Airlines');
            fireEvent.click(modalContent);
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('calls onClose when Escape key is pressed', () => {
            render(<FlightDetails flight={mockFlight} onClose={mockOnClose} />, {
                wrapper: createWrapper(),
            });

            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Live Flight Indicator', () => {
        it('shows live indicator for IN_FLIGHT status', () => {
            const inFlightFlight = { ...mockFlight, status: 'IN_FLIGHT' };
            const { container } = render(
                <FlightDetails flight={inFlightFlight} onClose={mockOnClose} />,
                { wrapper: createWrapper() }
            );

            const pulseIndicator = container.querySelector('.animate-ping');
            expect(pulseIndicator).toBeInTheDocument();
        });

        it('shows live indicator for DEPARTED status', () => {
            const departedFlight = { ...mockFlight, status: 'DEPARTED' };
            const { container } = render(
                <FlightDetails flight={departedFlight} onClose={mockOnClose} />,
                { wrapper: createWrapper() }
            );

            const pulseIndicator = container.querySelector('.animate-ping');
            expect(pulseIndicator).toBeInTheDocument();
        });
    });
});
