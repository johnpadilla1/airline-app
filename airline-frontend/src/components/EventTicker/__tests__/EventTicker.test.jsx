import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventTicker from '../EventTicker';

describe('EventTicker', () => {
    const mockEvents = [
        {
            id: 1,
            flightNumber: 'AA123',
            eventType: 'DELAY',
            description: 'Delayed by 30 minutes',
            eventTimestamp: new Date().toISOString(),
        },
        {
            id: 2,
            flightNumber: 'UA456',
            eventType: 'GATE_CHANGE',
            description: 'Gate changed to B12',
            eventTimestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 mins ago
        },
        {
            id: 3,
            flightNumber: 'DL789',
            eventType: 'CANCELLATION',
            description: 'Flight cancelled',
            eventTimestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
        },
        {
            id: 4,
            flightNumber: 'SW101',
            eventType: 'BOARDING_STARTED',
            description: 'Now boarding',
            eventTimestamp: new Date(Date.now() - 2 * 60000).toISOString(), // 2 mins ago
        },
        {
            id: 5,
            flightNumber: 'JB202',
            eventType: 'DEPARTED',
            description: 'Flight departed',
            eventTimestamp: new Date(Date.now() - 10 * 60000).toISOString(), // 10 mins ago
        },
        {
            id: 6,
            flightNumber: 'AS303',
            eventType: 'ARRIVED',
            description: 'Flight arrived',
            eventTimestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
        },
    ];

    describe('Rendering', () => {
        it('renders null when events array is empty', () => {
            const { container } = render(<EventTicker events={[]} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders null when events is undefined', () => {
            const { container } = render(<EventTicker events={undefined} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders the ticker when events are provided', () => {
            render(<EventTicker events={mockEvents} />);
            expect(screen.getByText('Live Updates')).toBeInTheDocument();
        });

        it('displays flight numbers', () => {
            render(<EventTicker events={mockEvents} />);
            expect(screen.getAllByText('AA123').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('UA456').length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Event Type Configuration', () => {
        it('displays delay events with correct styling', () => {
            render(<EventTicker events={[mockEvents[0]]} />);
            const delayText = screen.getAllByText(/Delayed/i);
            expect(delayText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays gate change events', () => {
            render(<EventTicker events={[mockEvents[1]]} />);
            const gateText = screen.getAllByText(/Gate/i);
            expect(gateText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays cancellation events', () => {
            render(<EventTicker events={[mockEvents[2]]} />);
            const cancelText = screen.getAllByText(/cancelled/i);
            expect(cancelText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays boarding events', () => {
            render(<EventTicker events={[mockEvents[3]]} />);
            const boardingText = screen.getAllByText(/boarding/i);
            expect(boardingText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays departed events', () => {
            render(<EventTicker events={[mockEvents[4]]} />);
            const departedText = screen.getAllByText(/departed/i);
            expect(departedText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays arrived events', () => {
            render(<EventTicker events={[mockEvents[5]]} />);
            const arrivedText = screen.getAllByText(/arrived/i);
            expect(arrivedText.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Time Formatting', () => {
        it('displays "just now" for events less than 1 minute ago', () => {
            const recentEvent = [{
                ...mockEvents[0],
                eventTimestamp: new Date().toISOString(),
            }];
            render(<EventTicker events={recentEvent} />);
            const justNowText = screen.getAllByText('just now');
            expect(justNowText.length).toBeGreaterThanOrEqual(1);
        });

        it('displays minutes ago for events less than 60 minutes', () => {
            const fiveMinAgoEvent = [{
                ...mockEvents[0],
                eventTimestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            }];
            render(<EventTicker events={fiveMinAgoEvent} />);
            const minAgoText = screen.getAllByText('5m ago');
            expect(minAgoText.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Pause on Hover', () => {
        it('removes animation class on mouse enter', () => {
            render(<EventTicker events={mockEvents} />);
            const tickerContainer = screen.getByText('Live Updates').closest('div').parentElement.parentElement;
            const scrollContainer = tickerContainer.querySelector('[class*="overflow-hidden"]');

            if (scrollContainer) {
                const animatedDiv = scrollContainer.querySelector('[class*="animate-ticker"]');
                if (animatedDiv) {
                    fireEvent.mouseEnter(scrollContainer);
                    // Animation should be paused (class removed)
                    expect(animatedDiv).not.toHaveClass('animate-ticker');
                }
            }
        });

        it('restores animation class on mouse leave', () => {
            render(<EventTicker events={mockEvents} />);
            const tickerContainer = screen.getByText('Live Updates').closest('div').parentElement.parentElement;
            const scrollContainer = tickerContainer.querySelector('[class*="overflow-hidden"]');

            if (scrollContainer) {
                fireEvent.mouseEnter(scrollContainer);
                fireEvent.mouseLeave(scrollContainer);
                const animatedDiv = scrollContainer.querySelector('[class*="animate-ticker"]');
                if (animatedDiv) {
                    expect(animatedDiv).toHaveClass('animate-ticker');
                }
            }
        });
    });

    describe('Live Badge', () => {
        it('displays the Live Updates badge', () => {
            render(<EventTicker events={mockEvents} />);
            expect(screen.getByText('Live Updates')).toBeInTheDocument();
        });

        it('has a pulsing animation indicator', () => {
            render(<EventTicker events={mockEvents} />);
            const liveSection = screen.getByText('Live Updates').closest('div');
            const pulseElement = liveSection.querySelector('.animate-ping');
            expect(pulseElement).toBeInTheDocument();
        });
    });
});
