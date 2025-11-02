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

  useEffect(() => {
    setIdx(0);
  }, [images.length]);
  const rafRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    const frameDur = 1000 / fps;
    const loop = (t) => {
      const dt = t - lastRef.current;
      lastRef.current = t;
      accRef.current += dt;
      while (accRef.current >= frameDur) {
        setIdx((i) => (i + 1) % images.length);
        accRef.current -= frameDur;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    const dpr = window.devicePixelRatio || 1;
    const targetW = (width ?? naturalSize.w * scale) | 0;
    const targetH = (height ?? naturalSize.h * scale) | 0;

    canvas.style.width = targetW + "px";
    canvas.style.height = targetH + "px";

    canvas.width = Math.round(targetW * dpr);
    canvas.height = Math.round(targetH * dpr);

    ctx.imageSmoothingEnabled = false;

    const frameDur = 1000 / fps;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sx = (canvas.width / images[0].naturalWidth) | 0;
      const sy = (canvas.height / images[0].naturalHeight) | 0;
      const s = Math.max(1, Math.min(sx, sy));
      const dw = images[0].naturalWidth * s;
      const dh = images[0].naturalHeight * s;
      const dx = ((canvas.width - dw) / 2) | 0;
      const dy = ((canvas.height - dh) / 2) | 0;

      ctx.drawImage(images[idxRef.current], 0, 0, images[0].naturalWidth, images[0].naturalHeight, dx, dy, dw, dh);
    };

    const loop = (t) => {
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

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fps, images, scale, width, height, naturalSize.w, naturalSize.h]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        imageRendering: "pixelated", // helps some browsers when canvas is CSS-scaled
      }}
      {...domProps}
    />
  );
}
