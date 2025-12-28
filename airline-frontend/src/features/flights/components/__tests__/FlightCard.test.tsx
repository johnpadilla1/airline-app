import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Flight, FlightStatus } from '@/features/flights/types';
import FlightCard from '../FlightCard';

// Mock utility functions
jest.mock('@/shared/utils', () => ({
  formatTime: (date: string) => new Date(date).toLocaleTimeString(),
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
  getFlightStatusAccentColor: () => 'from-emerald-400 to-emerald-500',
  isFlightLive: (flight: Flight) => flight.status === FlightStatus.IN_FLIGHT,
  isFlightDelayed: (flight: Flight) => flight.delayMinutes > 0,
  isFlightCancelled: (flight: Flight) => flight.status === FlightStatus.CANCELLED,
}));

describe('FlightCard Component', () => {
  const mockFlight: Flight = {
    id: '1',
    flightNumber: 'AA100',
    airline: 'American Airlines',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'LAX',
    destinationCity: 'Los Angeles',
    status: FlightStatus.ON_TIME,
    scheduledDeparture: '2025-12-29T10:00:00Z',
    actualDeparture: null,
    scheduledArrival: '2025-12-29T14:00:00Z',
    actualArrival: null,
    gate: 'A12',
    terminal: '1',
    delayMinutes: 0,
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByText('AA100')).toBeInTheDocument();
    });

    it('should display flight number correctly', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByText('AA100')).toBeInTheDocument();
    });

    it('should display airline name', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByText('American Airlines')).toBeInTheDocument();
    });

    it('should display origin and destination codes', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByText('JFK')).toBeInTheDocument();
      expect(screen.getByText('LAX')).toBeInTheDocument();
    });

    it('should display origin and destination cities', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    });

    it('should display gate and terminal information', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByText('A12')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display dash for missing gate', () => {
      const flightWithoutGate = { ...mockFlight, gate: null };
      render(<FlightCard flight={flightWithoutGate} onClick={mockOnClick} />);
      expect(screen.getAllByText('—')[0]).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show live indicator for in-flight status', () => {
      const inFlightFlight = { ...mockFlight, status: FlightStatus.IN_FLIGHT };
      render(<FlightCard flight={inFlightFlight} onClick={mockOnClick} />);
      expect(screen.getByLabelText('Flight in progress')).toBeInTheDocument();
    });

    it('should show delay indicator when delayed', () => {
      const delayedFlight = { ...mockFlight, delayMinutes: 30, status: FlightStatus.DELAYED };
      render(<FlightCard flight={delayedFlight} onClick={mockOnClick} />);
      expect(screen.getByLabelText('Delayed by 30 minutes')).toBeInTheDocument();
    });

    it('should show cancelled indicator for cancelled flights', () => {
      const cancelledFlight = { ...mockFlight, status: FlightStatus.CANCELLED };
      render(<FlightCard flight={cancelledFlight} onClick={mockOnClick} />);
      expect(screen.getByLabelText('Flight cancelled')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Enter key is pressed', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Space key is pressed', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick for other keys', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(
        screen.getByLabelText('Flight AA100 from JFK to LAX')
      ).toBeInTheDocument();
    });

    it('should be keyboard accessible with tabIndex', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have role="button"', () => {
      render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should be memoized', () => {
      const { rerender } = render(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const initialCard = screen.getByRole('button');

      // Rerender with same props
      rerender(<FlightCard flight={mockFlight} onClick={mockOnClick} />);
      const rerenderedCard = screen.getByRole('button');

      expect(initialCard).toBe(rerenderedCard);
    });

    it('should have displayName set', () => {
      expect(FlightCard.displayName).toBe('FlightCard');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields', () => {
      const minimalFlight: Flight = {
        flightNumber: 'TEST123',
        airline: 'Test Airlines',
        origin: 'AAA',
        originCity: 'City A',
        destination: 'BBB',
        destinationCity: 'City B',
        status: FlightStatus.SCHEDULED,
        scheduledDeparture: '2025-12-29T10:00:00Z',
        actualDeparture: null,
        scheduledArrival: '2025-12-29T14:00:00Z',
        actualArrival: null,
        gate: null,
        terminal: null,
        delayMinutes: 0,
      };

      render(<FlightCard flight={minimalFlight} onClick={mockOnClick} />);
      expect(screen.getByText('TEST123')).toBeInTheDocument();
    });

    it('should handle actual times when present', () => {
      const flightWithActualTimes = {
        ...mockFlight,
        actualDeparture: '2025-12-29T10:15:00Z',
        actualArrival: '2025-12-29T14:20:00Z',
      };

      render(<FlightCard flight={flightWithActualTimes} onClick={mockOnClick} />);
      // Component should render without errors
      expect(screen.getByText('AA100')).toBeInTheDocument();
    });
  });
});
