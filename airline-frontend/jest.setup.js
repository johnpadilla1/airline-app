// Jest DOM extends Jest with custom matchers for DOM nodes
import '@testing-library/jest-dom';

// Import React for test environment
import React from 'react';

// Make React available globally for tests
global.React = React;

// Polyfill TextEncoder/TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill ReadableStream for Node.js environment
import { ReadableStream } from 'web-streams-polyfill';
global.ReadableStream = ReadableStream;

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock EventSource for SSE
const mockEventSource = function(url) {
    this.url = url;
    this.readyState = 0;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSED = 2;

    // Store event listeners
    this._listeners = {};

    this.addEventListener = function(event, handler) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(handler);
    };

    this.removeEventListener = function(event, handler) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(h => h !== handler);
        }
    };

    this.close = function() {
        this.readyState = this.CLOSED;
    };

    // Helper to trigger events for testing
    this._triggerEvent = function(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(handler => {
                handler({ data, type: event });
            });
        }
    };

    return this;
};

global.EventSource = mockEventSource;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Suppress console errors during tests (optional)
// console.error = jest.fn();
