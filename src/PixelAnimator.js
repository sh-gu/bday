import React, { useEffect, useMemo, useRef, useState, memo } from "react";

// Performance monitoring in development mode
const PERF_MONITORING = process.env.NODE_ENV === 'development';

const PixelAnimator = memo(function PixelAnimator({
  frames,
  fps = 8,
  scale = 1,
  mode = "canvas",
  width,
  height,
  className,
  ...domProps
}) {
  const [ready, setReady] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const frameCountRef = useRef(0);

  // Optimize image loading with better error handling and caching
  const images = useMemo(() => {
    return frames.map((src) => {
      const img = new Image();
      img.src = src;
      img.decoding = "async";
      img.loading = "eager";
      img.crossOrigin = "anonymous";

      // Add performance monitoring
      if (PERF_MONITORING) {
        img.onload = () => {
          frameCountRef.current++;
          if (frameCountRef.current === frames.length) {
            console.log(`PixelAnimator: Loaded ${frameCountRef.current} frames`);
          }
        };
      }

      return img;
    });
  }, [frames]);

  // Intersection Observer for performance optimization
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible, can start animations
            entry.target.dataset.visible = 'true';
          } else {
            // Element is not visible, pause animations if needed
            entry.target.dataset.visible = 'false';
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadTimeout = null;

    const loadImages = async () => {
      try {
        // Add timeout to prevent hanging
        loadTimeout = setTimeout(() => {
          if (!cancelled) {
            console.warn('PixelAnimator: Image loading timeout, some assets may be slow');
            setReady(false);
          }
        }, 10000); // 10 second timeout

        await Promise.all(
          images.map(
            (img) =>
              new Promise((res, rej) => {
                if (img.complete && img.naturalWidth) {
                  return res(true);
                }
                img.onload = () => res(true);
                img.onerror = (e) => {
                  console.warn('PixelAnimator: Failed to load image:', img.src);
                  rej(e);
                };
              })
          )
        );

        if (!cancelled) {
          clearTimeout(loadTimeout);
          setNaturalSize({
            w: images[0]?.naturalWidth || 0,
            h: images[0]?.naturalHeight || 0
          });
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          clearTimeout(loadTimeout);
          console.error('PixelAnimator: Failed to load images:', error);
          setReady(false);
        }
      }
    };

    loadImages();

    return () => {
      cancelled = true;
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [images]);

  if (!ready || images.length === 0) {
    return (
      <div
        ref={containerRef}
        className={"inline-flex items-center justify-center text-xs text-gray-500 " + (className || "")}
        style={{ minWidth: '60px', minHeight: '60px' }}
        {...domProps}
      >
        Loading…
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {mode === "img" ? (
        <ImgAnimator
          images={images}
          fps={fps}
          scale={scale}
          width={width}
          height={height}
          className={className}
          naturalSize={naturalSize}
          {...domProps}
        />
      ) : (
        <CanvasAnimator
          images={images}
          fps={fps}
          scale={scale}
          width={width}
          height={height}
          className={className}
          naturalSize={naturalSize}
          {...domProps}
        />
      )}
    </div>
  );
});

function ImgAnimator({ images, fps, scale, width, height, className, naturalSize, ...domProps }) {
  const [idx, setIdx] = useState(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    setIdx(0);
  }, [images.length]);

  const rafRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  useEffect(() => {
    const frameDur = 1000 / fps;
    let lastFpsUpdate = performance.now();
    let fpsFrameCount = 0;

    const loop = (t) => {
      // Check if element is still visible (from IntersectionObserver)
      const container = document.querySelector('[data-visible="false"]');
      if (container && container.contains(document.activeElement)) {
        // Element is not visible, pause animation
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = t - lastRef.current;
      lastRef.current = t;
      accRef.current += dt;

      // FPS monitoring in development
      if (PERF_MONITORING) {
        fpsFrameCount++;
        if (t - lastFpsUpdate >= 1000) {
          console.log(`ImgAnimator FPS: ${fpsFrameCount}`);
          fpsFrameCount = 0;
          lastFpsUpdate = t;
        }
      }

      while (accRef.current >= frameDur) {
        setIdx((i) => {
          frameCountRef.current = (i + 1) % images.length;
          return frameCountRef.current;
        });
        accRef.current -= frameDur;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [fps, images.length]);

  const cssW = width ?? Math.round(naturalSize.w * scale);
  const cssH = height ?? Math.round(naturalSize.h * scale);
  const currentImg = images[idx] ?? images[0];

  return (
    <img
      src={currentImg?.src}
      alt="pixel frame"
      draggable={false}
      style={{
        width: cssW + "px",
        height: cssH + "px",
        imageRendering: "pixelated", 
        msInterpolationMode: "nearest-neighbor",
      }}
      className={className}
      {...domProps}
    />
  );
}

function CanvasAnimator({ images, fps, scale, width, height, className, naturalSize, ...domProps }) {
  const canvasRef = useRef(null);
  const idxRef = useRef(0);
  const rafRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(performance.now());
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true // Performance optimization for animations
    });

    const dpr = window.devicePixelRatio || 1;
    const targetW = (width ?? naturalSize.w * scale) | 0;
    const targetH = (height ?? naturalSize.h * scale) | 0;

    // Optimize canvas rendering
    canvas.style.width = targetW + "px";
    canvas.style.height = targetH + "px";

    // Use lower resolution for better performance on high DPI displays
    const optimizedDpr = dpr > 2 ? 2 : dpr;
    canvas.width = Math.round(targetW * optimizedDpr);
    canvas.height = Math.round(targetH * optimizedDpr);

    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1.0;

    // Pre-calculate drawing parameters
    const frameDur = 1000 / fps;
    const imgWidth = images[0].naturalWidth;
    const imgHeight = images[0].naturalHeight;

    let lastFpsUpdate = performance.now();
    let fpsFrameCount = 0;

    const draw = () => {
      // Clear canvas efficiently
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scale and position once
      const sx = (canvas.width / imgWidth) | 0;
      const sy = (canvas.height / imgHeight) | 0;
      const s = Math.max(1, Math.min(sx, sy));
      const dw = imgWidth * s;
      const dh = imgHeight * s;
      const dx = ((canvas.width - dw) / 2) | 0;
      const dy = ((canvas.height - dh) / 2) | 0;

      // Draw current frame
      const currentImage = images[idxRef.current];
      if (currentImage && currentImage.complete) {
        ctx.drawImage(currentImage, 0, 0, imgWidth, imgHeight, dx, dy, dw, dh);
      }
    };

    const loop = (t) => {
      // Performance monitoring
      if (PERF_MONITORING) {
        fpsFrameCount++;
        if (t - lastFpsUpdate >= 1000) {
          console.log(`CanvasAnimator FPS: ${fpsFrameCount}`);
          fpsFrameCount = 0;
          lastFpsUpdate = t;
        }
      }

      const dt = t - lastRef.current;
      lastRef.current = t;
      accRef.current += dt;

      while (accRef.current >= frameDur) {
        idxRef.current = (idxRef.current + 1) % images.length;
        accRef.current -= frameDur;
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    // Start animation loop
    rafRef.current = requestAnimationFrame(loop);

    // Cleanup function
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Clear canvas to prevent memory leaks
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [fps, images, scale, width, height, naturalSize.w, naturalSize.h]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        imageRendering: "pixelated", // helps some browsers when canvas is CSS-scaled
        willChange: 'transform', // Performance hint for browser
      }}
      {...domProps}
    />
  );
}

export default PixelAnimator;
