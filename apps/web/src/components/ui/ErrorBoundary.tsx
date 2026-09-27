import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

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
        <div className="full-page-status" style={{ padding: '40px 20px' }}>
          <div className="k mut" style={{ maxWidth: '420px', margin: '0 auto', alignItems: 'center', textAlign: 'center', padding: '28px', gap: '14px' }} role="alert">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="22" fill="#232F3E" />
              <path d="M24 15V27" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
              <circle cx="24" cy="33" r="2.2" fill="#FF9900" />
            </svg>
            <p className="lbl" style={{ fontSize: '16px' }}>Something broke on our side.</p>
            <p className="tx" style={{ color: 'var(--muted)' }}>This page hit an unexpected error. Reloading usually fixes it.</p>
            <div className="r" style={{ gap: '10px' }}>
              <button type="button" className="btn o" onClick={() => window.location.reload()}>
                Reload
              </button>
              <a href="mailto:awscloudclub@ganpatuniversity.ac.in" className="btn g">
                Report
              </a>
            </div>
            <p className="mo" style={{ color: 'var(--border-dashed)', marginTop: '6px' }}>Error boundary</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
