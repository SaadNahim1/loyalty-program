import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  KeyRound, 
  Coffee, 
  AlertCircle, 
  Sparkles, 
  Terminal, 
  RotateCcw, 
  RefreshCw 
} from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { soundFX } from '../utils/audio';
import { DiagnosticConsole, DiagnosticLog, CameraDiagnosticState } from './DiagnosticConsole';

export const QRScannerModal: React.FC = () => {
  const { 
    isScannerOpen, 
    setIsScannerOpen, 
    addSingleStamp, 
    hasActiveSession, 
    setIsRegistrationOverlayOpen 
  } = useLoyalty();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Diagnostic State & Logs
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [diagnosticState, setDiagnosticState] = useState<CameraDiagnosticState>({
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
    protocol: typeof window !== 'undefined' ? window.location.protocol : '',
    host: typeof window !== 'undefined' ? window.location.host : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    permissionState: 'unknown',
    availableDevices: [],
    videoReadyState: 0,
    videoDimensions: { width: 0, height: 0 },
    fps: 0,
    totalFramesScanned: 0,
    lastRawScanData: null,
    lastScanTimestamp: null,
    errorDetails: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const framesCountRef = useRef(0);
  const lastFpsCalcTimeRef = useRef(Date.now());

  const addLog = (type: 'info' | 'success' | 'warn' | 'error', message: string, data?: any) => {
    const newLog: DiagnosticLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    setLogs((prev) => [...prev.slice(-49), newLog]);
  };

  // Inspect devices & permission on open
  useEffect(() => {
    if (isScannerOpen) {
      if (!hasActiveSession) {
        setIsScannerOpen(false);
        setIsRegistrationOverlayOpen(true);
        return;
      }

      isProcessingRef.current = false;
      addLog('info', 'Modal do Scanner Aberto. A inicializar diagnóstico de hardware...');

      // 1. Check Permissions API (Supported on Chrome/Firefox, often not on iOS Safari)
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          navigator.permissions
            .query({ name: 'camera' as any })
            .then((res) => {
              setDiagnosticState((prev) => ({ ...prev, permissionState: res.state }));
              addLog('info', `Permissão inicial via Permissions API: ${res.state}`);
              res.onchange = () => {
                setDiagnosticState((prev) => ({ ...prev, permissionState: res.state }));
                addLog('info', `Alteração de permissão detetada: ${res.state}`);
              };
            })
            .catch((err) => {
              setDiagnosticState((prev) => ({ ...prev, permissionState: 'not_supported' }));
              addLog('warn', 'Permissions API não suporta query de câmara neste navegador.', err.message);
            });
        } catch {
          // Ignore
        }
      } else {
        setDiagnosticState((prev) => ({ ...prev, permissionState: 'api_unavailable' }));
        addLog('info', 'Permissions API não suportada nativamente (típico no Safari iOS).');
      }

      // 2. Enumerate devices if possible
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const videoDevs = devices
              .filter((d) => d.kind === 'videoinput')
              .map((d) => ({
                deviceId: d.deviceId,
                kind: d.kind,
                label: d.label || 'Câmara (Etiqueta Oculta)',
              }));
            setDiagnosticState((prev) => ({ ...prev, availableDevices: videoDevs }));
            addLog('info', `Dispositivos de vídeo detetados: ${videoDevs.length}`);
          })
          .catch((err) => {
            addLog('warn', 'Não foi possível enumerar câmaras antes de obter permissão:', err.message);
          });
      }

      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScannerOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    setCameraError(null);
    stopCamera();

    addLog('info', `A solicitar câmara com facingMode='${mode}'...`);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errMsg = 'Câmara não suportada ou contexto inseguro (HTTP sem SSL).';
      setCameraError(errMsg);
      addLog('error', errMsg, { isSecureContext: window.isSecureContext });
      setShowConsole(true);
      return;
    }

    try {
      // Primary attempt with ideal constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        addLog('success', `Stream de vídeo obtido com ideal facingMode='${mode}'.`);
      } catch (err: any) {
        addLog('warn', `Tentativa ideal falhou (${err.name}). A tentar fallback genérico { video: true }...`);
        // Fallback for tricky mobile webviews/browsers that reject ideal constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        addLog('success', 'Stream de vídeo obtido via fallback genérico.');
      }

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings() || {};

      setDiagnosticState((prev) => ({
        ...prev,
        permissionState: 'granted',
        activeTrackSettings: settings,
        errorDetails: null,
      }));

      addLog('success', `Câmara ativa: "${track?.label || 'Sem Nome'}"`, settings);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setCameraActive(true);

        const vWidth = videoRef.current.videoWidth || 0;
        const vHeight = videoRef.current.videoHeight || 0;
        const readyState = videoRef.current.readyState;

        setDiagnosticState((prev) => ({
          ...prev,
          videoReadyState: readyState,
          videoDimensions: { width: vWidth, height: vHeight },
        }));

        addLog('info', `Vídeo a reproduzir: ${vWidth}x${vHeight}, readyState=${readyState}`);
        startQRScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      const errName = err.name || 'CameraError';
      const errMsg = err.message || 'Falha ao aceder à câmara';
      
      let humanTip = 'Permissão da câmara negada ou indisponível.';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        humanTip = 'Acesso à câmara recusado no navegador. Toque nas definições do Safari/Chrome para permitir a câmara.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        humanTip = 'Nenhuma câmara detetada neste dispositivo.';
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        humanTip = 'A câmara está a ser usada por outra aplicação. Feche outras abas ou apps e tente novamente.';
      }

      setCameraError(humanTip);
      setDiagnosticState((prev) => ({
        ...prev,
        permissionState: 'denied',
        errorDetails: { name: errName, message: errMsg },
      }));

      addLog('error', `Erro na inicialização da câmara: [${errName}] ${errMsg}`, {
        tip: humanTip,
      });

      // Automatically show console on camera failure so user can debug/report
      setShowConsole(true);
      setCameraActive(false);
    }
  };

  const startQRScanningLoop = () => {
    let lastScanTime = 0;
    framesCountRef.current = 0;
    lastFpsCalcTimeRef.current = Date.now();

    const scanFrame = (time: number) => {
      if (!videoRef.current || !canvasRef.current || isProcessingRef.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Calculate live FPS every second
      const now = Date.now();
      framesCountRef.current += 1;
      if (now - lastFpsCalcTimeRef.current >= 1000) {
        const elapsed = (now - lastFpsCalcTimeRef.current) / 1000;
        const currentFps = Math.round(framesCountRef.current / elapsed);
        setDiagnosticState((prev) => ({
          ...prev,
          fps: currentFps,
          totalFramesScanned: prev.totalFramesScanned + framesCountRef.current,
          videoReadyState: videoRef.current?.readyState || 0,
          videoDimensions: {
            width: videoRef.current?.videoWidth || 0,
            height: videoRef.current?.videoHeight || 0,
          },
        }));
        framesCountRef.current = 0;
        lastFpsCalcTimeRef.current = now;
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
            const rawScan = code.data;
            const scanTime = new Date().toLocaleTimeString();

            setDiagnosticState((prev) => ({
              ...prev,
              lastRawScanData: rawScan,
              lastScanTimestamp: scanTime,
            }));

            addLog('success', `QR Code decifrado com sucesso! Conteúdo RAW: ${rawScan}`);
            handleSuccessfulScan('qr_counter_scan', rawScan);
            return;
          }
        }
      } catch (err: any) {
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

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    addLog('info', `A alternar câmara para '${nextMode}'...`);
  };

  const handleSuccessfulScan = (source: 'qr_counter_scan' | 'counter_code', decodedUrl?: string) => {
    soundFX.playScanBeep();
    setScanSuccess(true);
    stopCamera();

    setTimeout(() => {
      addSingleStamp(source, decodedUrl ? `Lido via QR: ${decodedUrl.slice(0, 32)}...` : 'Carimbo Registado (+1)');
      setScanSuccess(false);
      setIsScannerOpen(false);
    }, 500);
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    addLog('info', `Carimbo via código manual introduzido: ${manualCode.trim()}`);
    handleSuccessfulScan('counter_code', manualCode.trim());
  };

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Hidden Canvas used for frame decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-amber-100">Leitor de QR Code</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Diagnostic Console Button */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                showConsole 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
              title="Abrir consola de diagnóstico em tempo real"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showConsole ? 'Ocultar Consola' : 'Consola Diagnóstico'}</span>
            </button>

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
        </div>

        {/* Body Container (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Camera Viewfinder Area */}
          <div className="relative aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-amber-600/40 shadow-inner flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />

                {/* Animated Green Target Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                </div>

                {/* Laser scan line animation */}
                <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce opacity-80" />

                {/* Switch Camera Button (Front / Back) */}
                <button
                  onClick={toggleFacingMode}
                  className="absolute bottom-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition-colors"
                  title="Alternar entre câmara frontal e traseira"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="p-6 text-center space-y-3">
                {cameraError ? (
                  <>
                    <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                    <p className="text-xs text-rose-300 font-medium leading-relaxed">
                      {cameraError}
                    </p>
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tentar Novamente
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-stone-400">A ativar câmara do dispositivo...</p>
                  </>
                )}
              </div>
            )}

            {/* Success Overlay */}
            {scanSuccess && (
              <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
                <span className="font-extrabold text-white text-base">QR Identificado!</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-stone-400">
            Aponte a câmara para o QR Code no balcão da cafetaria para carimbar.
          </p>

          {/* Quick Instant Punch Helper Buttons */}
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <button
              onClick={() => handleSuccessfulScan('qr_counter_scan', 'Simulação Rápida Balcão')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simular Leitura com Sucesso (+1 Carimbo)</span>
            </button>

            {/* Manual PIN / Code fallback Form */}
            <form onSubmit={handleManualCodeSubmit} className="flex gap-2">
              <label htmlFor="scanner-manual-code" className="sr-only">Código do talão</label>
              <input
                id="scanner-manual-code"
                name="manualCode"
                type="text"
                autoComplete="off"
                aria-label="Código do Talão de Balcão"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Código do Talão (ex: PITSTOP8)"
                className="flex-1 px-3 py-2 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-200 text-xs placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 uppercase font-mono tracking-wider"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold transition-colors shrink-0"
              >
                Validar
              </button>
            </form>
          </div>

          {/* Integrated Diagnostic Console Section */}
          {showConsole && (
            <div className="pt-3 border-t border-stone-800">
              <DiagnosticConsole
                logs={logs}
                state={diagnosticState}
                onClearLogs={() => setLogs([])}
                onRestartCamera={() => startCamera(facingMode)}
                onToggleFacingMode={toggleFacingMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
