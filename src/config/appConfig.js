// Birthday App Configuration

export const VOLUME_THRESHOLDS = {
  // Minimum volume to trigger any animation
  MIN_VOLUME: 0.02,

  // Volume thresholds for different cake frames (from highest to lowest volume)
  CAKE_20_PERCENT: 0.30,  // Highest volume - triggers celebration
  CAKE_40_PERCENT: 0.22,
  CAKE_60_PERCENT: 0.15,
  CAKE_80_PERCENT: 0.08,
  CAKE_100_PERCENT: 0.0,  // Lowest volume - normal animation
};

export const AUDIO_CONFIG = {
  // Microphone sensitivity multiplier
  MIC_SENSITIVITY: 3.0,

  // Audio analysis settings
  FFT_SIZE: 2048,

  // Animation frame rate for volume monitoring
  VOLUME_FPS: 60,

  // Volume smoothing (number of samples to average)
  VOLUME_SMOOTHING: 5,
};

export const ANIMATION_CONFIG = {
  // Base animation FPS for cake
  CAKE_FPS: 3,

  // Cake scale multiplier
  CAKE_SCALE: 4,

  // Confetti settings
  CONFETTI: {
    PIECES: 48,
    DURATION: 8000,
    COLORS: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
  },

  // Celebration trigger delay (ms)
  CELEBRATION_DELAY: 250,
};

export const UI_CONFIG = {
  // Loading messages
  LOADING_MESSAGES: {
    GENERAL: "Loading birthday celebration...",
    AUDIO: "Preparing birthday music...",
    MICROPHONE: "Setting up microphone...",
  },

  // Error messages
  ERROR_MESSAGES: {
    MICROPHONE_DENIED: "Microphone access denied. Please enable microphone to interact with the cake.",
    MICROPHONE_NOT_FOUND: "No microphone found. Please connect a microphone to use this feature.",
    AUDIO_LOAD_FAILED: "Failed to load birthday audio. The cake will still work without music.",
    ASSET_LOAD_FAILED: "Some assets failed to load. Please refresh the page.",
  },

  // Mobile breakpoints
  BREAKPOINTS: {
    MOBILE: 768,
    SMALL_MOBILE: 480,
  },

  // Touch feedback duration (ms)
  TOUCH_FEEDBACK_DURATION: 150,
};

export const PERFORMANCE_CONFIG = {
  // Enable/disable features for performance
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',

  // Memory cleanup intervals
  CLEANUP_INTERVAL: 30000, // 30 seconds

  // Maximum memory usage warning threshold (MB)
  MEMORY_WARNING_THRESHOLD: 100,

  // Frame rate monitoring
  TARGET_FPS: 60,
  FPS_WARNING_THRESHOLD: 30,
};

export const ACCESSIBILITY_CONFIG = {
  // Keyboard navigation
  KEYBOARD: {
    ACTIVATE_KEYS: ['Enter', ' '],
    CLOSE_KEYS: ['Escape'],
  },

  // Screen reader announcements
  ANNOUNCEMENTS: {
    VOLUME_CHANGE: "Volume level changed",
    CELEBRATION_START: "Celebration started! Confetti is falling!",
    CELEBRATION_END: "Celebration ended. Sing again to trigger more confetti!",
    MICROPHONE_STATUS: "Microphone status changed",
  },

  // Animation preferences
  REDUCED_MOTION: false, // Will be set based on user preference
  HIGH_CONTRAST: false,  // Will be set based on user preference
};

// Export configuration object for easy importing
export const config = {
  VOLUME_THRESHOLDS,
  AUDIO_CONFIG,
  ANIMATION_CONFIG,
  UI_CONFIG,
  PERFORMANCE_CONFIG,
  ACCESSIBILITY_CONFIG,
};