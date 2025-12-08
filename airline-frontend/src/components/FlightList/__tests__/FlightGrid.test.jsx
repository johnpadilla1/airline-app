import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FlightGrid from '../FlightGrid';

describe('FlightGrid', () => {
    const mockFlights = [
        {
            id: 1,
            flightNumber: 'AA123',
            airline: 'American Airlines',
            origin: 'JFK',
            originCity: 'New York',
            destination: 'LAX',
            destinationCity: 'Los Angeles',
            status: 'ON_TIME',
            gate: 'A12',
            scheduledDeparture: '2024-12-08T10:00:00Z',
            scheduledArrival: '2024-12-08T13:00:00Z',
            delayMinutes: 0,
        },
        {
            id: 2,
            flightNumber: 'UA456',
            airline: 'United Airlines',
            origin: 'ORD',
            originCity: 'Chicago',
            destination: 'SFO',
            destinationCity: 'San Francisco',
            status: 'DELAYED',
            gate: 'B5',
            scheduledDeparture: '2024-12-08T14:00:00Z',
            scheduledArrival: '2024-12-08T16:30:00Z',
            delayMinutes: 45,
        },
        {
            id: 3,
            flightNumber: 'DL789',
            airline: 'Delta Airlines',
            origin: 'ATL',
            originCity: 'Atlanta',
            destination: 'MIA',
            destinationCity: 'Miami',
            status: 'IN_FLIGHT',
            gate: 'C8',
            scheduledDeparture: '2024-12-08T08:00:00Z',
            scheduledArrival: '2024-12-08T10:00:00Z',
            delayMinutes: 0,
        },
    ];

    const mockOnFlightSelect = jest.fn();

    beforeEach(() => {
        mockOnFlightSelect.mockClear();
    });

    describe('Rendering', () => {
        it('renders table header', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('Flight')).toBeInTheDocument();
            expect(screen.getByText('Route')).toBeInTheDocument();
            expect(screen.getByText('Departure')).toBeInTheDocument();
            expect(screen.getByText('Arrival')).toBeInTheDocument();
            expect(screen.getByText('Gate')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
        });

        it('renders all flights', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('AA123')).toBeInTheDocument();
            expect(screen.getByText('UA456')).toBeInTheDocument();
            expect(screen.getByText('DL789')).toBeInTheDocument();
        });

        it('renders flight numbers with mono font', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            const flightNumber = screen.getByText('AA123');
            expect(flightNumber).toHaveClass('font-mono');
        });

        it('renders airline names', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('American Airlines')).toBeInTheDocument();
            expect(screen.getByText('United Airlines')).toBeInTheDocument();
            expect(screen.getByText('Delta Airlines')).toBeInTheDocument();
        });
    });

    describe('Route Display', () => {
        it('renders origin and destination airports', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('JFK')).toBeInTheDocument();
            expect(screen.getByText('LAX')).toBeInTheDocument();
            expect(screen.getByText('ORD')).toBeInTheDocument();
            expect(screen.getByText('SFO')).toBeInTheDocument();
        });

        it('renders city names', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('New York')).toBeInTheDocument();
            expect(screen.getByText('Los Angeles')).toBeInTheDocument();
        });
    });

    describe('Time Display', () => {
        it('formats times in HH:MM format', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            // Should display times in HH:MM format (timezone agnostic)
            const timeRegex = /^\d{2}:\d{2}$/;
            const allTimes = screen.getAllByText(timeRegex);
            // 3 flights x 2 times (departure + arrival) = 6 times
            expect(allTimes.length).toBeGreaterThanOrEqual(6);
        });

        it('displays times for each flight row', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            // Each flight should have departure and arrival times
            const timeRegex = /^\d{2}:\d{2}$/;
            const allTimes = screen.getAllByText(timeRegex);
            expect(allTimes.length).toBeGreaterThanOrEqual(6);
        });
    });

    describe('Gate Display', () => {
        it('renders gate information', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('A12')).toBeInTheDocument();
            expect(screen.getByText('B5')).toBeInTheDocument();
            expect(screen.getByText('C8')).toBeInTheDocument();
        });

        it('displays dash when gate is not available', () => {
            const flightsWithoutGate = [{ ...mockFlights[0], gate: null }];
            render(<FlightGrid flights={flightsWithoutGate} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('—')).toBeInTheDocument();
        });
    });

    describe('Status Display', () => {
        it('renders status badges for each flight', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('On Time')).toBeInTheDocument();
            expect(screen.getByText('Delayed')).toBeInTheDocument();
            expect(screen.getByText('In Flight')).toBeInTheDocument();
        });

        it('shows delay indicator for delayed flights', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            expect(screen.getByText('+45m')).toBeInTheDocument();
        });

        it('shows live indicator for IN_FLIGHT status', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            const flightRow = screen.getByText('DL789').closest('div');
            const pulseIndicator = flightRow.querySelector('.animate-ping');
            expect(pulseIndicator).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onFlightSelect with correct flight when row is clicked', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            const flightRow = screen.getByText('AA123').closest('[class*="grid-cols-12"]');
            fireEvent.click(flightRow);
            expect(mockOnFlightSelect).toHaveBeenCalledWith(mockFlights[0]);
        });

        it('calls onFlightSelect for different flights', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            const flightRow = screen.getByText('UA456').closest('[class*="grid-cols-12"]');
            fireEvent.click(flightRow);
            expect(mockOnFlightSelect).toHaveBeenCalledWith(mockFlights[1]);
        });

        it('has hover styles on rows', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            const flightRow = screen.getByText('AA123').closest('[class*="grid-cols-12"]');
            expect(flightRow).toHaveClass('cursor-pointer');
        });
    });

    describe('Animation', () => {
        it('applies stagger animation delay to rows', () => {
            render(<FlightGrid flights={mockFlights} onFlightSelect={mockOnFlightSelect} />);
            const rows = screen.getAllByText(/AA123|UA456|DL789/).map(el =>
                el.closest('[class*="grid-cols-12"]')
            );

            rows.forEach((row, index) => {
                if (row) {
                    expect(row).toHaveClass('animate-slide-up');
                }
            });
        });
    });
});
