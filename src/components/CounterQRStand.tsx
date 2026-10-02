import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Coffee, 
  Printer, 
  ArrowRight, 
  Gift, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  HelpCircle,
  Maximize2,
  X,
  Sparkles,
  Award,
  UserPlus
} from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const CounterQRStand: React.FC = () => {
  const { 
    addSingleStamp, 
    setActiveTab, 
    customer, 
    storeReward, 
    setIsConfigRewardOpen, 
    showToast,
    setIsProfileModalOpen
  } = useLoyalty();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const devAppUrl = 'https://ais-dev-pjuubqjgfxehwd43yi2do6-676342438389.europe-west1.run.app';
  const publicAppUrl = 'https://ais-pre-pjuubqjgfxehwd43yi2do6-676342438389.europe-west1.run.app';
  const firebaseHostingUrl = 'https://vibrant-psyche-7q6d2.web.app';
  const currentHostUrl = typeof window !== 'undefined' ? window.location.origin : devAppUrl;

  const [selectedBaseUrl, setSelectedBaseUrl] = useState<'firebase' | 'dev' | 'shared' | 'custom'>('firebase');
  const [customUrl, setCustomUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Target URL based on active server
  const activeBase =
    selectedBaseUrl === 'firebase'
      ? firebaseHostingUrl
      : selectedBaseUrl === 'dev'
      ? (currentHostUrl.includes('run.app') ? currentHostUrl : devAppUrl)
      : selectedBaseUrl === 'shared'
      ? publicAppUrl
      : (customUrl.trim() || currentHostUrl);

  const qrTargetUrl = `${activeBase}/?scan=counter`;

  // Render QR Code onto main canvas with 'L' error correction for larger, easy-to-scan dots
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrTargetUrl,
        {
          width: 280,
          margin: 2,
          errorCorrectionLevel: 'L',
          color: {
            dark: '#1c1917',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [qrTargetUrl]);

  // Render Zoomed QR code
  useEffect(() => {
    if (isZoomModalOpen && zoomCanvasRef.current) {
      QRCode.toCanvas(
        zoomCanvasRef.current,
        qrTargetUrl,
        {
          width: 360,
          margin: 3,
          errorCorrectionLevel: 'L',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [isZoomModalOpen, qrTargetUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleTestScan = () => {
    addSingleStamp('qr_counter_scan', 'Simulação de Leitura do Balcão (+1)');
    setActiveTab('stamp_card');
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(qrTargetUrl);
    setCopied(true);
    showToast('Link Copiado', 'Link do carimbo copiado para a área de transferência.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="font-bold text-stone-900 text-sm">Cartaz do Balcão da Cafetaria</h3>
          <p className="text-xs text-stone-500">
            Coloque este código QR junto à caixa registadora e máquina de café.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigRewardOpen(true)}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
          >
            Editar Oferta
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Cartaz</span>
          </button>
        </div>
      </div>

      {/* Guia / Explicação para Testar no Telemóvel */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-950 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-amber-700" />
            <span>Como Testar no Seu Telemóvel Real</span>
          </span>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-[11px] text-amber-800 hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHelp ? 'Fechar Ajuda' : 'Por que não abre na câmara?'}</span>
          </button>
        </div>

        {showHelp ? (
          <div className="p-3 bg-white/90 rounded-xl border border-amber-300 text-stone-700 space-y-2 text-[11px]">
            <p className="font-semibold text-amber-950">
              Por que a câmara normal do telemóvel dá erro ou não abre este link de teste?
            </p>
            <p>
              Como esta aplicação está a correr no ambiente de testes do Google Cloud, a Google exige autenticação com a sua conta Google (<strong>vendatechsol@gmail.com</strong>).
            </p>
            <p className="font-medium text-stone-900">
              Para testar no seu telemóvel agora:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-stone-600">
              <li>Abra o navegador do telemóvel (Safari ou Chrome).</li>
              <li>Aceda diretamente a: <span className="font-mono text-amber-900 font-bold break-all">{publicAppUrl}</span></li>
              <li>Se pedir login, confirme com a conta Google.</li>
              <li>Com a página aberta no telemóvel, toque em <strong>&ldquo;Ler QR (+1)&rdquo;</strong> e aponte para o ecrã do computador!</li>
            </ol>
          </div>
        ) : (
          <p className="text-[11px] text-amber-900 leading-relaxed">
            Abra o link <strong className="font-mono">{publicAppUrl}</strong> no navegador do telemóvel. Quando abrir, use o botão <strong>&ldquo;Ler QR&rdquo;</strong> da aplicação para carimbar no mesmo segundo!
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
          <span className="text-[11px] font-bold text-amber-950">Servidor QR:</span>
          <button
            onClick={() => setSelectedBaseUrl('firebase')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              selectedBaseUrl === 'firebase'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            🔥 Firebase Hosting
          </button>
          <button
            onClick={() => setSelectedBaseUrl('dev')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              selectedBaseUrl === 'dev'
                ? 'bg-amber-800 text-white'
                : 'bg-white text-stone-700 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            Servidor Dev
          </button>
          <button
            onClick={() => setSelectedBaseUrl('shared')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              selectedBaseUrl === 'shared'
                ? 'bg-amber-800 text-white'
                : 'bg-white text-stone-700 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            Link Partilhado
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 font-mono text-[11px] text-stone-600 truncate border-t border-amber-200">
          <span className="truncate">{qrTargetUrl}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-700"
              title="Copiar URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={qrTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-700"
              title="Abrir este link numa nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* O Cartaz Físico de Balcão (Pronto para Imprimir) */}
      <div className="bg-[#fdfbf7] rounded-3xl border-4 border-amber-800/80 shadow-2xl p-6 sm:p-8 text-center space-y-6 stamp-card-pattern">
        {/* Brand Header */}
        <div className="space-y-1 border-b-2 border-stone-200 pb-4">
          <div className="flex items-center justify-center gap-2 text-amber-800">
            <Coffee className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-900">
              Pitstop Roast & Bakery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
            Aponte a Câmara para Ganhar 1 Carimbo!
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <Gift className="w-3.5 h-3.5 text-amber-700" />
            <span>8 Carimbos = {storeReward.treatTitle}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative inline-block p-4 sm:p-5 rounded-3xl bg-white border-2 border-stone-300 shadow-md">
          <canvas ref={canvasRef} className="rounded-xl shadow-xs mx-auto" />
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-stone-400">
              1 Visita = 1 Carimbo
            </span>
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200"
              title="Aumentar tamanho do código para leitura na câmara"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ampliar</span>
            </button>
          </div>
        </div>

        {/* 3 Passos Simples */}
        <div className="grid grid-cols-3 gap-2 text-left bg-white/90 rounded-2xl p-4 border border-stone-200 text-xs">
          <div className="space-y-1">
            <span className="w-5 h-5 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-[10px]">
              1
            </span>
            <p className="font-bold text-stone-900 text-[11px]">Abra a Câmara</p>
            <p className="text-stone-500 text-[10px] leading-tight">
              Aponte a câmara do telemóvel para este código.
            </p>
          </div>
          <div className="space-y-1">
            <span className="w-5 h-5 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-[10px]">
              2
            </span>
            <p className="font-bold text-stone-900 text-[11px]">Toque no Link</p>
            <p className="text-stone-500 text-[10px] leading-tight">
              Abra a notificação que surge no ecrã.
            </p>
          </div>
          <div className="space-y-1">
            <span className="w-5 h-5 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-[10px]">
              3
            </span>
            <p className="font-bold text-stone-900 text-[11px]">Carimbo Ganho</p>
            <p className="text-stone-500 text-[10px] leading-tight">
              O cartão adiciona +1 carimbo de imediato!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-stone-500 text-[11px]">
          Válido em todos os cafés e produtos de pastelaria fresca.
        </div>
      </div>

      {/* Bancada de Testes Rápidos */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 sm:p-6 border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-sm text-white font-display">Bancada de Testes Operacionais</h4>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Simulador de Teste
          </span>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          Pode testar todos os cenários reais do programa de fidelização sem precisar de telemóvel:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Cenário 1: +1 Carimbo */}
          <button
            onClick={() => {
              addSingleStamp('qr_counter_scan', 'Simulação Balcão (+1 Carimbo)');
              setActiveTab('stamp_card');
            }}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left transition-colors border border-stone-700 group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">1. Simular Scan no Balcão</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Adiciona +1 carimbo ao cartão atual ({customer.currentStamps}/8)</p>
            </div>
          </button>

          {/* Cenário 2: Completar 8 carimbos */}
          <button
            onClick={() => {
              // Add remaining stamps until 8
              const needed = Math.max(1, 8 - customer.currentStamps);
              for (let i = 0; i < needed; i++) {
                addSingleStamp('qr_counter_scan', `Carimbo #${customer.currentStamps + i + 1}`);
              }
              setActiveTab('stamp_card');
            }}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left transition-colors border border-stone-700 group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">2. Completar 8 Carimbos</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Desbloqueia o vale de oferta com confetes 🎉</p>
            </div>
          </button>

          {/* Cenário 3: Novo registo de cliente */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left transition-colors border border-stone-700 group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">3. Testar Registo de Cliente</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Abrir ecrã de Nome + Nº de Telemóvel</p>
            </div>
          </button>

          {/* Cenário 4: Ver Histórico Firestore */}
          <button
            onClick={() => setActiveTab('history')}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-left transition-colors border border-stone-700 group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">4. Ver Histórico no Firestore</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Consulta datas e ofertas gravadas na nuvem</p>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Zoom do QR Code para Leitura Fácil na Câmara */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-stone-200 p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-stone-900 font-display">Código QR Ampliado</h3>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Aponte a câmara do telemóvel para este código de alta resolução:
            </p>
            <div className="p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-inner inline-block">
              <canvas ref={zoomCanvasRef} className="rounded-xl mx-auto" />
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
