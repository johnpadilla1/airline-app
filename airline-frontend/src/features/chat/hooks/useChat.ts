import { useState, useCallback, useEffect, useRef } from 'react';
import chatService from '@/features/chat/api/chatService';
import type { DisplayMessage } from '@/features/chat/types';

/**
 * UseChat hook return type
 */
export interface UseChatReturn {
  messages: DisplayMessage[];
  inputValue: string;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setInputValue: (value: string) => void;
  sendMessage: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

/**
 * useChat Hook
 * 
 * Custom hook for managing AI chat functionality.
 * Handles message state, streaming responses, history loading, and error states.
 * Follows React best practices for custom hooks with proper separation of concerns.
 * 
 * @returns UseChatReturn object with chat state and actions
 * 
 * @example
 * ```tsx
 * const { messages, inputValue, sendMessage, clearHistory } = useChat();
 * ```
 */
export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatService.getHistory();
        if (history && history.length > 0) {
          setMessages(
            history.map((msg) => ({
              role: msg.role.toLowerCase() as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, []);

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  /**
   * Send a message to the chat service
   */
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    // Add user message to UI
    const newUserMessage: DisplayMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      await chatService.sendMessageStream(
        userMessage,
        // onToken - called for each streamed token
        (token: string) => {
          setIsLoading(false);
          setIsStreaming(true);
          setStreamingContent((prev) => prev + token);
        },
        // onComplete - called when streaming is done
        (fullResponse: string) => {
          setIsStreaming(false);
          setStreamingContent('');
          const assistantMessage: DisplayMessage = {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        // onError - called on error
        (errorMsg: string) => {
          setIsLoading(false);
          setIsStreaming(false);
          setStreamingContent('');
          setError(errorMsg || 'An error occurred');
        }
      );
    } catch (err) {
      console.error('Chat error:', err);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      setError('Failed to send message. Please try again.');
    }
  }, [inputValue, isLoading]);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, []);

  return {
    messages,
    inputValue,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    messagesEndRef,
    setInputValue,
    sendMessage,
    clearHistory,
  };
}
