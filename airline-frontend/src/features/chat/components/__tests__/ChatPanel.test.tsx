import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from '../ChatPanel';

// Mock useChat hook
const mockSendMessage = jest.fn();
const mockClearHistory = jest.fn();
const mockSetInputValue = jest.fn();

jest.mock('@/features/chat/hooks/useChat', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    inputValue: '',
    isLoading: false,
    isStreaming: false,
    streamingContent: '',
    error: null,
    messagesEndRef: { current: null },
    setInputValue: mockSetInputValue,
    sendMessage: mockSendMessage,
    clearHistory: mockClearHistory,
  })),
}));

// Mock ReactMarkdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

describe('ChatPanel Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toggle Button', () => {
    it('should show toggle button when panel is closed', () => {
      render(<ChatPanel isOpen={false} onToggle={mockOnToggle} />);

      expect(screen.getByLabelText('Open AI chat assistant')).toBeInTheDocument();
    });

    it('should not show toggle button when panel is open', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.queryByLabelText('Open AI chat assistant')).not.toBeInTheDocument();
    });

    it('should call onToggle when toggle button is clicked', () => {
      render(<ChatPanel isOpen={false} onToggle={mockOnToggle} />);

      const toggleButton = screen.getByLabelText('Open AI chat assistant');
      fireEvent.click(toggleButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel Visibility', () => {
    it('should be visible when isOpen is true', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('AI flight assistant chat')).toBeInTheDocument();
    });

    it('should have correct transform class when open', () => {
      const { container } = render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const panel = container.querySelector('[role="dialog"]');
      expect(panel).toHaveClass('translate-x-0');
    });

    it('should have correct transform class when closed', () => {
      const { container } = render(<ChatPanel isOpen={false} onToggle={mockOnToggle} />);

      const panel = container.querySelector('[role="dialog"]');
      expect(panel).toHaveClass('translate-x-full');
    });
  });

  describe('Header', () => {
    it('should display header with correct title', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Flight Assistant')).toBeInTheDocument();
      expect(screen.getByText('Ask about flight data')).toBeInTheDocument();
    });

    it('should have close button in header', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
    });

    it('should have clear history button in header', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByLabelText('Clear chat history')).toBeInTheDocument();
    });

    it('should call onToggle when close button is clicked', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const closeButton = screen.getByLabelText('Close chat');
      fireEvent.click(closeButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should call clearHistory when clear button is clicked', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const clearButton = screen.getByLabelText('Clear chat history');
      fireEvent.click(clearButton);

      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('should show welcome message when no messages', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Flight Data Assistant')).toBeInTheDocument();
      expect(screen.getByText('Ask me anything about flights!')).toBeInTheDocument();
    });

    it('should show suggestion buttons', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('"How many flights are delayed?"')).toBeInTheDocument();
      expect(screen.getByText('"Show flights from JFK"')).toBeInTheDocument();
      expect(screen.getByText('"Which airlines have the most flights?"')).toBeInTheDocument();
      expect(screen.getByText('"What flights are boarding now?"')).toBeInTheDocument();
    });
  });

  describe('Input Field', () => {
    it('should render input field', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByPlaceholderText('Ask about flights...')).toBeInTheDocument();
    });

    it('should have send button', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should call setInputValue when typing', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const input = screen.getByPlaceholderText('Ask about flights...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test message' } });

      expect(mockSetInputValue).toHaveBeenCalled();
    });

    it('should call sendMessage when send button is clicked', () => {
      // Mock non-empty input
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [],
        inputValue: 'test message',
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: null,
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should disable send button when input is empty', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const sendButton = screen.getByLabelText('Send message') as HTMLButtonElement;
      expect(sendButton).toBeDisabled();
    });

    it('should disable input when loading', () => {
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [],
        inputValue: '',
        isLoading: true,
        isStreaming: false,
        streamingContent: '',
        error: null,
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const input = screen.getByPlaceholderText('Ask about flights...') as HTMLInputElement;
      expect(input).toBeDisabled();
    });
  });

  describe('Messages Display', () => {
    it('should display user messages', () => {
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
        ],
        inputValue: '',
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: null,
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should display assistant messages', () => {
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [
          { role: 'assistant', content: 'Hi there!', timestamp: new Date() },
        ],
        inputValue: '',
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: null,
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [],
        inputValue: '',
        isLoading: true,
        isStreaming: false,
        streamingContent: '',
        error: null,
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
  });

  describe('Streaming State', () => {
    it('should show streaming content when streaming', () => {
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [],
        inputValue: '',
        isLoading: false,
        isStreaming: true,
        streamingContent: 'Streaming response...',
        error: null,
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Streaming response...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      const useChat = require('@/features/chat/hooks/useChat').useChat;
      useChat.mockReturnValueOnce({
        messages: [],
        inputValue: '',
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: 'Connection failed',
        messagesEndRef: { current: null },
        setInputValue: mockSetInputValue,
        sendMessage: mockSendMessage,
        clearHistory: mockClearHistory,
      });

      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'AI flight assistant chat');
    });

    it('should have proper input label', () => {
      render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      expect(screen.getByLabelText('Chat input')).toBeInTheDocument();
    });
  });

  describe('Backdrop', () => {
    it('should show backdrop when open', () => {
      const { container } = render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const backdrop = container.querySelector('.bg-black\\/20');
      expect(backdrop).toBeInTheDocument();
    });

    it('should call onToggle when backdrop is clicked', () => {
      const { container } = render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);

      const backdrop = container.querySelector('.bg-black\\/20') as HTMLElement;
      fireEvent.click(backdrop);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should be memoized', () => {
      const { rerender } = render(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
      const initialDialog = screen.getByRole('dialog');

      rerender(<ChatPanel isOpen={true} onToggle={mockOnToggle} />);
      const rerenderedDialog = screen.getByRole('dialog');

      expect(initialDialog).toBe(rerenderedDialog);
    });

    it('should have displayName set', () => {
      expect(ChatPanel.displayName).toBe('ChatPanel');
    });
  });
});
