import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 *
 * A React Error Boundary that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the entire app.
 *
 * This follows React best practices for error handling and provides a better user experience.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // TODO: Send error to error reporting service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleResetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} resetError={this.handleResetError} />;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-md w-full">
            <div className="glass-strong rounded-3xl p-12 text-center animate-scale-in">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-labelledby="error-icon-title"
                >
                  <title id="error-icon-title">Error occurred</title>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              {/* Error Message */}
              <h2 className="text-2xl font-semibold text-white mb-3">Something went wrong</h2>
              <p className="text-slate-400 mb-8">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleResetError}
                  className="btn-primary px-8 py-3 text-lg"
                  type="button"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn-glass px-8 py-3 text-lg"
                  type="button"
                >
                  Go to Home
                </button>
              </div>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400">
                    Error Details
                  </summary>
                  <pre className="mt-2 p-4 bg-slate-800 rounded-lg text-xs text-red-400 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary for functional components
 * Note: This is not a replacement for class-based Error Boundary, but a complementary utility
 */

/**
 * Custom hook for handling errors in async operations
 * @returns Error thrower function
 */
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    throw error;
  };
}

export default ErrorBoundary;
