import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  data?: any;
}

export interface CameraDiagnosticState {
  isSecureContext: boolean;
  protocol: string;
  host: string;
  userAgent: string;
  hasMediaDevices: boolean;
  permissionState: string;
  availableDevices: Array<{ deviceId: string; kind: string; label: string }>;
  videoReadyState: number;
  videoDimensions: { width: number; height: number };
  activeTrackSettings?: MediaTrackSettings;
  fps: number;
  totalFramesScanned: number;
  lastRawScanData: string | null;
  lastScanTimestamp: string | null;
  errorDetails: { name: string; message: string } | null;
}

interface DiagnosticConsoleProps {
  logs: DiagnosticLog[];
  state: CameraDiagnosticState;
  onClearLogs?: () => void;
  onRestartCamera?: () => void;
  onToggleFacingMode?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({
  logs,
  state,
  onClearLogs,
  onRestartCamera,
  onToggleFacingMode,
  isOpen = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'specs' | 'devices'>('logs');

  const getFullDiagnosticReport = () => {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        environment: {
          url: window.location.href,
          isSecureContext: state.isSecureContext,
          protocol: state.protocol,
          userAgent: state.userAgent,
          hasMediaDevices: state.hasMediaDevices,
          permissionState: state.permissionState,
        },
        camera: {
          videoReadyState: state.videoReadyState,
          videoDimensions: state.videoDimensions,
          activeTrackSettings: state.activeTrackSettings,
          errorDetails: state.errorDetails,
          availableDevices: state.availableDevices,
        },
        scanner: {
          totalFramesScanned: state.totalFramesScanned,
          fps: state.fps,
          lastRawScanData: state.lastRawScanData,
          lastScanTimestamp: state.lastScanTimestamp,
        },
        recentLogs: logs.slice(-25),
      },
      null,
      2
    );
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(getFullDiagnosticReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = getFullDiagnosticReport();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-stone-950 text-stone-200 border border-stone-800 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl flex flex-col">
      {/* Header Bar */}
      <div className="bg-stone-900 px-4 py-2.5 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-stone-100 text-xs tracking-wide">
            Consola de Diagnóstico QR
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-800 text-stone-300 border border-stone-700">
            {state.isSecureContext ? '🔒 HTTPS OK' : '⚠️ HTTP Inseguro'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] transition-colors"
            title="Copiar relatório completo de diagnóstico"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Logs</span>
              </>
            )}
          </button>

          {onRestartCamera && (
            <button
              onClick={onRestartCamera}
              className="p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300"
              title="Reiniciar câmara"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real-time Status Badges Bar */}
      <div className="bg-stone-900/60 px-4 py-2 border-b border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div>
          <span className="text-stone-500 block text-[10px]">Permissão Câmara:</span>
          <span className={`font-semibold ${
            state.permissionState === 'granted' 
              ? 'text-emerald-400' 
              : state.permissionState === 'denied' 
              ? 'text-rose-400' 
              : 'text-amber-400'
          }`}>
            {state.permissionState || 'A verificar...'}
          </span>
        </div>

        <div>
          <span className="text-stone-500 block text-[10px]">Resolução Vídeo:</span>
          <span className="font-semibold text-stone-300">
            {state.videoDimensions.width > 0 
              ? `${state.videoDimensions.width}x${state.videoDimensions.height}` 
              : 'Sem Sinal (0x0)'}
          </span>
        </div>

        <div>
          <span className="text-stone-500 block text-[10px]">Descodificação:</span>
          <span className="font-semibold text-amber-300">
            {state.fps} fps · {state.totalFramesScanned} frames
          </span>
        </div>

        <div>
          <span className="text-stone-500 block text-[10px]">Última Leitura Raw:</span>
          <span className="font-semibold text-emerald-300 truncate block" title={state.lastRawScanData || 'Nenhum QR lido'}>
            {state.lastRawScanData ? '✅ Lido' : 'Aguardando QR...'}
          </span>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-stone-800 bg-stone-900/30 text-[11px]">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'logs' 
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/80' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Eventos & Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'specs' 
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/80' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Dispositivo & Navegador
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'devices' 
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/80' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Câmaras ({state.availableDevices.length})
        </button>

        {onClearLogs && (
          <button
            onClick={onClearLogs}
            className="ml-auto px-3 py-1 text-stone-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            title="Limpar logs"
          >
            <Trash2 className="w-3 h-3" />
            <span className="text-[10px]">Limpar</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`overflow-y-auto p-3 transition-all ${isExpanded ? 'h-72' : 'h-36'}`}>
        {activeTab === 'logs' && (
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-stone-600 text-center py-4">Nenhum evento registado até ao momento.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-1.5 leading-tight">
                  <span className="text-stone-600 text-[10px] shrink-0 font-mono">[{log.timestamp}]</span>
                  {log.type === 'error' && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                  {log.type === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                  {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                  {log.type === 'info' && <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 break-all">
                    <span className={
                      log.type === 'error' 
                        ? 'text-rose-300 font-semibold' 
                        : log.type === 'warn' 
                        ? 'text-amber-300' 
                        : log.type === 'success' 
                        ? 'text-emerald-300' 
                        : 'text-stone-300'
                    }>
                      {log.message}
                    </span>
                    {log.data && (
                      <pre className="mt-0.5 p-1 rounded bg-stone-900 text-[10px] text-stone-400 overflow-x-auto">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-2 text-stone-300 text-[11px]">
            <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-stone-900/60 border border-stone-800">
              <div>
                <span className="text-stone-500">URL / Origem:</span>
                <p className="truncate font-mono">{state.host}</p>
              </div>
              <div>
                <span className="text-stone-500">Protocolo:</span>
                <p className="font-mono">{state.protocol} ({state.isSecureContext ? 'Seguro' : 'Inseguro'})</p>
              </div>
              <div>
                <span className="text-stone-500">mediaDevices API:</span>
                <p>{state.hasMediaDevices ? '✅ Disponível' : '❌ Inexistente'}</p>
              </div>
              <div>
                <span className="text-stone-500">Video readyState:</span>
                <p>{state.videoReadyState} {state.videoReadyState >= 2 ? '(Reprodução OK)' : '(A carregar)'}</p>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
              <span className="text-stone-500 block mb-1">User Agent (Dispositivo):</span>
              <p className="text-[10px] text-stone-400 break-all font-mono">{state.userAgent}</p>
            </div>

            {state.activeTrackSettings && (
              <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                <span className="text-stone-500 block mb-1">Track Settings Ativas:</span>
                <pre className="text-[10px] text-stone-400 font-mono">
                  {JSON.stringify(state.activeTrackSettings, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="space-y-2">
            {state.availableDevices.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Nenhuma câmara identificada ainda (permissão pode estar pendente).</p>
            ) : (
              state.availableDevices.map((dev, idx) => (
                <div key={dev.deviceId || idx} className="p-2 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-stone-200">{dev.label || `Câmara #${idx + 1}`}</span>
                    <span className="text-stone-500 block text-[10px]">{dev.kind} · {dev.deviceId.slice(0, 12)}...</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Raw Scan Data Footer if available */}
      {state.lastRawScanData && (
        <div className="px-3 py-2 bg-emerald-950/40 border-t border-emerald-900/50 flex items-center justify-between">
          <span className="text-[10px] text-emerald-400 font-semibold truncate">
            Raw QR: {state.lastRawScanData}
          </span>
          <span className="text-[9px] text-emerald-500/80 shrink-0 font-mono">
            {state.lastScanTimestamp}
          </span>
        </div>
      )}
    </div>
  );
};
