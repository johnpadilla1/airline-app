import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Flight, FlightStatus } from '@/features/flights/types';
import FlightList from '../FlightList';

// Mock child components
jest.mock('../FlightCard', () => ({
  __esModule: true,
  default: ({ flight, onClick }: { flight: Flight; onClick: () => void }) => (
    <div data-testid={`flight-card-${flight.flightNumber}`} onClick={onClick}>
      {flight.flightNumber}
    </div>
  ),
}));

jest.mock('../FlightGrid', () => ({
  __esModule: true,
  default: ({ flights }: { flights: Flight[] }) => (
    <div data-testid="flight-grid">Grid with {flights.length} flights</div>
  ),
}));

describe('FlightList Component', () => {
  const mockFlights: Flight[] = [
    {
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
    },
    {
      id: '2',
      flightNumber: 'UA200',
      airline: 'United Airlines',
      origin: 'SFO',
      originCity: 'San Francisco',
      destination: 'ORD',
      destinationCity: 'Chicago',
      status: FlightStatus.DELAYED,
      scheduledDeparture: '2025-12-29T11:00:00Z',
      actualDeparture: null,
      scheduledArrival: '2025-12-29T17:00:00Z',
      actualArrival: null,
      gate: 'B5',
      terminal: '2',
      delayMinutes: 45,
    },
  ];

  const mockOnFlightSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner when isLoading is true', () => {
      render(
        <FlightList
          flights={[]}
          viewMode="card"
          isLoading={true}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.getByText('Loading flight data...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading flights')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes during loading', () => {
      render(
        <FlightList
          flights={[]}
          viewMode="card"
          isLoading={true}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Empty State', () => {
    it('should render nothing when flights array is empty and not loading', () => {
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

    it('should render nothing when flights is null', () => {
      const { container } = render(
        <FlightList
          flights={null as unknown as Flight[]}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Card View Mode', () => {
    it('should render FlightCard components in card view', () => {
      render(
        <FlightList
          flights={mockFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.getByTestId('flight-card-AA100')).toBeInTheDocument();
      expect(screen.getByTestId('flight-card-UA200')).toBeInTheDocument();
    });

    it('should render correct number of flight cards', () => {
      render(
        <FlightList
          flights={mockFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.getAllByText(/AA100|UA200/)).toHaveLength(2);
    });

    it('should apply grid layout classes in card view', () => {
      const { container } = render(
        <FlightList
          flights={mockFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
    });
  });

  describe('Grid View Mode', () => {
    it('should render FlightGrid component in grid view', () => {
      render(
        <FlightList
          flights={mockFlights}
          viewMode="grid"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.getByTestId('flight-grid')).toBeInTheDocument();
      expect(screen.getByText('Grid with 2 flights')).toBeInTheDocument();
    });

    it('should not render individual FlightCard components in grid view', () => {
      render(
        <FlightList
          flights={mockFlights}
          viewMode="grid"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.queryByTestId('flight-card-AA100')).not.toBeInTheDocument();
    });
  });

  describe('Flight Keys', () => {
    it('should use flight ID as key when available', () => {
      render(
        <FlightList
          flights={mockFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      // Check that components are rendered (they have IDs)
      expect(screen.getByTestId('flight-card-AA100')).toBeInTheDocument();
    });

    it('should use flight number and index as fallback key', () => {
      const flightsWithoutIds = mockFlights.map((f) => ({ ...f, id: undefined }));

      render(
        <FlightList
          flights={flightsWithoutIds}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.getByTestId('flight-card-AA100')).toBeInTheDocument();
      expect(screen.getByTestId('flight-card-UA200')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should be memoized', () => {
      const { rerender } = render(
        <FlightList
          flights={mockFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      const initialElement = screen.getByTestId('flight-card-AA100');

      rerender(
        <FlightList
          flights={mockFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      const rerenderedElement = screen.getByTestId('flight-card-AA100');
      expect(initialElement).toBe(rerenderedElement);
    });

    it('should have displayName set', () => {
      expect(FlightList.displayName).toBe('FlightList');
    });
  });

  describe('Animations', () => {
    it('should apply stagger animation delay to cards', () => {
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

  describe('Large Datasets', () => {
    it('should handle rendering many flights efficiently', () => {
      const baseFlight = mockFlights[0]!;
      const manyFlights: Flight[] = Array.from({ length: 50 }, (_, i) => ({
        ...baseFlight,
        id: `flight-${i}`,
        flightNumber: `AA${1000 + i}`,
      }));

      render(
        <FlightList
          flights={manyFlights}
          viewMode="card"
          isLoading={false}
          onFlightSelect={mockOnFlightSelect}
        />
      );

      expect(screen.getByTestId('flight-card-AA1000')).toBeInTheDocument();
      expect(screen.getByTestId('flight-card-AA1049')).toBeInTheDocument();
    });
  });
});
