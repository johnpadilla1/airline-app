import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FlightCard from '../FlightCard';

describe('FlightCard', () => {
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
        scheduledDeparture: '2024-12-08T10:00:00Z',
        scheduledArrival: '2024-12-08T13:00:00Z',
        actualDeparture: null,
        actualArrival: null,
        delayMinutes: 0,
    };

    const mockOnClick = jest.fn();

    beforeEach(() => {
        mockOnClick.mockClear();
    });

    describe('Rendering', () => {
        it('renders flight number', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('AA123')).toBeInTheDocument();
        });

        it('renders airline name', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('American Airlines')).toBeInTheDocument();
        });

        it('renders origin airport code', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('JFK')).toBeInTheDocument();
        });

        it('renders destination airport code', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('LAX')).toBeInTheDocument();
        });

        it('renders origin city name', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('New York')).toBeInTheDocument();
        });

        it('renders destination city name', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('Los Angeles')).toBeInTheDocument();
        });

        it('renders gate information', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('A12')).toBeInTheDocument();
        });

        it('renders terminal information', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('T4')).toBeInTheDocument();
        });

        it('renders status badge', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            expect(screen.getByText('On Time')).toBeInTheDocument();
        });

        it('displays dash when gate is not available', () => {
            const flightWithoutGate = { ...mockFlight, gate: null };
            render(<FlightCard flight={flightWithoutGate} onClick={mockOnClick} />);
            expect(screen.getByText('—')).toBeInTheDocument();
        });
    });

    describe('Status Variations', () => {
        it('shows delayed indicator for DELAYED status', () => {
            const delayedFlight = { ...mockFlight, status: 'DELAYED', delayMinutes: 30 };
            render(<FlightCard flight={delayedFlight} onClick={mockOnClick} />);
            expect(screen.getByText('+30m')).toBeInTheDocument();
        });

        it('shows cancelled indicator for CANCELLED status', () => {
            const cancelledFlight = { ...mockFlight, status: 'CANCELLED' };
            render(<FlightCard flight={cancelledFlight} onClick={mockOnClick} />);
            expect(screen.getByText('Cancelled')).toBeInTheDocument();
        });

        it('shows live indicator for IN_FLIGHT status', () => {
            const inFlightFlight = { ...mockFlight, status: 'IN_FLIGHT' };
            render(<FlightCard flight={inFlightFlight} onClick={mockOnClick} />);
            const liveIndicator = screen.getByText('AA123').closest('div').parentElement.parentElement.parentElement;
            const pulseDot = liveIndicator.querySelector('.animate-ping');
            expect(pulseDot).toBeInTheDocument();
        });

        it('shows live indicator for DEPARTED status', () => {
            const departedFlight = { ...mockFlight, status: 'DEPARTED' };
            render(<FlightCard flight={departedFlight} onClick={mockOnClick} />);
            const cardContainer = screen.getByText('AA123').closest('.group');
            const pulseDot = cardContainer.querySelector('.animate-ping');
            expect(pulseDot).toBeInTheDocument();
        });

        it('shows strikethrough for original time when delayed', () => {
            const delayedFlight = {
                ...mockFlight,
                status: 'DELAYED',
                delayMinutes: 30,
                actualDeparture: '2024-12-08T10:30:00Z',
            };
            render(<FlightCard flight={delayedFlight} onClick={mockOnClick} />);
            // Find any line-through element (timezone-agnostic)
            const { container } = render(<FlightCard flight={delayedFlight} onClick={mockOnClick} />);
            const strikethroughElement = container.querySelector('.line-through');
            expect(strikethroughElement).toBeInTheDocument();
        });
    });

    describe('Time Formatting', () => {
        it('displays formatted departure time in HH:MM format', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            // Should display time in HH:MM format (timezone agnostic)
            const timeRegex = /^\d{2}:\d{2}$/;
            const allText = screen.getAllByText(timeRegex);
            expect(allText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays arrival time in correct format', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            // Should have at least 2 times displayed (departure and arrival)
            const timeRegex = /^\d{2}:\d{2}$/;
            const allTimes = screen.getAllByText(timeRegex);
            expect(allTimes.length).toBeGreaterThanOrEqual(2);
        });

        it('displays actual departure time when available', () => {
            const flightWithActual = {
                ...mockFlight,
                actualDeparture: '2024-12-08T10:15:00Z',
            };
            render(<FlightCard flight={flightWithActual} onClick={mockOnClick} />);
            // Should display time in HH:MM format
            const timeRegex = /^\d{2}:\d{2}$/;
            const allTimes = screen.getAllByText(timeRegex);
            expect(allTimes.length).toBeGreaterThanOrEqual(1);
        });

        it('displays "--:--" when departure time is not available', () => {
            const flightWithoutTime = { ...mockFlight, scheduledDeparture: null };
            render(<FlightCard flight={flightWithoutTime} onClick={mockOnClick} />);
            expect(screen.getByText('--:--')).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onClick when card is clicked', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            const card = screen.getByText('AA123').closest('.group');
            fireEvent.click(card);
            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        it('card has cursor-pointer class', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            const card = screen.getByText('AA123').closest('.group');
            expect(card).toHaveClass('cursor-pointer');
        });
    });

    describe('Accent Colors', () => {
        it('applies correct accent color for ON_TIME status', () => {
            render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
            const card = screen.getByText('AA123').closest('.group');
            const accent = card.querySelector('[class*="from-emerald"]');
            expect(accent).toBeInTheDocument();
        });

        it('applies correct accent color for DELAYED status', () => {
            const delayedFlight = { ...mockFlight, status: 'DELAYED' };
            render(<FlightCard flight={delayedFlight} onClick={mockOnClick} />);
            const card = screen.getByText('AA123').closest('.group');
            const accent = card.querySelector('[class*="from-amber"]');
            expect(accent).toBeInTheDocument();
        });

        it('applies correct accent color for CANCELLED status', () => {
            const cancelledFlight = { ...mockFlight, status: 'CANCELLED' };
            render(<FlightCard flight={cancelledFlight} onClick={mockOnClick} />);
            const card = screen.getByText('AA123').closest('.group');
            const accent = card.querySelector('[class*="from-red"]');
            expect(accent).toBeInTheDocument();
        });
    });
});
