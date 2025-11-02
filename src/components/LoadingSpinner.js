import React from 'react';

const LoadingSpinner = ({ message = "Loading birthday celebration..." }) => {
  return (
    <div className="loading-spinner" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'black',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div className="spinner-animation" style={{
        width: '60px',
        height: '60px',
        border: '4px solid #333',
        borderTop: '4px solid #fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      <div style={{
        fontSize: '18px',
        fontFamily: 'monospace',
        opacity: 0.8,
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        {message}
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;