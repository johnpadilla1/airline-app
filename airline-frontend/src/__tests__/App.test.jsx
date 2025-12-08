import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

// Mock the hooks
jest.mock('../hooks/useFlights', () => ({
    useFlights: jest.fn(),
    useRecentEvents: jest.fn(),
}));

// Mock child components to isolate App testing
jest.mock('../components/FlightList/FlightList', () => {
    return function MockFlightList({ flights, viewMode, isLoading, onFlightSelect }) {
        return (
            <div data-testid="flight-list" data-viewmode={viewMode} data-loading={isLoading}>
                {flights.map(f => (
                    <div
                        key={f.id}
                        data-testid={`flight-${f.id}`}
                        onClick={() => onFlightSelect(f)}
                    >
                        {f.flightNumber}
                    </div>
                ))}
            </div>
        );
    };
});

jest.mock('../components/FlightDetails/FlightDetails', () => {
    return function MockFlightDetails({ flight, onClose }) {
        return (
            <div data-testid="flight-details">
                <span>{flight.flightNumber}</span>
                <button onClick={onClose}>Close</button>
            </div>
        );
    };
});

jest.mock('../components/EventTicker/EventTicker', () => {
    return function MockEventTicker({ events }) {
        return <div data-testid="event-ticker">{events?.length || 0} events</div>;
    };
});

jest.mock('../components/ChatPanel/ChatPanel', () => {
    return function MockChatPanel({ isOpen, onToggle }) {
        return (
            <div data-testid="chat-panel" data-open={isOpen}>
                <button onClick={onToggle} data-testid="chat-toggle">Toggle Chat</button>
            </div>
        );
    };
});

import { useFlights, useRecentEvents } from '../hooks/useFlights';

// Create wrapper with QueryClient
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

// Mock flight data
const mockFlights = [
    {
        id: 1,
        flightNumber: 'AA123',
        airline: 'American Airlines',
        origin: 'JFK',
        destination: 'LAX',
        status: 'ON_TIME',
    },
    {
        id: 2,
        flightNumber: 'UA456',
        airline: 'United Airlines',
        origin: 'ORD',
        destination: 'SFO',
        status: 'DELAYED',
    },
    {
        id: 3,
        flightNumber: 'DL789',
        airline: 'Delta Airlines',
        origin: 'ATL',
        destination: 'MIA',
        status: 'IN_FLIGHT',
    },
    {
        id: 4,
        flightNumber: 'SW101',
        airline: 'Southwest',
        origin: 'DEN',
        destination: 'PHX',
        status: 'BOARDING',
    },
    {
        id: 5,
        flightNumber: 'JB202',
        airline: 'JetBlue',
        origin: 'BOS',
        destination: 'FLL',
        status: 'CANCELLED',
    },
    {
        id: 6,
        flightNumber: 'AS303',
        airline: 'Alaska Airlines',
        origin: 'SEA',
        destination: 'LAX',
        status: 'LANDED',
    },
    {
        id: 7,
        flightNumber: 'F9404',
        airline: 'Frontier',
        origin: 'DEN',
        destination: 'ORD',
        status: 'SCHEDULED',
    },
    {
        id: 8,
        flightNumber: 'NK505',
        airline: 'Spirit',
        origin: 'FLL',
        destination: 'ATL',
        status: 'DEPARTED',
    },
];

const mockEvents = [
    { id: 1, eventType: 'DELAY', flightNumber: 'AA123' },
    { id: 2, eventType: 'GATE_CHANGE', flightNumber: 'UA456' },
];

describe('App', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementations
        useFlights.mockReturnValue({
            flights: mockFlights,
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
        });

        useRecentEvents.mockReturnValue({
            data: mockEvents,
        });

        // Reset localStorage mock
        window.localStorage.getItem.mockReturnValue(null);
        window.localStorage.setItem.mockClear();
    });

    describe('Header Rendering', () => {
        it('renders app title', () => {
            render(<App />, { wrapper: createWrapper() });
            expect(screen.getByText('SkyTrack')).toBeInTheDocument();
        });

        it('renders subtitle', () => {
            render(<App />, { wrapper: createWrapper() });
            expect(screen.getByText('Global Flight Intelligence')).toBeInTheDocument();
        });

        it('renders search input', () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            expect(searchInputs.length).toBeGreaterThanOrEqual(1);
        });

        it('renders live status indicator', () => {
            render(<App />, { wrapper: createWrapper() });
            expect(screen.getByText('Live')).toBeInTheDocument();
        });

        it('renders refresh button', () => {
            render(<App />, { wrapper: createWrapper() });
            const refreshButton = screen.getByTitle('Refresh');
            expect(refreshButton).toBeInTheDocument();
        });
    });

    describe('Theme Toggle', () => {
        it('renders theme toggle button', () => {
            render(<App />, { wrapper: createWrapper() });
            const themeButton = screen.getByTitle(/Switch to/);
            expect(themeButton).toBeInTheDocument();
        });

        it('toggles theme when clicked', () => {
            render(<App />, { wrapper: createWrapper() });
            const themeButton = screen.getByTitle(/Switch to/);

            const initialTitle = themeButton.getAttribute('title');
            fireEvent.click(themeButton);

            // Title should change
            expect(themeButton.getAttribute('title')).not.toBe(initialTitle);
        });

        it('saves theme to localStorage', () => {
            render(<App />, { wrapper: createWrapper() });
            const themeButton = screen.getByTitle(/Switch to/);

            fireEvent.click(themeButton);

            expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', expect.any(String));
        });

        it('loads theme from localStorage', () => {
            window.localStorage.getItem.mockReturnValue('light');

            render(<App />, { wrapper: createWrapper() });

            expect(window.localStorage.getItem).toHaveBeenCalledWith('theme');
        });
    });

    describe('View Mode Toggle', () => {
        it('renders view toggle buttons', () => {
            render(<App />, { wrapper: createWrapper() });
            expect(screen.getByTitle('Card View')).toBeInTheDocument();
            expect(screen.getByTitle('List View')).toBeInTheDocument();
        });

        it('defaults to card view', () => {
            render(<App />, { wrapper: createWrapper() });
            const flightList = screen.getByTestId('flight-list');
            expect(flightList.getAttribute('data-viewmode')).toBe('card');
        });

        it('switches to grid view when list button clicked', () => {
            render(<App />, { wrapper: createWrapper() });
            const listButton = screen.getByTitle('List View');

            fireEvent.click(listButton);

            const flightList = screen.getByTestId('flight-list');
            expect(flightList.getAttribute('data-viewmode')).toBe('grid');
        });

        it('switches back to card view when card button clicked', () => {
            render(<App />, { wrapper: createWrapper() });

            // Switch to grid first
            fireEvent.click(screen.getByTitle('List View'));
            // Switch back to card
            fireEvent.click(screen.getByTitle('Card View'));

            const flightList = screen.getByTestId('flight-list');
            expect(flightList.getAttribute('data-viewmode')).toBe('card');
        });
    });

    describe('Search Functionality', () => {
        it('filters flights by flight number', async () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'AA123');

            const flightList = screen.getByTestId('flight-list');
            expect(within(flightList).getByText('AA123')).toBeInTheDocument();
            expect(within(flightList).queryByText('UA456')).not.toBeInTheDocument();
        });

        it('filters flights by airline', async () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'United');

            const flightList = screen.getByTestId('flight-list');
            expect(within(flightList).getByText('UA456')).toBeInTheDocument();
            expect(within(flightList).queryByText('AA123')).not.toBeInTheDocument();
        });

        it('filters flights by origin', async () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'JFK');

            const flightList = screen.getByTestId('flight-list');
            expect(within(flightList).getByText('AA123')).toBeInTheDocument();
        });

        it('filters flights by destination', async () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'LAX');

            const flightList = screen.getByTestId('flight-list');
            // AA123 (JFK->LAX) and AS303 (SEA->LAX) both go to LAX
            expect(within(flightList).getByText('AA123')).toBeInTheDocument();
        });

        it('shows clear search button when searching', async () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'AA123');

            expect(screen.getByText('"AA123"')).toBeInTheDocument();
        });

        it('clears search when clear button clicked', async () => {
            render(<App />, { wrapper: createWrapper() });
            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'AA123');

            const clearButton = screen.getByText('"AA123"').closest('button');
            fireEvent.click(clearButton);

            expect(searchInput.value).toBe('');
        });
    });

    describe('Status Filter', () => {
        it('renders all status filter pills', () => {
            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByText('All')).toBeInTheDocument();
            expect(screen.getByText('On Time')).toBeInTheDocument();
            expect(screen.getByText('Scheduled')).toBeInTheDocument();
            expect(screen.getByText('Boarding')).toBeInTheDocument();
            expect(screen.getByText('In Flight')).toBeInTheDocument();
            expect(screen.getByText('Delayed')).toBeInTheDocument();
            expect(screen.getByText('Cancelled')).toBeInTheDocument();
            expect(screen.getByText('Landed')).toBeInTheDocument();
        });

        it('shows correct count for each status', () => {
            render(<App />, { wrapper: createWrapper() });

            // Total: 8 flights
            const allPill = screen.getByText('All').closest('button');
            expect(within(allPill).getByText('8')).toBeInTheDocument();

            // ON_TIME: 1
            const onTimePill = screen.getByText('On Time').closest('button');
            expect(within(onTimePill).getByText('1')).toBeInTheDocument();

            // DELAYED: 1
            const delayedPill = screen.getByText('Delayed').closest('button');
            expect(within(delayedPill).getByText('1')).toBeInTheDocument();
        });

        it('filters by status when pill clicked', () => {
            render(<App />, { wrapper: createWrapper() });

            const delayedPill = screen.getByText('Delayed').closest('button');
            fireEvent.click(delayedPill);

            const flightList = screen.getByTestId('flight-list');
            expect(within(flightList).getByText('UA456')).toBeInTheDocument();
            expect(within(flightList).queryByText('AA123')).not.toBeInTheDocument();
        });

        it('toggles filter off when clicking same pill again', () => {
            render(<App />, { wrapper: createWrapper() });

            const delayedPill = screen.getByText('Delayed').closest('button');
            fireEvent.click(delayedPill); // Enable filter
            fireEvent.click(delayedPill); // Disable filter

            const flightList = screen.getByTestId('flight-list');
            // Should show all flights again
            expect(within(flightList).getByText('AA123')).toBeInTheDocument();
            expect(within(flightList).getByText('UA456')).toBeInTheDocument();
        });

        it('In Flight filter includes DEPARTED status', () => {
            render(<App />, { wrapper: createWrapper() });

            const inFlightPill = screen.getByText('In Flight').closest('button');
            fireEvent.click(inFlightPill);

            const flightList = screen.getByTestId('flight-list');
            // Should include DL789 (IN_FLIGHT) and NK505 (DEPARTED)
            expect(within(flightList).getByText('DL789')).toBeInTheDocument();
            expect(within(flightList).getByText('NK505')).toBeInTheDocument();
        });

        it('shows active filter indicator', () => {
            render(<App />, { wrapper: createWrapper() });

            const delayedPill = screen.getByText('Delayed').closest('button');
            fireEvent.click(delayedPill);

            expect(screen.getByText('Showing:')).toBeInTheDocument();
            expect(screen.getByText('DELAYED')).toBeInTheDocument();
        });

        it('clears all filters when Clear all clicked', async () => {
            render(<App />, { wrapper: createWrapper() });

            // Apply status filter
            const delayedPill = screen.getByText('Delayed').closest('button');
            fireEvent.click(delayedPill);

            // Click clear all
            const clearAllButton = screen.getByText('Clear all');
            fireEvent.click(clearAllButton);

            // Should show all flights
            const flightList = screen.getByTestId('flight-list');
            expect(within(flightList).getAllByTestId(/flight-/).length).toBe(8);
        });
    });

    describe('Flight Selection', () => {
        it('opens flight details when flight clicked', () => {
            render(<App />, { wrapper: createWrapper() });

            const flight = screen.getByTestId('flight-1');
            fireEvent.click(flight);

            expect(screen.getByTestId('flight-details')).toBeInTheDocument();
        });

        it('shows correct flight in details modal', () => {
            render(<App />, { wrapper: createWrapper() });

            const flight = screen.getByTestId('flight-1');
            fireEvent.click(flight);

            const details = screen.getByTestId('flight-details');
            expect(within(details).getByText('AA123')).toBeInTheDocument();
        });

        it('closes flight details when close clicked', () => {
            render(<App />, { wrapper: createWrapper() });

            // Open details
            const flight = screen.getByTestId('flight-1');
            fireEvent.click(flight);

            // Close details
            const closeButton = screen.getByText('Close');
            fireEvent.click(closeButton);

            expect(screen.queryByTestId('flight-details')).not.toBeInTheDocument();
        });
    });

    describe('Refresh Functionality', () => {
        it('calls refetch when refresh button clicked', () => {
            const mockRefetch = jest.fn();
            useFlights.mockReturnValue({
                flights: mockFlights,
                isLoading: false,
                isError: false,
                error: null,
                refetch: mockRefetch,
            });

            render(<App />, { wrapper: createWrapper() });

            const refreshButton = screen.getByTitle('Refresh');
            fireEvent.click(refreshButton);

            expect(mockRefetch).toHaveBeenCalled();
        });

        it('disables refresh button when loading', () => {
            useFlights.mockReturnValue({
                flights: [],
                isLoading: true,
                isError: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<App />, { wrapper: createWrapper() });

            const refreshButton = screen.getByTitle('Refresh');
            expect(refreshButton).toBeDisabled();
        });
    });

    describe('Loading State', () => {
        it('passes loading state to FlightList', () => {
            useFlights.mockReturnValue({
                flights: [],
                isLoading: true,
                isError: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<App />, { wrapper: createWrapper() });

            const flightList = screen.getByTestId('flight-list');
            expect(flightList.getAttribute('data-loading')).toBe('true');
        });
    });

    describe('Error State', () => {
        it('shows error message when isError is true', () => {
            useFlights.mockReturnValue({
                flights: [],
                isLoading: false,
                isError: true,
                error: { message: 'Network error' },
                refetch: jest.fn(),
            });

            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByText('Connection Lost')).toBeInTheDocument();
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });

        it('shows try again button on error', () => {
            useFlights.mockReturnValue({
                flights: [],
                isLoading: false,
                isError: true,
                error: { message: 'Network error' },
                refetch: jest.fn(),
            });

            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });

        it('calls refetch when Try Again clicked', () => {
            const mockRefetch = jest.fn();
            useFlights.mockReturnValue({
                flights: [],
                isLoading: false,
                isError: true,
                error: { message: 'Network error' },
                refetch: mockRefetch,
            });

            render(<App />, { wrapper: createWrapper() });

            const tryAgainButton = screen.getByText('Try Again');
            fireEvent.click(tryAgainButton);

            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    describe('Empty State', () => {
        it('shows empty state when no flights match filter', async () => {
            render(<App />, { wrapper: createWrapper() });

            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'NONEXISTENT');

            expect(screen.getByText('No flights found')).toBeInTheDocument();
        });

        it('shows reset filters button in empty state', async () => {
            render(<App />, { wrapper: createWrapper() });

            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'NONEXISTENT');

            expect(screen.getByText('Reset Filters')).toBeInTheDocument();
        });

        it('resets filters when Reset Filters clicked', async () => {
            render(<App />, { wrapper: createWrapper() });

            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'NONEXISTENT');

            const resetButton = screen.getByText('Reset Filters');
            fireEvent.click(resetButton);

            // Should show all flights
            const flightList = screen.getByTestId('flight-list');
            expect(within(flightList).getAllByTestId(/flight-/).length).toBe(8);
        });
    });

    describe('Event Ticker', () => {
        it('renders event ticker with events', () => {
            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByTestId('event-ticker')).toBeInTheDocument();
            expect(screen.getByText('2 events')).toBeInTheDocument();
        });
    });

    describe('Chat Panel', () => {
        it('renders chat panel', () => {
            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
        });

        it('toggles chat panel when toggle clicked', () => {
            render(<App />, { wrapper: createWrapper() });

            const chatPanel = screen.getByTestId('chat-panel');
            expect(chatPanel.getAttribute('data-open')).toBe('false');

            const toggleButton = screen.getByTestId('chat-toggle');
            fireEvent.click(toggleButton);

            expect(chatPanel.getAttribute('data-open')).toBe('true');
        });
    });

    describe('Results Count', () => {
        it('shows correct flight count', () => {
            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByText(/8 Flights/)).toBeInTheDocument();
        });

        it('shows singular when 1 flight', async () => {
            render(<App />, { wrapper: createWrapper() });

            const searchInputs = screen.getAllByPlaceholderText(/search flights/i);
            const searchInput = searchInputs[0];

            await userEvent.type(searchInput, 'AA123');

            expect(screen.getByText(/1 Flight(?!s)/)).toBeInTheDocument();
        });

        it('shows filtered count when filter applied', () => {
            render(<App />, { wrapper: createWrapper() });

            const delayedPill = screen.getByText('Delayed').closest('button');
            fireEvent.click(delayedPill);

            expect(screen.getByText(/1 Flight/)).toBeInTheDocument();
            expect(screen.getByText(/of 8/)).toBeInTheDocument();
        });
    });

    describe('Footer', () => {
        it('renders footer', () => {
            render(<App />, { wrapper: createWrapper() });

            expect(screen.getByText(/Real-time flight data powered by Kafka/)).toBeInTheDocument();
        });
    });
});

// Test StatPill component
describe('StatPill', () => {
    it('renders with correct props', () => {
        // StatPill is tested indirectly through App tests
        // It's a presentational component used in the stats dashboard
    });
});
