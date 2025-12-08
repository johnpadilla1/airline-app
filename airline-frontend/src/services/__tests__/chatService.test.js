// Polyfill TextEncoder for tests
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch
global.fetch = jest.fn();

describe('chatService', () => {
    let chatService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset sessionStorage mock
        window.sessionStorage.getItem.mockReturnValue(null);
        window.sessionStorage.setItem.mockClear();

        // Clear module cache and re-import
        jest.resetModules();
        chatService = require('../chatService').default;
    });

    describe('Session Management', () => {
        it('generates a unique session ID when none exists', () => {
            window.sessionStorage.getItem.mockReturnValue(null);

            const sessionId = chatService.getSessionId();

            expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
            expect(window.sessionStorage.setItem).toHaveBeenCalled();
        });

        it('returns existing session ID from storage', () => {
            const existingId = 'session-12345-abcdef';
            window.sessionStorage.getItem.mockReturnValue(existingId);

            jest.resetModules();
            const freshService = require('../chatService').default;

            const sessionId = freshService.getSessionId();

            expect(sessionId).toBe(existingId);
        });

        it('resetSession clears and generates new session ID', () => {
            chatService.resetSession();

            expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('chat-session-id');
        });
    });

    describe('sendMessageStream', () => {
        it('makes POST request to stream endpoint', async () => {
            const onToken = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: Hello\n\n'),
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: [DONE]\n\n'),
                    })
                    .mockResolvedValueOnce({ done: true }),
            };

            global.fetch.mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => mockReader,
                },
            });

            await chatService.sendMessageStream('Test', onToken, onComplete, onError);

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/chat/stream',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.stringContaining('"message":"Test"'),
                })
            );
        });

        it('calls onToken for each token received', async () => {
            const onToken = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: Hello\n\n'),
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data:  World\n\n'),
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: [DONE]\n\n'),
                    })
                    .mockResolvedValueOnce({ done: true }),
            };

            global.fetch.mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => mockReader,
                },
            });

            await chatService.sendMessageStream('Test', onToken, onComplete, onError);

            // The implementation includes the space after 'data:' in the token
            expect(onToken).toHaveBeenCalledWith(' Hello');
            expect(onToken).toHaveBeenCalledWith('  World');
        });

        it('calls onComplete with full response when done', async () => {
            const onToken = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: Hello\n\n'),
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: [DONE]\n\n'),
                    })
                    .mockResolvedValueOnce({ done: true }),
            };

            global.fetch.mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => mockReader,
                },
            });

            await chatService.sendMessageStream('Test', onToken, onComplete, onError);

            // The implementation includes the space after 'data:' in the response
            expect(onComplete).toHaveBeenCalledWith(' Hello');
        });

        it('calls onError when fetch fails', async () => {
            const onToken = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            global.fetch.mockRejectedValue(new Error('Network error'));

            await chatService.sendMessageStream('Test', onToken, onComplete, onError);

            expect(onError).toHaveBeenCalledWith('Network error');
        });

        it('calls onError when response is not ok', async () => {
            const onToken = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
            });

            await chatService.sendMessageStream('Test', onToken, onComplete, onError);

            expect(onError).toHaveBeenCalled();
        });

        it('handles escaped newlines in tokens', async () => {
            const onToken = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: Line1\\nLine2\n\n'),
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: [DONE]\n\n'),
                    })
                    .mockResolvedValueOnce({ done: true }),
            };

            global.fetch.mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => mockReader,
                },
            });

            await chatService.sendMessageStream('Test', onToken, onComplete, onError);

            // The implementation includes the space after 'data:' and unescapes newlines
            expect(onToken).toHaveBeenCalledWith(' Line1\nLine2');
        });
    });
});
