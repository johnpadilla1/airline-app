import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import chatService from '@/features/chat/api/chatService';

/**
 * Icon component props
 */
interface IconProps {
  className?: string;
}

/**
 * Chat Icon
 */
const ChatIcon = React.memo<IconProps>(({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
));
ChatIcon.displayName = 'ChatIcon';

/**
 * Close Icon
 */
const CloseIcon = React.memo<IconProps>(({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
));
CloseIcon.displayName = 'CloseIcon';

/**
 * Send Icon
 */
const SendIcon = React.memo<IconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
));
SendIcon.displayName = 'SendIcon';

/**
 * Sparkle Icon
 */
const SparkleIcon = React.memo<IconProps>(({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
));
SparkleIcon.displayName = 'SparkleIcon';

/**
 * Trash Icon
 */
const TrashIcon = React.memo<IconProps>(({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
));
TrashIcon.displayName = 'TrashIcon';

/**
 * ChatPanel Props
 */
interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Display message type (extended for UI)
 */
interface DisplayMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sql?: string;
}

/**
 * ChatPanel Component
 *
 * AI-powered chat assistant panel with streaming responses.
 * Features message history, Markdown rendering, and SQL query display.
 * Memoized for performance with comprehensive accessibility.
 *
 * @example
 * ```tsx
 * <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
 * ```
 */
const ChatPanel = React.memo<ChatPanelProps>(({ isOpen, onToggle, className = '' }) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Load history on mount
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

  // Handle send message
  const handleSendMessage = useCallback(async () => {
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

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle clear history
  const handleClearHistory = useCallback(async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);

  // Keep only last 6 messages in view (matching backend)
  const displayMessages = messages.slice(-6);

  return (
    <>
      {/* Toggle Button - Only show when chat is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-6 bottom-6 z-50 p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800"
          title="Open AI Assistant"
          aria-label="Open AI chat assistant"
          type="button"
        >
          <ChatIcon className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" aria-hidden="true" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white items-center justify-center">
              <SparkleIcon className="w-2 h-2 text-slate-800" />
            </span>
          </span>
        </button>
      )}

      {/* Chat Panel */}
      <div
        className={`fixed right-0 top-0 h-full z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${className}`}
        style={{ width: '600px' }}
        role="dialog"
        aria-modal="true"
        aria-label="AI flight assistant chat"
      >
        <div className="h-full border-l border-theme flex flex-col bg-theme-primary">
          {/* Header */}
          <div className="p-5 border-b border-theme flex items-center justify-between bg-theme-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center" aria-hidden="true">
                <SparkleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-theme-primary">Flight Assistant</h2>
                <p className="text-xs text-theme-muted">Ask about flight data</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-2 rounded-lg hover:bg-theme-tertiary text-theme-muted hover:text-theme-primary transition-colors"
                title="Clear chat history"
                aria-label="Clear chat history"
                type="button"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-theme-tertiary text-theme-muted hover:text-theme-primary transition-colors"
                title="Close chat"
                aria-label="Close chat"
                type="button"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-secondary">
            {displayMessages.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-500/10 flex items-center justify-center">
                  <ChatIcon className="w-8 h-8 text-theme-muted" />
                </div>
                <h3 className="text-theme-primary font-medium mb-2">Flight Data Assistant</h3>
                <p className="text-sm text-theme-muted mb-4">Ask me anything about flights!</p>
                <div className="space-y-2 text-left">
                  <p className="text-xs text-theme-muted font-medium uppercase tracking-wider mb-2">
                    Try asking:
                  </p>
                  {['How many flights are delayed?', 'Show flights from JFK', 'Which airlines have the most flights?', 'What flights are boarding now?'].map(
                    (suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-theme-tertiary hover:bg-hover-bg text-theme-secondary hover:text-theme-primary transition-colors border border-theme"
                        type="button"
                      >
                        "{suggestion}"
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' ? 'text-white' : 'bg-theme-tertiary text-theme-primary border border-theme'
                  }`}
                  style={message.role === 'user' ? { backgroundColor: '#1e293b' } : {}}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose-chat">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}

                  {message.sql && (
                    <details className="mt-2">
                      <summary className="text-xs opacity-70 cursor-pointer hover:opacity-100">
                        View SQL Query
                      </summary>
                      <pre className="mt-1 text-xs bg-black/10 rounded p-2 overflow-x-auto font-mono">
                        {message.sql}
                      </pre>
                    </details>
                  )}

                  <span className="text-xs opacity-50 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start" role="status" aria-live="polite">
                <div className="bg-theme-tertiary border border-theme rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true" />
                      <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true" />
                      <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true" />
                    </div>
                    <span className="text-sm text-theme-muted">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <div className="flex justify-start" role="status" aria-live="polite">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-theme-tertiary text-theme-primary border border-theme">
                  <div className="prose-chat">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                  <span className="inline-block w-0.5 h-4 bg-theme-primary animate-pulse ml-0.5 align-middle" aria-hidden="true" />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3" role="alert">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-theme bg-theme-primary">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about flights..."
                className="flex-1 bg-theme-secondary border border-theme rounded-xl px-4 py-3 text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50"
                disabled={isLoading || isStreaming}
                aria-label="Chat input"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isStreaming}
                className="p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                style={{
                  backgroundColor: !inputValue.trim() || isLoading || isStreaming ? '#94a3b8' : '#1e293b',
                }}
                aria-label="Send message"
                type="button"
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-xs text-theme-muted mt-2 text-center">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;
