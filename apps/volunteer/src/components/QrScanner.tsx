import { useEffect, useRef, useState } from 'react';

// Minimal ambient type for the Shape Detection API — not yet in TS's lib.dom.
// Supported in Chromium-based browsers (Chrome/Edge, desktop and Android);
// unsupported browsers (Safari, Firefox) get the `unsupported` state below
// and the parent falls back to manual entry, so this deliberately isn't a
// hard dependency on any npm QR-decoding library (rung 4 of the ladder —
// the platform feature already covers the common case here).
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

type CameraState = 'starting' | 'active' | 'unsupported' | 'error';

const DETECT_INTERVAL_MS = 400;

interface QrScannerProps {
  /** Called with the raw scanned string once per detection while not paused. */
  onDetect: (value: string) => void;
  /** While true, frames are still read but detections are ignored — used during an in-flight request or the post-scan cooldown, so one physical QR code held in frame doesn't fire twice. */
  paused: boolean;
  /** Surfaces camera/support state so the parent can render its own fallback UI (e.g. manual token entry) instead of a blank box. */
  onStateChange?: (state: CameraState, message?: string) => void;
}

export function QrScanner({ onDetect, paused, onStateChange }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>('starting');
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  const updateState = (next: CameraState, message?: string) => {
    setState(next);
    onStateChange?.(next, message);
  };

  useEffect(() => {
    if (!window.BarcodeDetector) {
      updateState('unsupported', 'This browser can’t scan QR codes — use manual entry below.');
      return;
    }

    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
        updateState('active');

        intervalId = setInterval(() => {
          if (pausedRef.current || !videoRef.current) return;
          detector
            .detect(videoRef.current)
            .then((codes) => {
              const value = codes[0]?.rawValue;
              if (value) onDetectRef.current(value);
            })
            .catch(() => {
              // A transient decode failure (e.g. a frame mid-transition) isn't
              // worth surfacing — the next interval tick just tries again.
            });
        }, DETECT_INTERVAL_MS);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera access was denied — allow it in your browser settings, or use manual entry below.'
            : 'Could not access the camera — use manual entry below.';
        updateState('error', message);
      });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // onDetect/onStateChange are intentionally read via refs above, not
    // listed here — re-running this effect on every render would restart
    // the camera and re-request permission.
  }, []);

  if (state === 'unsupported' || state === 'error') return null;

  return (
    <div className="scan-video-wrap">
      <video ref={videoRef} className="scan-video" muted playsInline />
      <div className="scan-frame" />
      {state === 'starting' && <p className="status-line scan-starting">Starting camera…</p>}
    </div>
  );
}
