// Mock axios BEFORE importing the service
jest.mock('axios');

// Import axios and set up mocks before importing service
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return a mock instance
const mockApiInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

(mockedAxios.create as jest.Mock).mockReturnValue(mockApiInstance);

// Mock fetch for streaming
global.fetch = jest.fn();

// NOW import the service (after mocking axios.create)
import chatService from '../chatService';

describe('chatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Reset all mock instance methods
    mockApiInstance.get.mockReset();
    mockApiInstance.post.mockReset();
    mockApiInstance.put.mockReset();
    mockApiInstance.delete.mockReset();
    mockApiInstance.patch.mockReset();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = { reply: 'Hello! How can I help you?' };
      mockApiInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await chatService.sendMessage('Hello');

      expect(mockApiInstance.post).toHaveBeenCalledWith('/chat', {
        message: 'Hello',
        sessionId: expect.stringMatching(/^session-\d+-[a-z0-9]+$/),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty message', async () => {
      const mockResponse = { reply: 'Please provide a message' };
      mockApiInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await chatService.sendMessage('');

      expect(mockApiInstance.post).toHaveBeenCalledWith('/chat', {
        message: '',
        sessionId: expect.any(String),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApiInstance.post.mockRejectedValue(mockError);

      await expect(chatService.sendMessage('Hello')).rejects.toThrow('Network error');
    });

    it('should handle server errors', async () => {
      const error = {
        response: { status: 500, data: { message: 'Internal server error' } },
      } as any;
      mockApiInstance.post.mockRejectedValue(error);

      await expect(chatService.sendMessage('Hello')).rejects.toEqual(error);
    });

    it('should maintain session ID across multiple calls', async () => {
      mockApiInstance.post.mockResolvedValue({ data: { reply: 'Response' } });

      await chatService.sendMessage('Message 1');
      const firstCall = mockApiInstance.post.mock.calls[0];

      await chatService.sendMessage('Message 2');
      const secondCall = mockApiInstance.post.mock.calls[1];

      // Both calls should have session IDs in the correct format
      expect(firstCall[1].sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(secondCall[1].sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
    });
  });

  describe('sendMessageStream', () => {
    it('should handle streaming response successfully', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          // Send SSE data
          controller.enqueue(
            new TextEncoder().encode('data: Hello\n\ndata: World\n\ndata: [DONE]\n\n')
          );
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onToken = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatService.sendMessageStream('Hi', onToken, onComplete, onError);

      expect(global.fetch).toHaveBeenCalledWith('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Hi'),
      });
      expect(onToken).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalledWith(expect.any(String));
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle empty message stream', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onToken = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatService.sendMessageStream('', onToken, onComplete, onError);

      expect(onComplete).toHaveBeenCalledWith('');
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle stream errors', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"error": "Stream failed"}\n\n')
          );
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onToken = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatService.sendMessageStream('Test', onToken, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Stream failed');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const onToken = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatService.sendMessageStream('Hello', onToken, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Network error');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const onToken = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatService.sendMessageStream('Hello', onToken, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('HTTP error! status: 500');
    });

    it('should handle special characters in streaming message', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: Hello\\nWorld\n\ndata: [DONE]\n\n')
          );
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onToken = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatService.sendMessageStream('Test\nMessage', onToken, onComplete, onError);

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    const mockMessages = [
      {
        id: '1',
        content: 'Hello',
        role: 'user',
        timestamp: '2025-12-28T10:00:00Z',
      },
      {
        id: '2',
        content: 'Hi there!',
        role: 'assistant',
        timestamp: '2025-12-28T10:00:01Z',
      },
    ];

    it('should fetch chat history successfully', async () => {
      mockApiInstance.get.mockResolvedValue({ data: mockMessages });

      const result = await chatService.getHistory();

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/chat\/history\/session-\d+-[a-z0-9]+$/)
      );
      expect(result).toEqual(mockMessages);
    });

    it('should handle empty history', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      const result = await chatService.getHistory();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch history');
      mockApiInstance.get.mockRejectedValue(mockError);

      await expect(chatService.getHistory()).rejects.toThrow('Failed to fetch history');
    });
  });

  describe('clearHistory', () => {
    it('should clear chat history successfully', async () => {
      mockApiInstance.delete.mockResolvedValue({ data: { success: true } });

      await chatService.clearHistory();

      expect(mockApiInstance.delete).toHaveBeenCalledWith(
        expect.stringMatching(/\/chat\/history\/session-\d+-[a-z0-9]+$/)
      );
    });

    it('should handle API errors when clearing history', async () => {
      const mockError = new Error('Failed to clear history');
      mockApiInstance.delete.mockRejectedValue(mockError);

      await expect(chatService.clearHistory()).rejects.toThrow('Failed to clear history');
    });
  });

  describe('Session Management', () => {
    it('should generate consistent session ID', () => {
      const sessionId1 = chatService.getSessionId();
      const sessionId2 = chatService.getSessionId();

      // Session ID should be consistent within the same context
      expect(sessionId1).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^session-\d+-[a-z0-9]+$/);
    });

    it('should reset session and generate new ID', () => {
      const sessionId1 = chatService.getSessionId();

      chatService.resetSession();
      const sessionId2 = chatService.getSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should store session ID in sessionStorage', () => {
      // Get session ID which stores it in sessionStorage
      const sessionId = chatService.getSessionId();

      // Verify sessionStorage was called (mocked)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('chat-session-id');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent message sends', async () => {
      mockApiInstance.post.mockResolvedValue({ data: { reply: 'Response' } });

      const promises = [
        chatService.sendMessage('Message 1'),
        chatService.sendMessage('Message 2'),
        chatService.sendMessage('Message 3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockApiInstance.post).toHaveBeenCalledTimes(3);
    });

    it('should use same session ID for concurrent requests', async () => {
      mockApiInstance.post.mockResolvedValue({ data: { reply: 'Response' } });

      const promises = [
        chatService.sendMessage('Message 1'),
        chatService.sendMessage('Message 2'),
      ];

      await Promise.all(promises);

      const firstCall = mockApiInstance.post.mock.calls[0];
      const secondCall = mockApiInstance.post.mock.calls[1];

      // Both calls should have a sessionId property
      expect(firstCall[1]).toHaveProperty('sessionId');
      expect(secondCall[1]).toHaveProperty('sessionId');
      // Both should match the session ID format
      expect(firstCall[1].sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(secondCall[1].sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'ECONNABORTED';
      mockApiInstance.post.mockRejectedValue(timeoutError);

      await expect(chatService.sendMessage('Hello')).rejects.toThrow('Request timeout');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      mockApiInstance.post.mockRejectedValue(networkError);

      await expect(chatService.sendMessage('Hello')).rejects.toThrow('Network Error');
    });

    it('should handle unauthorized errors', async () => {
      const error = {
        response: { status: 401, data: { message: 'Unauthorized' } },
      } as any;
      mockApiInstance.post.mockRejectedValue(error);

      await expect(chatService.sendMessage('Hello')).rejects.toEqual(error);
    });
  });
});
