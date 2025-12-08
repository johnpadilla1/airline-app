import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ViewToggle from '../ViewToggle';

describe('ViewToggle', () => {
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        mockOnToggle.mockClear();
    });

    describe('Rendering', () => {
        it('renders two toggle buttons', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);
        });

        it('renders Card View button with correct title', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const cardButton = screen.getByTitle('Card View');
            expect(cardButton).toBeInTheDocument();
        });

        it('renders List View button with correct title', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const listButton = screen.getByTitle('List View');
            expect(listButton).toBeInTheDocument();
        });
    });

    describe('Active State', () => {
        it('shows card button as active when viewMode is "card"', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const cardButton = screen.getByTitle('Card View');
            expect(cardButton).toHaveClass('bg-sky-500');
            expect(cardButton).toHaveClass('text-white');
        });

        it('shows list button as active when viewMode is "grid"', () => {
            render(<ViewToggle viewMode="grid" onToggle={mockOnToggle} />);
            const listButton = screen.getByTitle('List View');
            expect(listButton).toHaveClass('bg-sky-500');
            expect(listButton).toHaveClass('text-white');
        });

        it('shows card button as inactive when viewMode is "grid"', () => {
            render(<ViewToggle viewMode="grid" onToggle={mockOnToggle} />);
            const cardButton = screen.getByTitle('Card View');
            expect(cardButton).not.toHaveClass('bg-sky-500');
            expect(cardButton).toHaveClass('text-slate-400');
        });

        it('shows list button as inactive when viewMode is "card"', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const listButton = screen.getByTitle('List View');
            expect(listButton).not.toHaveClass('bg-sky-500');
            expect(listButton).toHaveClass('text-slate-400');
        });
    });

    describe('Click Handlers', () => {
        it('calls onToggle with "card" when Card View button is clicked', () => {
            render(<ViewToggle viewMode="grid" onToggle={mockOnToggle} />);
            const cardButton = screen.getByTitle('Card View');
            fireEvent.click(cardButton);
            expect(mockOnToggle).toHaveBeenCalledWith('card');
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });

        it('calls onToggle with "grid" when List View button is clicked', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);
            expect(mockOnToggle).toHaveBeenCalledWith('grid');
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('Accessibility', () => {
        it('has button role for both toggles', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);
        });

        it('has descriptive title attributes', () => {
            render(<ViewToggle viewMode="card" onToggle={mockOnToggle} />);
            expect(screen.getByTitle('Card View')).toBeInTheDocument();
            expect(screen.getByTitle('List View')).toBeInTheDocument();
        });
    });
});
