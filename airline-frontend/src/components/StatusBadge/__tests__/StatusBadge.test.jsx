import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
    describe('Status Labels', () => {
        it('renders "On Time" for ON_TIME status', () => {
            render(<StatusBadge status="ON_TIME" />);
            expect(screen.getByText('On Time')).toBeInTheDocument();
        });

        it('renders "Scheduled" for SCHEDULED status', () => {
            render(<StatusBadge status="SCHEDULED" />);
            expect(screen.getByText('Scheduled')).toBeInTheDocument();
        });

        it('renders "Delayed" for DELAYED status', () => {
            render(<StatusBadge status="DELAYED" />);
            expect(screen.getByText('Delayed')).toBeInTheDocument();
        });

        it('renders "Boarding" for BOARDING status', () => {
            render(<StatusBadge status="BOARDING" />);
            expect(screen.getByText('Boarding')).toBeInTheDocument();
        });

        it('renders "Departed" for DEPARTED status', () => {
            render(<StatusBadge status="DEPARTED" />);
            expect(screen.getByText('Departed')).toBeInTheDocument();
        });

        it('renders "In Flight" for IN_FLIGHT status', () => {
            render(<StatusBadge status="IN_FLIGHT" />);
            expect(screen.getByText('In Flight')).toBeInTheDocument();
        });

        it('renders "Arrived" for ARRIVED status', () => {
            render(<StatusBadge status="ARRIVED" />);
            expect(screen.getByText('Arrived')).toBeInTheDocument();
        });

        it('renders "Landed" for LANDED status', () => {
            render(<StatusBadge status="LANDED" />);
            expect(screen.getByText('Landed')).toBeInTheDocument();
        });

        it('renders "Cancelled" for CANCELLED status', () => {
            render(<StatusBadge status="CANCELLED" />);
            expect(screen.getByText('Cancelled')).toBeInTheDocument();
        });

        it('renders "Diverted" for DIVERTED status', () => {
            render(<StatusBadge status="DIVERTED" />);
            expect(screen.getByText('Diverted')).toBeInTheDocument();
        });

        it('renders formatted status for unknown status', () => {
            render(<StatusBadge status="UNKNOWN_STATUS" />);
            expect(screen.getByText('UNKNOWN STATUS')).toBeInTheDocument();
        });

        it('renders "Unknown" when status is undefined', () => {
            render(<StatusBadge />);
            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });

    describe('Size Variants', () => {
        it('applies small size classes when size is "sm"', () => {
            render(<StatusBadge status="ON_TIME" size="sm" />);
            const badge = screen.getByText('On Time').parentElement;
            expect(badge).toHaveClass('text-[10px]');
        });

        it('applies medium size classes by default', () => {
            render(<StatusBadge status="ON_TIME" />);
            const badge = screen.getByText('On Time').parentElement;
            expect(badge).toHaveClass('text-xs');
        });

        it('applies large size classes when size is "lg"', () => {
            render(<StatusBadge status="ON_TIME" size="lg" />);
            const badge = screen.getByText('On Time').parentElement;
            expect(badge).toHaveClass('text-sm');
        });
    });

    describe('Status Dot', () => {
        it('renders a status dot', () => {
            render(<StatusBadge status="ON_TIME" />);
            const badge = screen.getByText('On Time').parentElement;
            const dots = badge.querySelectorAll('[class*="rounded-full"]');
            expect(dots.length).toBeGreaterThan(0);
        });

        it('renders pulse animation for DELAYED status', () => {
            render(<StatusBadge status="DELAYED" />);
            const badge = screen.getByText('Delayed').parentElement;
            const pulseElement = badge.querySelector('.animate-ping');
            expect(pulseElement).toBeInTheDocument();
        });

        it('renders pulse animation for BOARDING status', () => {
            render(<StatusBadge status="BOARDING" />);
            const badge = screen.getByText('Boarding').parentElement;
            const pulseElement = badge.querySelector('.animate-ping');
            expect(pulseElement).toBeInTheDocument();
        });

        it('does not render pulse animation for ON_TIME status', () => {
            render(<StatusBadge status="ON_TIME" />);
            const badge = screen.getByText('On Time').parentElement;
            const pulseElement = badge.querySelector('.animate-ping');
            expect(pulseElement).not.toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('has correct styles for ON_TIME (emerald)', () => {
            render(<StatusBadge status="ON_TIME" />);
            const badge = screen.getByText('On Time').parentElement;
            expect(badge).toHaveClass('text-emerald-400');
        });

        it('has correct styles for DELAYED (amber)', () => {
            render(<StatusBadge status="DELAYED" />);
            const badge = screen.getByText('Delayed').parentElement;
            expect(badge).toHaveClass('text-amber-400');
        });

        it('has correct styles for CANCELLED (red)', () => {
            render(<StatusBadge status="CANCELLED" />);
            const badge = screen.getByText('Cancelled').parentElement;
            expect(badge).toHaveClass('text-red-400');
        });
    });
});
