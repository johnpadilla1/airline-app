module.exports = {
    // Use jsdom for DOM testing
    testEnvironment: 'jsdom',

    // Setup files to run after jest is initialized
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Module name mappings for CSS and assets
    moduleNameMapper: {
        // Handle CSS imports (with identity-obj-proxy)
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle image imports
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
        // Handle path aliases
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@/features/(.*)$': '<rootDir>/src/features/$1',
    },

    // Transform files with ts-jest and babel-jest
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        }],
        '^.+\\.(js|jsx)$': 'babel-jest',
    },

    // Files to ignore when transforming - allow certain ESM modules
    transformIgnorePatterns: [
        '/node_modules/(?!(react-markdown|remark-parse|unified|bail|is-plain-obj|trough|vfile|vfile-message|unist-util-stringify-position|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|unist-util-position|unist-util-visit|unist-util-is|remark-rehype|mdast-util-to-hast|trim-lines|unist-util-visit-parents|ccount|devlop|escape-string-regexp|markdown-table|mdast-util-find-and-replace|mdast-util-to-markdown|mdast-util-phrasing|longest-streak|zswitch|hast-util-to-jsx-runtime|style-to-object|inline-style-parser)/)',
    ],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/main.tsx',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.test.tsx',
        '!src/**/__tests__/**',
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Verbose output
    verbose: true,
};
