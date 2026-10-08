import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, RefreshCw, Calendar, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { formatPortugueseDate } from '../types/loyalty';

export const DailyPosterView: React.FC = () => {
  const {
    dailyPass,
    regenerateDailyPass,
    setActiveTab,
  } = useLoyalty();

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrPayloadUrl = `${originUrl}/?dailyToken=${encodeURIComponent(dailyPass.qrToken)}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-stone-900">
            Expositor de Balcão — QR Code Exclusivo do Dia (Acesso Caixa)
          </h2>
          <p className="text-xs text-stone-600">
            Imprima esta folha para o balcão ou deixe visível no tablet da caixa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Painel Caixa</span>
          </button>
          <button
            type="button"
            onClick={regenerateDailyPass}
            className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar Novo QR Hoje</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Imprimir Cartaz</span>
          </button>
        </div>
      </div>

      {/* Printable / Kiosk Poster Frame */}
      <div className="bg-white rounded-3xl border-2 border-stone-900 shadow-xl overflow-hidden text-center">
        {/* Top Banner */}
        <div className="bg-stone-900 text-stone-100 px-8 py-6 space-y-1.5">
          <span className="text-xs text-amber-400 font-medium tracking-wide block">
            Clube de Fidelização Oficial
          </span>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-stone-50">
            Pitstop Roast & Bakery
          </h1>
          <p className="text-xs text-stone-300">
            Acumule 8 carimbos nas suas visitas diárias e ganhe:{' '}
            <strong className="text-amber-300">{dailyPass.treatTitle}</strong>
          </p>
        </div>

        {/* Center QR & Date Verification */}
        <div className="p-8 sm:p-10 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700">
            <Calendar className="w-4 h-4 text-amber-800" />
            <span className="capitalize">Válido apenas hoje: {formatPortugueseDate(dailyPass.dateStr)}</span>
          </div>

          <div className="max-w-[260px] mx-auto p-5 rounded-3xl bg-[#FDFBF7] border-2 border-stone-800 shadow-xs flex flex-col items-center justify-center">
            <QRCodeSVG
              value={qrPayloadUrl}
              size={210}
              level="M"
              includeMargin={false}
              fgColor="#1c1917"
              bgColor="#FDFBF7"
            />
          </div>

          {/* Manual Daily Code Fallback */}
          <div className="max-w-sm mx-auto pt-2 space-y-1">
            <span className="text-xs text-stone-500 block">
              Código Diário de Balcão (caso a câmara não leia):
            </span>
            <div className="py-2.5 px-4 rounded-xl bg-stone-100 border border-stone-200 font-mono font-semibold text-lg tracking-widest text-stone-900 tabular-nums">
              {dailyPass.manualCode}
            </div>
          </div>

          {/* 3-Step Customer Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200 text-left">
            <div className="space-y-1">
              <span className="font-mono text-xs font-semibold text-amber-800">01. Aponte a Câmara</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                Leia este QR Code com a câmara do seu telemóvel ou dentro do seu cartão digital.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs font-semibold text-amber-800">02. Validação do Dia</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                Recebe 1 carimbo imediato associado ao seu número de telemóvel.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs font-semibold text-amber-800">03. 8.ª Oferta</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                Ao 8.º carimbo, o seu vale de oferta fica pronto a descontar na caixa.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Código criptográfico diário renovado pelo operador · Emitido às{' '}
              {new Date(dailyPass.generatedAt).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
