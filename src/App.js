import PixelAnimator from "./PixelAnimator";
import cake1 from "./assets/cake1.png";
import cake2 from "./assets/cake2.png";
import cake3 from "./assets/cake3.png";
import cake100 from "./assets/100.png";
import cake80 from "./assets/80.png";
import cake60 from "./assets/60.png";
import cake40 from "./assets/40.png";
import cake20 from "./assets/20.png";
import birthdayText from "./assets/birthdaytext.png";
import "./App.css";
import Confetti from "./Confetti";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import VolumeIndicator from "./components/VolumeIndicator";
import { useEffect, useRef, useState, useCallback } from "react";
import birthdaySong from "./assets/bdayaudo.mp3";
import {
  VOLUME_THRESHOLDS,
  AUDIO_CONFIG,
  ANIMATION_CONFIG,
  UI_CONFIG,
  ACCESSIBILITY_CONFIG
} from "./config/appConfig";


function BirthdayApp() {
  const audioRef = useRef(null);
  const [staticFrame, setStaticFrame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState(false);

  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const rafRef = useRef(null);
  const volumeHistoryRef = useRef([]);

  // Preload assets
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const imagePromises = [
          cake1, cake2, cake3,
          cake100, cake80, cake60, cake40, cake20,
          birthdayText
        ].map(src => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
          });
        });

        const audioPromise = new Promise((resolve, reject) => {
          const audio = new Audio();
          audio.src = birthdaySong;
          audio.oncanplaythrough = resolve;
          audio.onerror = reject;
        });

        await Promise.all([...imagePromises, audioPromise]);
        setAssetsLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to preload assets:', error);
        setIsLoading(false);
      }
    };

    preloadAssets();
  }, []);

  // Initialize audio playback
  useEffect(() => {
    if (!assetsLoaded) return;

    const playAudio = async () => {
      try {
        if (audioRef.current) {
          await audioRef.current.play();
        }
      } catch (err) {
        console.log("Autoplay blocked, waiting for user interaction:", err);
      }
    };

    playAudio();
  }, [assetsLoaded]);

  // Initialize microphone monitoring
  useEffect(() => {
    if (!assetsLoaded) return;

    startMicMonitoring();
    return () => {
      stopMicMonitoring();
    };
  }, [assetsLoaded]);

  // Handle celebration trigger
  useEffect(() => {
    if (staticFrame === cake20) {
      stopMicMonitoring(false);
      setCelebrating(true);
      announceToScreenReader(ACCESSIBILITY_CONFIG.ANNOUNCEMENTS.CELEBRATION_START);
    }
  }, [staticFrame]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && celebrating) {
        setCelebrating(false);
        announceToScreenReader("Celebration stopped");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [celebrating]);

  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const handleCakeClick = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.log("Audio play failed:", err);
      }
    }

    // Touch feedback for mobile
    setTouchFeedback(true);
    setTimeout(() => setTouchFeedback(false), UI_CONFIG.TOUCH_FEEDBACK_DURATION);
  }, []);

  const handleCakeKeyDown = useCallback((e) => {
    if (ACCESSIBILITY_CONFIG.KEYBOARD.ACTIVATE_KEYS.includes(e.key)) {
      e.preventDefault();
      handleCakeClick();
    }
  }, [handleCakeClick]);

  const pickStaticFrame = useCallback((rms) => {
    if (rms < VOLUME_THRESHOLDS.MIN_VOLUME) return null;
    if (rms >= VOLUME_THRESHOLDS.CAKE_20_PERCENT) return cake20;
    if (rms >= VOLUME_THRESHOLDS.CAKE_40_PERCENT) return cake40;
    if (rms >= VOLUME_THRESHOLDS.CAKE_60_PERCENT) return cake60;
    if (rms >= VOLUME_THRESHOLDS.CAKE_80_PERCENT) return cake80;
    return cake100;
  }, []);

  const startMicMonitoring = useCallback(async () => {
    if (micStreamRef.current) return;

    try {
      setIsListening(true);
      setMicError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = AUDIO_CONFIG.MIC_SENSITIVITY;
      gainNodeRef.current = gainNode;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
      analyserRef.current = analyser;

      source.connect(gainNode);
      gainNode.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const loop = () => {
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        // Volume smoothing
        volumeHistoryRef.current.push(rms);
        if (volumeHistoryRef.current.length > AUDIO_CONFIG.VOLUME_SMOOTHING) {
          volumeHistoryRef.current.shift();
        }
        const smoothedRms = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;

        setCurrentVolume(smoothedRms);

        const chosen = pickStaticFrame(smoothedRms);
        setStaticFrame((prev) => {
          if (prev === chosen) return prev;
          return chosen;
        });

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.warn("Microphone access denied or failed:", err);
      setIsListening(false);

      if (err.name === 'NotAllowedError') {
        setMicError(UI_CONFIG.ERROR_MESSAGES.MICROPHONE_DENIED);
      } else if (err.name === 'NotFoundError') {
        setMicError(UI_CONFIG.ERROR_MESSAGES.MICROPHONE_NOT_FOUND);
      } else {
        setMicError(UI_CONFIG.ERROR_MESSAGES.MICROPHONE_NOT_FOUND);
      }
    }
  }, [pickStaticFrame]);

  const stopMicMonitoring = useCallback((resetAnimation = true) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
        if (gainNodeRef.current) {
          try { gainNodeRef.current.disconnect(); } catch (e) {}
          gainNodeRef.current = null;
        }
      } catch (e) {}
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    setIsListening(false);
    volumeHistoryRef.current = [];

    if (resetAnimation) {
      setStaticFrame(null);
    }
  }, []);

  const retryMicrophone = useCallback(() => {
    setMicError(null);
    startMicMonitoring();
  }, [startMicMonitoring]);

  const manualTriggerCelebration = useCallback(() => {
    setCelebrating(true);
    announceToScreenReader(ACCESSIBILITY_CONFIG.ANNOUNCEMENTS.CELEBRATION_START);
    setTimeout(() => setCelebrating(false), ANIMATION_CONFIG.CONFETTI.DURATION);
  }, []);

  if (isLoading) {
    return <LoadingSpinner message={UI_CONFIG.LOADING_MESSAGES.GENERAL} />;
  }

  return (
    <div className={`App ${touchFeedback ? 'touch-feedback' : ''}`}>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: 'black',
          color: 'white',
          padding: '8px',
          textDecoration: 'none',
          zIndex: 10000,
          borderRadius: '4px'
        }}
      >
        Skip to main content
      </a>

      <audio ref={audioRef} src={birthdaySong} loop />

      <div id="main-content">
        <img
          src={birthdayText}
          alt="Happy Birthday"
          className="birthdayText"
          draggable={false}
        />

        <div className="cakeLoop">
          {staticFrame ? (
            <PixelAnimator
              className="cake"
              frames={[staticFrame]}
              fps={ANIMATION_CONFIG.CAKE_FPS}
              scale={ANIMATION_CONFIG.CAKE_SCALE}
              mode="img"
              onClick={handleCakeClick}
              onKeyDown={handleCakeKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Birthday cake, click or press Enter to play music"
            />
          ) : (
            <PixelAnimator
              className="cake"
              frames={[cake1, cake2, cake3]}
              fps={ANIMATION_CONFIG.CAKE_FPS}
              scale={ANIMATION_CONFIG.CAKE_SCALE}
              mode="img"
              onClick={handleCakeClick}
              onKeyDown={handleCakeKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Animated birthday cake, click or press Enter to play music"
            />
          )}
        </div>

        {/* Manual celebration trigger for mobile/testing */}
        <button
          onClick={manualTriggerCelebration}
          className="manual-trigger-btn"
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
          aria-label="Manual celebration trigger"
        >
          🎉 Trigger Confetti
        </button>

        {/* Microphone error message with retry */}
        {micError && (
          <div className="mic-error-message" style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(244, 67, 54, 0.9)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
            zIndex: 1000,
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <div>{micError}</div>
            <button
              onClick={retryMicrophone}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#F44336',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Volume indicator */}
      <VolumeIndicator
        volume={currentVolume}
        isListening={isListening}
        error={micError}
      />

      {/* Confetti celebration */}
      {celebrating && (
        <Confetti
          pieces={ANIMATION_CONFIG.CONFETTI.PIECES}
          duration={ANIMATION_CONFIG.CONFETTI.DURATION}
          onDone={() => {
            setCelebrating(false);
            announceToScreenReader(ACCESSIBILITY_CONFIG.ANNOUNCEMENTS.CELEBRATION_END);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BirthdayApp />
    </ErrorBoundary>
  );
}
