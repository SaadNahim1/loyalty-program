import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { X, Camera, CheckCircle2, KeyRound, Coffee, AlertCircle, Sparkles } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { soundFX } from '../utils/audio';

export const QRScannerModal: React.FC = () => {
  const { isScannerOpen, setIsScannerOpen, addSingleStamp } = useLoyalty();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanningHint, setScanningHint] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (isScannerOpen) {
      isProcessingRef.current = false;
      setScanningHint(false);
      startCamera();

      // Show manual helper after 3 seconds if user is struggling with screen glare
      const timer = setTimeout(() => {
        setScanningHint(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Câmara não suportada neste navegador. Use o botão abaixo para testar.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setCameraActive(true);

        // Start scanning loop once video is playing
        startQRScanningLoop();
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError('Permissão da câmara negada ou indisponível. Toque no botão abaixo para carimbar!');
      setCameraActive(false);
    }
  };

  const startQRScanningLoop = () => {
    let lastScanTime = 0;

    const scanFrame = (time: number) => {
      if (!videoRef.current || !canvasRef.current || isProcessingRef.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Throttle scanning to every 80ms for maximum battery efficiency & speed
      if (time - lastScanTime < 80) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }
      lastScanTime = time;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      try {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && ctx) {
          // Scale to max 480px width for ultra-fast, zero-lag decoding
          const scale = Math.min(1, 480 / video.videoWidth);
          const w = Math.floor(video.videoWidth * scale);
          const h = Math.floor(video.videoHeight * scale);

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);

          const imageData = ctx.getImageData(0, 0, w, h);

          // Use jsQR with attemptBoth for maximum recognition on screens and paper
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            isProcessingRef.current = true;
            handleSuccessfulScan('qr_counter_scan', code.data);
            return;
          }
        }
      } catch (err) {
        // Suppress frame read exceptions while video initializes
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSuccessfulScan = (source: 'qr_counter_scan' | 'counter_code', decodedUrl?: string) => {
    soundFX.playScanBeep();
    setScanSuccess(true);
    stopCamera();

    setTimeout(() => {
      addSingleStamp(source, decodedUrl ? 'Lido via QR Code do Balcão' : 'Carimbo Registado (+1)');
      setScanSuccess(false);
      setIsScannerOpen(false);
    }, 500);
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan('counter_code');
  };

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden Canvas used for frame decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-amber-100">Leitor de QR Code</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              setIsScannerOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="relative aspect-square w-full rounded-2xl bg-black border-2 border-stone-800 overflow-hidden flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-800 text-amber-400 flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-stone-300 font-medium">
                    Aponte a câmara para o código QR do balcão
                  </p>
                  {cameraError && (
                    <p className="text-[11px] text-amber-300/90 max-w-xs mx-auto">
                      {cameraError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Target Reticle Overlay */}
            <div className="absolute inset-8 border-2 border-amber-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400" />
              </div>
              {/* Animated Scan Line */}
              <div className="w-full h-0.5 bg-amber-400/90 shadow-[0_0_8px_#f59e0b] animate-bounce opacity-80" />
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400" />
              </div>
            </div>

            {/* Success Overlay */}
            {scanSuccess && (
              <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-pulse" />
                <span className="font-bold text-base text-white">QR Code Reconhecido!</span>
                <span className="text-xs text-emerald-200">A carimbar o seu cartão...</span>
              </div>
            )}
          </div>

          {/* Quick Instant Verification Button (Always available for instant reliability) */}
          <div className="space-y-2">
            <button
              onClick={() => handleSuccessfulScan('qr_counter_scan')}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirmar Carimbo no Balcão (+1)</span>
            </button>
            <p className="text-[11px] text-stone-400 text-center">
              Aponte para o código QR ou toque no botão acima para validar de imediato.
            </p>
          </div>

          {/* Manual Receipt Code Entry */}
          <form onSubmit={handleManualCodeSubmit} className="pt-3 border-t border-stone-800 space-y-2">
            <label className="text-xs text-stone-400 block flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-stone-500" />
              <span>Código manual de 4 dígitos do recibo:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 1234"
                className="flex-1 px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder-stone-500 text-xs font-mono uppercase focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs transition-colors"
              >
                Validar (+1)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
