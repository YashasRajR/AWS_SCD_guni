import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Application-level boundary. Data-fetch failures never reach here (each
 * section's hook catches those and renders <ErrorState/> inline) — this
 * only catches genuine render-time bugs, so one broken component can't take
 * the whole site down with it.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error in the application tree:', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="full-page-status">
          <div className="state-panel state-panel-error" role="alert">
            <h1 style={{ fontSize: 'var(--text-h3)' }}>Something went wrong</h1>
            <p>This page hit an unexpected error. Reloading usually fixes it.</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
