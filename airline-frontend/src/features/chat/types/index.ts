/**
 * Chat feature types
 */

/**
 * Chat message role type
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message interface from API
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

/**
 * Display message type (extended for UI)
 */
export interface DisplayMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  sql?: string;
}

/**
 * Chat API response interface
 */
export interface ChatResponse {
  message: string;
  sql?: string;
  error?: string;
}

/**
 * Chat history response
 */
export type ChatHistory = ChatMessage[];

/**
 * Chat service interface
 */
export interface ChatService {
  sendMessageStream: (
    message: string,
    onToken: (token: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: string) => void
  ) => Promise<void>;
  getHistory: () => Promise<ChatHistory>;
  clearHistory: () => Promise<void>;
}
