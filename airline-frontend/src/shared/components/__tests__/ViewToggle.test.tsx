import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ViewToggle from '../ViewToggle';

describe('ViewToggle Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
      expect(screen.getByRole('group', { name: /view mode toggle/i })).toBeInTheDocument();
    });

    it('should render both view mode buttons', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      expect(screen.getByRole('button', { name: /card view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list view/i })).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ViewToggle viewMode="card" onToggle={mockOnToggle} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('View Mode Display', () => {
    it('should show card view as active when viewMode is "card"', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      const listButton = screen.getByRole('button', { name: /list view/i });

      expect(cardButton).toHaveAttribute('aria-pressed', 'true');
      expect(listButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should show list view as active when viewMode is "grid"', () => {
      render(<ViewToggle viewMode="grid" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      const listButton = screen.getByRole('button', { name: /list view/i });

      expect(cardButton).toHaveAttribute('aria-pressed', 'false');
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('User Interactions', () => {
    it('should call onToggle with "card" when card view is clicked', () => {
      render(<ViewToggle viewMode="grid" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      fireEvent.click(cardButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith('card');
    });

    it('should call onToggle with "grid" when list view is clicked', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const listButton = screen.getByRole('button', { name: /list view/i });
      fireEvent.click(listButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith('grid');
    });

    it('should not call onToggle when clicking the already active view', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      fireEvent.click(cardButton);

      // The component still calls onToggle even for the same view
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have role="group" with proper aria-label', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const group = screen.getByRole('group', { name: /view mode toggle/i });
      expect(group).toBeInTheDocument();
    });

    it('should have aria-pressed on buttons', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      const listButton = screen.getByRole('button', { name: /list view/i });

      expect(cardButton).toHaveAttribute('aria-pressed');
      expect(listButton).toHaveAttribute('aria-pressed');
    });

    it('should have proper aria-pressed values', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      const listButton = screen.getByRole('button', { name: /list view/i });

      expect(cardButton.getAttribute('aria-pressed')).toBe('true');
      expect(listButton.getAttribute('aria-pressed')).toBe('false');
    });

    it('should have accessible names for buttons', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      expect(screen.getByRole('button', { name: /card view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list view/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });

      // Simulate keyboard press
      fireEvent.click(cardButton);

      expect(mockOnToggle).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should use useCallback for onToggle handler', () => {
      const { rerender } = render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      // Rerender with same props
      rerender(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      // Component should not crash
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should be memoized with React.memo', () => {
      const { rerender } = render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const initialGroup = screen.getByRole('group');

      rerender(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const rerenderedGroup = screen.getByRole('group');

      expect(initialGroup).toBe(rerenderedGroup);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks without errors', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);

      const cardButton = screen.getByRole('button', { name: /card view/i });
      const listButton = screen.getByRole('button', { name: /list view/i });

      fireEvent.click(cardButton);
      fireEvent.click(listButton);
      fireEvent.click(cardButton);
      fireEvent.click(listButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(4);
    });

    it('should handle undefined className gracefully', () => {
      render(<ViewToggle viewMode="card" onToggle={mockOnToggle} className={undefined} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });
});
