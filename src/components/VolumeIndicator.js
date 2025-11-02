import React from 'react';

const VolumeIndicator = ({ volume, isListening, error }) => {
  const getVolumeColor = (volume) => {
    if (volume < 0.02) return '#333';
    if (volume < 0.08) return '#4CAF50';
    if (volume < 0.15) return '#FFC107';
    if (volume < 0.22) return '#FF9800';
    if (volume < 0.30) return '#F44336';
    return '#D32F2F';
  };

  const getVolumeBars = () => {
    const bars = [];
    const barCount = 5;
    const maxVolume = 0.30;

    for (let i = 0; i < barCount; i++) {
      const threshold = ((i + 1) / barCount) * maxVolume;
      const isActive = volume >= threshold;
      const height = 20 + (i * 8);

      bars.push(
        <div
          key={i}
          className="volume-bar"
          style={{
            width: '8px',
            height: `${height}px`,
            backgroundColor: isActive ? getVolumeColor(volume) : '#333',
            margin: '0 2px',
            borderRadius: '4px',
            transition: 'all 0.1s ease',
            opacity: isActive ? 1 : 0.3
          }}
        />
      );
    }
    return bars;
  };

  if (error) {
    return (
      <div className="volume-indicator" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: '#ff6b6b',
        fontSize: '14px',
        fontFamily: 'monospace',
        zIndex: 1000,
        maxWidth: '250px'
      }}>
        <div>🎤 Microphone Error</div>
        <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!isListening) {
    return (
      <div className="volume-indicator" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        <div>🎤 Requesting microphone access...</div>
      </div>
    );
  }

  return (
    <div className="volume-indicator" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      minWidth: '120px'
    }}>
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        🎤 Volume Level
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'center',
        height: '60px',
        marginBottom: '10px'
      }}>
        {getVolumeBars()}
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', opacity: 0.7 }}>
        Sing louder for confetti! 🎉
      </div>
    </div>
  );
};

export default VolumeIndicator;