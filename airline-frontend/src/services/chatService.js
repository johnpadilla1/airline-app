import axios from 'axios';

const API_BASE_URL = '/api';

// Generate a unique session ID for this browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('chat-session-id');
  if (!sessionId) {
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('chat-session-id', sessionId);
  }
  return sessionId;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  // Send a chat message (non-streaming)
  sendMessage: async (message) => {
    const response = await api.post('/chat', {
      message,
      sessionId: getSessionId(),
    });
    return response.data;
  },

  // Send a chat message with streaming response
  sendMessageStream: async (message, onToken, onComplete, onError) => {
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

      const reader = response.body.getReader();
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
                  onError(errorObj.error);
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
      onError(error.message || 'Failed to connect to chat service');
    }
  },

  // Get chat history for current session
  getHistory: async () => {
    const response = await api.get(`/chat/history/${getSessionId()}`);
    return response.data;
  },

  // Clear chat history
  clearHistory: async () => {
    await api.delete(`/chat/history/${getSessionId()}`);
  },

  // Reset session (generates new session ID)
  resetSession: () => {
    sessionStorage.removeItem('chat-session-id');
    getSessionId(); // Generate new one
  },

  // Get current session ID
  getSessionId,
};

// Helper to unescape JSON-escaped strings
function unescapeJson(str) {
  if (!str) return '';
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

export default chatService;
