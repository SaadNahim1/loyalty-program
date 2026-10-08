import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, QrCode, KeyRound } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const QRScannerModal: React.FC = () => {
  const {
    isScannerOpen,
    setIsScannerOpen,
    validateAndApplyDailyScan,
  } = useLoyalty();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasScannedRef = useRef<boolean>(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    setCameraError(null);
    setFeedbackError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('A câmara não está disponível neste navegador. Introduza o Código do Dia abaixo.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          scanLoop();
        }
      }, 100);
    } catch {
      setCameraError('Permissão de câmara recusada ou indisponível. Pode usar o Código do Dia indicado no balcão.');
    }
  };

  const scanLoop = () => {
    const tick = async () => {
      if (hasScannedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const scale = Math.min(1, 480 / video.videoWidth);
          const w = Math.floor(video.videoWidth * scale);
          const h = Math.floor(video.videoHeight * scale);

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);

          const imgData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            hasScannedRef.current = true;
            const res = await validateAndApplyDailyScan(code.data, 'qr_counter_scan');
            if (res.ok) {
              setIsSuccessFlash(true);
              stopCamera();
              setTimeout(() => {
                setIsSuccessFlash(false);
                setIsScannerOpen(false);
              }, 600);
              return;
            } else {
              setFeedbackError(res.reason || 'QR Code inválido para o dia de hoje.');
              setTimeout(() => {
                hasScannedRef.current = false;
              }, 2000);
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isScannerOpen) {
      hasScannedRef.current = false;
      setManualCode('');
      setFeedbackError(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScannerOpen, facingMode]);

  if (!isScannerOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    if (!manualCode.trim()) return;

    const res = await validateAndApplyDailyScan(manualCode.trim(), 'counter_code');
    if (res.ok) {
      setIsSuccessFlash(true);
      stopCamera();
      setTimeout(() => {
        setIsSuccessFlash(false);
        setIsScannerOpen(false);
      }, 500);
    } else {
      setFeedbackError(res.reason || 'Código incorreto.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-semibold text-lg text-stone-100">
              Validar QR Code do Dia
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setIsScannerOpen(false);
            }}
            className="w-10 h-10 rounded-xl bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Fechar leitor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Camera Viewport */}
          <div className="relative aspect-square max-w-[270px] mx-auto rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                <div className="absolute inset-7 border-2 border-dashed border-amber-400/75 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                  }
                  className="absolute bottom-3 right-3 px-3 py-2 rounded-xl bg-stone-950/80 text-stone-200 hover:text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs border border-stone-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Virar Câmara</span>
                </button>
              </>
            ) : (
              <div className="p-6 text-center space-y-3">
                {cameraError ? (
                  <>
                    <AlertCircle className="w-9 h-9 text-amber-400 mx-auto" />
                    <p className="text-xs text-stone-300 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tentar Novamente</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-stone-400">A ligar câmara do telemóvel...</p>
                  </>
                )}
              </div>
            )}

            {isSuccessFlash && (
              <div className="absolute inset-0 bg-emerald-700/95 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-white" />
                <span className="font-semibold text-white text-base">
                  QR do Dia Confirmado!
                </span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-stone-400 leading-relaxed">
            Aponte a câmara para o <strong className="text-stone-200">QR Code do Dia</strong> exibido pelo operador na caixa. Códigos de dias anteriores são recusados automaticamente.
          </p>

          {feedbackError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{feedbackError}</span>
            </div>
          )}

          {/* Manual Daily Code Entry */}
          <div className="pt-4 border-t border-stone-800 space-y-2.5">
            <label
              htmlFor="daily-manual-code-input"
              className="text-xs font-medium text-stone-300 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Alternativa: Introduzir Código Alfanumérico do Dia</span>
            </label>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                id="daily-manual-code-input"
                name="manualDailyCode"
                type="text"
                autoComplete="off"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: PIT-0710-XXXX"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs font-mono uppercase tracking-wider placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Validar Código
              </button>
            </form>
            <p className="text-[11px] text-stone-500">
              Introduza o código que aparece impresso por baixo do QR Code do Dia no expositor do balcão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
