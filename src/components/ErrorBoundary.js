import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'black',
          color: 'white',
          textAlign: 'center',
          padding: '20px',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#ff6b6b' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ marginBottom: '30px', maxWidth: '500px', lineHeight: '1.5' }}>
            The birthday cake encountered an error. This might be due to microphone permissions
            or a temporary glitch.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '30px', textAlign: 'left', maxWidth: '800px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Technical Details (Development Mode)
              </summary>
              <pre style={{
                fontSize: '12px',
                overflow: 'auto',
                backgroundColor: '#333',
                padding: '10px',
                borderRadius: '4px',
                color: '#ff6b6b'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;