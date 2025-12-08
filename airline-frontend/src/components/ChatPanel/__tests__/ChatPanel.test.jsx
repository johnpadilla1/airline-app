import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-markdown before importing ChatPanel
jest.mock('react-markdown', () => {
    return function MockReactMarkdown({ children }) {
        return <div data-testid="react-markdown">{children}</div>;
    };
});

// Mock chatService
jest.mock('../../../services/chatService', () => ({
    __esModule: true,
    default: {
        sendMessageStream: jest.fn(),
        getHistory: jest.fn(),
        clearHistory: jest.fn(),
    },
}));

import ChatPanel from '../ChatPanel';
import chatService from '../../../services/chatService';

describe('ChatPanel', () => {
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        mockOnToggle.mockClear();
        chatService.sendMessageStream.mockClear();
        chatService.getHistory.mockResolvedValue([]);
        chatService.clearHistory.mockResolvedValue();
    });

    describe('Toggle Button (Closed State)', () => {
        it('renders toggle button when chat is closed', () => {
            render(<ChatPanel isOpen={false} onToggle={mockOnToggle} />);
            const toggleButton = screen.getByTitle('Open AI Assistant');
            expect(toggleButton).toBeInTheDocument();
        });

        it('calls onToggle when toggle button is clicked', () => {
            render(<ChatPanel isOpen={false} onToggle={mockOnToggle} />);
            const toggleButton = screen.getByTitle('Open AI Assistant');
            fireEvent.click(toggleButton);
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });

        it('does not render toggle button when chat is open', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            expect(screen.queryByTitle('Open AI Assistant')).not.toBeInTheDocument();
        });
    });

    describe('Chat Panel (Open State)', () => {
        it('renders chat header when open', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            expect(screen.getByText('Flight Assistant')).toBeInTheDocument();
        });

        it('renders subtitle', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            expect(screen.getByText('Ask about flight data')).toBeInTheDocument();
        });

        it('renders close button', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const closeButton = screen.getByTitle('Close chat');
            expect(closeButton).toBeInTheDocument();
        });

        it('calls onToggle when close button is clicked', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const closeButton = screen.getByTitle('Close chat');
            fireEvent.click(closeButton);
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });

        it('renders clear history button', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const clearButton = screen.getByTitle('Clear chat history');
            expect(clearButton).toBeInTheDocument();
        });

        it('renders input field', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const input = screen.getByPlaceholderText('Ask about flights...');
            expect(input).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('renders welcome message when no messages', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            expect(screen.getByText('Flight Data Assistant')).toBeInTheDocument();
        });

        it('renders suggestions', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            expect(screen.getByText('"How many flights are delayed?"')).toBeInTheDocument();
            expect(screen.getByText('"Show flights from JFK"')).toBeInTheDocument();
            expect(screen.getByText('"Which airlines have the most flights?"')).toBeInTheDocument();
            expect(screen.getByText('"What flights are boarding now?"')).toBeInTheDocument();
        });

        it('populates input when suggestion is clicked', async () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const suggestion = screen.getByText('"How many flights are delayed?"');
            fireEvent.click(suggestion);

            const input = screen.getByPlaceholderText('Ask about flights...');
            expect(input.value).toBe('How many flights are delayed?');
        });
    });

    describe('Input Handling', () => {
        it('updates input value on change', async () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const input = screen.getByPlaceholderText('Ask about flights...');

            await userEvent.type(input, 'Test message');
            expect(input.value).toBe('Test message');
        });
    });

    describe('Send Message', () => {
        it('clears input after sending message', async () => {
            chatService.sendMessageStream.mockImplementation((msg, onToken, onComplete) => {
                onComplete('Response');
                return Promise.resolve();
            });

            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const input = screen.getByPlaceholderText('Ask about flights...');

            await userEvent.type(input, 'Test message');
            fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

            await waitFor(() => {
                expect(input.value).toBe('');
            });
        });

        it('sends message on Enter key', async () => {
            chatService.sendMessageStream.mockImplementation((msg, onToken, onComplete) => {
                onComplete('Response');
                return Promise.resolve();
            });

            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const input = screen.getByPlaceholderText('Ask about flights...');

            await userEvent.type(input, 'Test message');
            fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

            await waitFor(() => {
                expect(chatService.sendMessageStream).toHaveBeenCalledWith(
                    'Test message',
                    expect.any(Function),
                    expect.any(Function),
                    expect.any(Function)
                );
            });
        });

        it('does not send on Shift+Enter', async () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const input = screen.getByPlaceholderText('Ask about flights...');

            await userEvent.type(input, 'Test message');
            fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

            expect(chatService.sendMessageStream).not.toHaveBeenCalled();
        });
    });

    describe('Clear History', () => {
        it('calls clearHistory when clear button is clicked', async () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const clearButton = screen.getByTitle('Clear chat history');

            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(chatService.clearHistory).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Chat History Loading', () => {
        it('loads history on mount', async () => {
            const mockHistory = [
                { role: 'USER', content: 'Hello', timestamp: new Date().toISOString() },
                { role: 'ASSISTANT', content: 'Hi there!', timestamp: new Date().toISOString() },
            ];
            chatService.getHistory.mockResolvedValue(mockHistory);

            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

            await waitFor(() => {
                expect(chatService.getHistory).toHaveBeenCalled();
            });
        });
    });

    describe('Disclaimer', () => {
        it('shows AI disclaimer', () => {
            render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            expect(screen.getByText(/AI can make mistakes/i)).toBeInTheDocument();
        });
    });

    describe('Mobile Backdrop', () => {
        it('renders backdrop when open', () => {
            const { container } = render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const backdrop = container.querySelector('.backdrop-blur-sm');
            expect(backdrop).toBeInTheDocument();
        });

        it('calls onToggle when backdrop is clicked', () => {
            const { container } = render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
            const backdrop = container.querySelector('.backdrop-blur-sm');

            if (backdrop) {
                fireEvent.click(backdrop);
                expect(mockOnToggle).toHaveBeenCalledTimes(1);
            }
        });
    });
});
