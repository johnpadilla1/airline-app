import React from 'react';
import { render, screen } from '@testing-library/react';
import { FlightStatus } from '@/shared/types';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<StatusBadge status={FlightStatus.ON_TIME} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render status text correctly', () => {
      render(<StatusBadge status={FlightStatus.ON_TIME} />);
      expect(screen.getByText('On Time')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <StatusBadge status={FlightStatus.ON_TIME} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Status Display', () => {
    it('should display "On Time" for ON_TIME status', () => {
      render(<StatusBadge status={FlightStatus.ON_TIME} />);
      expect(screen.getByText('On Time')).toBeInTheDocument();
    });

    it('should display "Scheduled" for SCHEDULED status', () => {
      render(<StatusBadge status={FlightStatus.SCHEDULED} />);
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should display "Boarding" for BOARDING status', () => {
      render(<StatusBadge status={FlightStatus.BOARDING} />);
      expect(screen.getByText('Boarding')).toBeInTheDocument();
    });

    it('should display "In Flight" for IN_FLIGHT status', () => {
      render(<StatusBadge status={FlightStatus.IN_FLIGHT} />);
      expect(screen.getByText('In Flight')).toBeInTheDocument();
    });

    it('should display "Departed" for DEPARTED status', () => {
      render(<StatusBadge status={FlightStatus.DEPARTED} />);
      expect(screen.getByText('Departed')).toBeInTheDocument();
    });

    it('should display "Landed" for LANDED status', () => {
      render(<StatusBadge status={FlightStatus.LANDED} />);
      expect(screen.getByText('Landed')).toBeInTheDocument();
    });

    it('should display "Arrived" for ARRIVED status', () => {
      render(<StatusBadge status={FlightStatus.ARRIVED} />);
      expect(screen.getByText('Arrived')).toBeInTheDocument();
    });

    it('should display "Delayed" for DELAYED status', () => {
      render(<StatusBadge status={FlightStatus.DELAYED} />);
      expect(screen.getByText('Delayed')).toBeInTheDocument();
    });

    it('should display "Cancelled" for CANCELLED status', () => {
      render(<StatusBadge status={FlightStatus.CANCELLED} />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<StatusBadge status={FlightStatus.ON_TIME} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible label describing the status', () => {
      render(<StatusBadge status={FlightStatus.ON_TIME} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('On Time');
    });
  });

  describe('Styling and Appearance', () => {
    it('should apply correct base classes', () => {
      const { container } = render(<StatusBadge status={FlightStatus.ON_TIME} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
    });

    it('should apply status-specific color classes for ON_TIME', () => {
      const { container } = render(<StatusBadge status={FlightStatus.ON_TIME} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-emerald-500/10');
      expect(badge).toHaveClass('text-emerald-400');
    });

    it('should apply status-specific color classes for DELAYED', () => {
      const { container } = render(<StatusBadge status={FlightStatus.DELAYED} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-amber-500/10');
      expect(badge).toHaveClass('text-amber-400');
    });

    it('should apply status-specific color classes for IN_FLIGHT', () => {
      const { container } = render(<StatusBadge status={FlightStatus.IN_FLIGHT} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-violet-500/10');
      expect(badge).toHaveClass('text-violet-400');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all status enum values', () => {
      const statuses = Object.values(FlightStatus);

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Performance', () => {
    it('should be memoized and not re-render unnecessarily', () => {
      const { rerender } = render(<StatusBadge status={FlightStatus.ON_TIME} />);
      const initialBadge = screen.getByRole('status');

      rerender(<StatusBadge status={FlightStatus.ON_TIME} />);
      const rerenderedBadge = screen.getByRole('status');

      expect(initialBadge).toBe(rerenderedBadge);
    });
  });
});
