import React from 'react';
import { render, screen } from '@testing-library/react';
import FlightList from '../FlightList';

// Mock child components
jest.mock('../FlightCard', () => {
    return function MockFlightCard({ flight, onClick }) {
        return (
            <div data-testid="flight-card" onClick={onClick}>
                {flight.flightNumber}
            </div>
        );
    };
});

jest.mock('../FlightGrid', () => {
    return function MockFlightGrid({ flights, onFlightSelect }) {
        return (
            <div data-testid="flight-grid">
                {flights.map(f => (
                    <div key={f.id} onClick={() => onFlightSelect(f)}>
                        {f.flightNumber}
                    </div>
                ))}
            </div>
        );
    };
});

describe('FlightList', () => {
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
    ];

    const mockOnFlightSelect = jest.fn();

    beforeEach(() => {
        mockOnFlightSelect.mockClear();
    });

    describe('Loading State', () => {
        it('renders loading spinner when isLoading is true', () => {
            render(
                <FlightList
                    flights={[]}
                    viewMode="card"
                    isLoading={true}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(screen.getByText('Loading flight data...')).toBeInTheDocument();
        });

        it('renders loading animation elements', () => {
            const { container } = render(
                <FlightList
                    flights={[]}
                    viewMode="card"
                    isLoading={true}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            const spinners = container.querySelectorAll('.animate-spin');
            expect(spinners.length).toBeGreaterThan(0);
        });

        it('does not render flights when loading', () => {
            render(
                <FlightList
                    flights={mockFlights}
                    viewMode="card"
                    isLoading={true}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(screen.queryByTestId('flight-card')).not.toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('returns null when flights array is empty and not loading', () => {
            const { container } = render(
                <FlightList
                    flights={[]}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(container.firstChild).toBeNull();
        });

        it('returns null when flights is undefined', () => {
            const { container } = render(
                <FlightList
                    flights={undefined}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(container.firstChild).toBeNull();
        });
    });

    describe('View Modes', () => {
        it('renders FlightGrid when viewMode is "grid"', () => {
            render(
                <FlightList
                    flights={mockFlights}
                    viewMode="grid"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(screen.getByTestId('flight-grid')).toBeInTheDocument();
        });

        it('renders FlightCards when viewMode is "card"', () => {
            render(
                <FlightList
                    flights={mockFlights}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(screen.getAllByTestId('flight-card')).toHaveLength(2);
        });

        it('renders correct number of cards for each flight', () => {
            render(
                <FlightList
                    flights={mockFlights}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(screen.getByText('AA123')).toBeInTheDocument();
            expect(screen.getByText('UA456')).toBeInTheDocument();
        });
    });

    describe('Card View Layout', () => {
        it('renders cards in a grid container', () => {
            const { container } = render(
                <FlightList
                    flights={mockFlights}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            const grid = container.querySelector('.grid');
            expect(grid).toBeInTheDocument();
            expect(grid).toHaveClass('grid-cols-1');
        });

        it('applies stagger animation delay to cards', () => {
            const { container } = render(
                <FlightList
                    flights={mockFlights}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            const animatedDivs = container.querySelectorAll('.animate-slide-up');
            expect(animatedDivs.length).toBe(2);
        });
    });

    describe('Props Passing', () => {
        it('passes flights to FlightGrid in grid mode', () => {
            render(
                <FlightList
                    flights={mockFlights}
                    viewMode="grid"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            expect(screen.getByText('AA123')).toBeInTheDocument();
            expect(screen.getByText('UA456')).toBeInTheDocument();
        });

        it('passes onFlightSelect to child components', () => {
            render(
                <FlightList
                    flights={mockFlights}
                    viewMode="card"
                    isLoading={false}
                    onFlightSelect={mockOnFlightSelect}
                />
            );
            const card = screen.getByText('AA123').closest('[data-testid="flight-card"]');
            card.click();
            expect(mockOnFlightSelect).toHaveBeenCalled();
        });
    });
});
