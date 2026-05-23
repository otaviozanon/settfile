import { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../types/errors';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component following React best practices
 * Catches errors in component tree and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const isAppError = error instanceof AppError;
  const isDevelopment = import.meta.env.DEV;

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '600px',
        margin: '2rem auto',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
      }}
    >
      <h2 style={{ color: '#c00', marginTop: 0 }}>
        Something went wrong
      </h2>

      <p style={{ color: '#600' }}>
        {isAppError
          ? error.message
          : 'An unexpected error occurred. Please try again.'}
      </p>

      {isAppError && (
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Error code: <code>{(error as AppError).code}</code>
        </p>
      )}

      {isDevelopment && !isAppError && (
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Error details (dev only)
          </summary>
          <pre
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.85rem',
            }}
          >
            {error.stack}
          </pre>
        </details>
      )}

      <button
        onClick={reset}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
