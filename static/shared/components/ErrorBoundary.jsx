import React, { Component } from 'react';

// Error Boundary component to gracefully handle rendering failures
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mermaid-error">
          <strong>Something went wrong</strong>
          <p>Unable to render the diagram. Please try refreshing the page.</p>
          {this.state.error && (
            <details style={{ marginTop: '8px' }}>
              <summary>Error details</summary>
              <pre>{this.state.error.message}</pre>
            </details>
          )}
          <button
            className="mermaid-button"
            onClick={this.handleRetry}
            style={{ marginTop: '12px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
