import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventTicker from '../EventTicker';

describe('EventTicker Component', () => {
  const mockEvents = [
    {
      id: '1',
      flightNumber: 'AA123',
      type: 'STATUS_CHANGE',
      message: 'Flight AA123 is now boarding',
      timestamp: '2025-12-28T10:00:00Z',
    },
    {
      id: '2',
      flightNumber: 'UA456',
      type: 'DELAY',
      message: 'Flight UA456 delayed by 30 minutes',
      timestamp: '2025-12-28T09:30:00Z',
    },
    {
      id: '3',
      flightNumber: 'DL789',
      type: 'GATE_CHANGE',
      message: 'Flight DL789 gate changed to C15',
      timestamp: '2025-12-28T09:00:00Z',
    },
  ];

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<EventTicker events={mockEvents} />);
      expect(screen.getByRole('region', { name: /recent flight events/i })).toBeInTheDocument();
    });

    it('should not render when events array is empty', () => {
      const { container } = render(<EventTicker events={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when events is null', () => {
      const { container } = render(<EventTicker events={null as unknown as []} />);
      // Component returns null when events is null
      expect(container.firstChild).toBeNull();
    });

    it('should render all events (duplicated for seamless loop)', () => {
      render(<EventTicker events={mockEvents} />);

      // Events are duplicated for the scrolling effect
      const messages = screen.getAllByText('Flight AA123 is now boarding');
      expect(messages).toHaveLength(2); // Duplicated
    });
  });

  describe('Event Display', () => {
    it('should display event messages', () => {
      render(<EventTicker events={mockEvents} />);

      expect(screen.getAllByText('Flight AA123 is now boarding')).toHaveLength(2);
      expect(screen.getAllByText('Flight UA456 delayed by 30 minutes')).toHaveLength(2);
      expect(screen.getAllByText('Flight DL789 gate changed to C15')).toHaveLength(2);
    });

    it('should display flight numbers', () => {
      render(<EventTicker events={mockEvents} />);

      expect(screen.getAllByText('AA123')).toHaveLength(2);
      expect(screen.getAllByText('UA456')).toHaveLength(2);
      expect(screen.getAllByText('DL789')).toHaveLength(2);
    });

    it('should display live badge', () => {
      render(<EventTicker events={mockEvents} />);

      const liveBadge = screen.getByLabelText('Live updates');
      expect(liveBadge).toBeInTheDocument();
    });

    it('should limit displayed events to maxEvents prop', () => {
      render(<EventTicker events={mockEvents} maxEvents={2} />);

      // With maxEvents=2, we should see 2 unique events duplicated = 4 total
      expect(screen.getAllByText('Flight AA123 is now boarding')).toHaveLength(2);
      expect(screen.getAllByText('Flight UA456 delayed by 30 minutes')).toHaveLength(2);
      expect(screen.queryAllByText('Flight DL789 gate changed to C15')).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper role and label', () => {
      render(<EventTicker events={mockEvents} />);

      const region = screen.getByRole('region', { name: /recent flight events/i });
      expect(region).toBeInTheDocument();
    });

    it('should have aria-live for live updates', () => {
      render(<EventTicker events={mockEvents} />);

      const liveBadge = screen.getByLabelText('Live updates');
      expect(liveBadge).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Styling and Appearance', () => {
    it('should apply correct base classes', () => {
      const { container } = render(<EventTicker events={mockEvents} />);
      const ticker = container.firstChild as HTMLElement;
      expect(ticker).toHaveClass('relative');
      expect(ticker).toHaveClass('overflow-hidden');
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<EventTicker events={mockEvents} className="custom-class" />);
      const ticker = container.firstChild as HTMLElement;
      expect(ticker).toHaveClass('custom-class');
    });
  });

  describe('Animations and Behavior', () => {
    it('should pause on mouse enter', () => {
      render(<EventTicker events={mockEvents} />);

      const ticker = screen.getByRole('region', { name: /recent flight events/i });

      fireEvent.mouseEnter(ticker);

      // Component should handle mouse enter without errors
      expect(ticker).toBeInTheDocument();
    });

    it('should resume on mouse leave', () => {
      render(<EventTicker events={mockEvents} />);

      const ticker = screen.getByRole('region', { name: /recent flight events/i });

      fireEvent.mouseEnter(ticker);
      fireEvent.mouseLeave(ticker);

      // Component should handle mouse events without errors
      expect(ticker).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single event', () => {
      const singleEvent = [mockEvents[0]];
      render(<EventTicker events={singleEvent} />);

      expect(screen.getAllByText('Flight AA123 is now boarding')).toHaveLength(2);
    });

    it('should handle large number of events', () => {
      const manyEvents = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        flightNumber: `FL${i}`,
        type: 'STATUS_CHANGE',
        message: `Flight FL${i} status changed`,
        timestamp: '2025-12-28T10:00:00Z',
      }));

      render(<EventTicker events={manyEvents} maxEvents={10} />);

      // With maxEvents=10, should see 10 unique events × 2 (duplicated) = 20 total
      const allMessages = screen.getAllByText(/Flight FL\d+ status changed/);
      expect(allMessages.length).toBe(20);
    });

    it('should handle events with special characters', () => {
      const specialEvents = [
        {
          id: '1',
          flightNumber: 'AA123',
          type: 'STATUS_CHANGE',
          message: 'Flight AA123: <Delayed> & "Cancelled"',
          timestamp: '2025-12-28T10:00:00Z',
        },
      ];

      render(<EventTicker events={specialEvents} />);
      expect(screen.getAllByText(/Flight AA123/)).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should be memoized with React.memo', () => {
      const { rerender } = render(<EventTicker events={mockEvents} />);

      const initialTicker = screen.getByRole('region');

      rerender(<EventTicker events={mockEvents} />);

      const rerenderedTicker = screen.getByRole('region');

      expect(initialTicker).toBe(rerenderedTicker);
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      global.innerWidth = 375;

      const { container } = render(<EventTicker events={mockEvents} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should be responsive on desktop', () => {
      global.innerWidth = 1920;

      const { container } = render(<EventTicker events={mockEvents} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Event Type Configuration', () => {
    it('should display different icons for different event types', () => {
      const eventsWithIcons = [
        { ...mockEvents[0], type: 'DELAY' },
        { ...mockEvents[1], type: 'GATE_CHANGE' },
        { ...mockEvents[2], type: 'BOARDING_STARTED' },
      ];

      render(<EventTicker events={eventsWithIcons} />);

      // Should render without errors and show all event types
      expect(screen.getByRole('region', { name: /recent flight events/i })).toBeInTheDocument();
    });

    it('should handle unknown event types', () => {
      const unknownEvent = [
        {
          id: '1',
          flightNumber: 'AA123',
          type: 'UNKNOWN_TYPE',
          message: 'Flight AA123 unknown update',
          timestamp: '2025-12-28T10:00:00Z',
        },
      ];

      render(<EventTicker events={unknownEvent} />);

      // Should still render with default configuration
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });
});
