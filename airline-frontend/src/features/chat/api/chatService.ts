import axios, { AxiosInstance } from 'axios';
import { ChatMessage } from '@/shared/types';

/**
 * Chat Service
 * Handles AI chat functionality with streaming support
 */

const API_BASE_URL = '/api';

/**
 * Generate or retrieve a unique session ID for this browser session
 * @returns Session ID string
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('chat-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('chat-session-id', sessionId);
  }
  return sessionId;
};

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Unescape JSON-escaped strings
 * @param str - String to unescape
 * @returns Unescaped string
 */
function unescapeJson(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Chat Service API
 * Provides methods for interacting with the AI chat assistant
 */
export const chatService = {
  /**
   * Send a chat message (non-streaming)
   * @param message - User message
   * @returns Promise with chat response
   */
  sendMessage: async (message: string): Promise<unknown> => {
    const response = await api.post('/chat', {
      message,
      sessionId: getSessionId(),
    });
    return response.data;
  },

  /**
   * Send a chat message with streaming response
   * @param message - User message
   * @param onToken - Callback for each received token
   * @param onComplete - Callback when stream is complete
   * @param onError - Callback if an error occurs
   */
  sendMessageStream: async (
    message: string,
    onToken: (token: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: string) => void
  ): Promise<void> => {
    const sessionId = getSessionId();

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (separated by double newlines)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue;

          // Parse SSE data lines
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              // Get everything after 'data:' - don't trim to preserve spaces
              const data = line.slice(5);

              if (data === '[DONE]' || data.trim() === '[DONE]') {
                console.log('Stream complete, full response:', fullResponse);
                onComplete(fullResponse);
                return;
              } else if (data.trim().startsWith('{') && data.includes('"error"')) {
                try {
                  const errorObj = JSON.parse(data.trim());
                  onError((errorObj as { error: string }).error);
                  return;
                } catch {
                  // Not JSON, treat as token - unescape any escaped chars
                  const token = unescapeJson(data);
                  fullResponse += token;
                  onToken(token);
                }
              } else if (data.length > 0) {
                // Unescape any escaped characters (like \n for newlines)
                const token = unescapeJson(data);
                console.log('Token:', JSON.stringify(token));
                fullResponse += token;
                onToken(token);
              }
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5);
            if (data === '[DONE]' || data.trim() === '[DONE]') {
              onComplete(fullResponse);
              return;
            } else if (data.length > 0) {
              const token = unescapeJson(data);
              fullResponse += token;
              onToken(token);
            }
          }
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      console.error('Stream error:', error);
      onError(error instanceof Error ? error.message : 'Failed to connect to chat service');
    }
  },

  /**
   * Get chat history for current session
   * @returns Promise<ChatMessage[]> Array of chat messages
   */
  getHistory: async (): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/chat/history/${getSessionId()}`);
    return response.data;
  },

  /**
   * Clear chat history for current session
   */
  clearHistory: async (): Promise<void> => {
    await api.delete(`/chat/history/${getSessionId()}`);
  },

  /**
   * Reset session (generates new session ID)
   */
  resetSession: (): void => {
    sessionStorage.removeItem('chat-session-id');
    getSessionId(); // Generate new one
  },

  /**
   * Get current session ID
   * @returns Current session ID
   */
  getSessionId,
};

export default chatService;
