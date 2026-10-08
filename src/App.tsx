import React from 'react';
import { QrCode, CheckCircle2, AlertCircle, Gift, Info, X, Coffee, RotateCcw } from 'lucide-react';
import { LoyaltyProvider, useLoyalty } from './context/LoyaltyContext';
import { CustomerCardView } from './components/CustomerCardView';
import { VouchersView } from './components/VouchersView';
import { DailyPosterView } from './components/DailyPosterView';
import { StaffDashboardView } from './components/StaffDashboardView';
import { QRScannerModal } from './components/QRScannerModal';
import { RegistrationModal } from './components/RegistrationModal';
import { StaffPinModal } from './components/StaffPinModal';

const LoyaltyShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsScannerOpen,
    customer,
    isStaffAuthenticated,
    toast,
    dismissToast,
    isHydrated,
    initializationStage,
    retryInitialization,
  } = useLoyalty();

  // Loading Fallback with Manual Retry and Hydration Reset
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F6F1] text-stone-900 p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-8 text-center space-y-6 animate-in fade-in duration-300">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Coffee className="w-8 h-8 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-300 animate-ping" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block">
              Pitstop Roast & Bakery
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 font-display">
              A carregar o seu Cartão de Fidelização...
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-mono">
              {initializationStage}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={retryInitialization}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tentar Novamente / Carregar Imediatamente</span>
            </button>
            <p className="text-[11px] text-stone-400">
              Clique para forçar o carregamento local caso a rede demore.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeVouchersCount = (customer?.rewards || []).filter((r) => !r.isRedeemed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F1] text-stone-900 font-sans">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-30 bg-[#F8F6F1]/95 backdrop-blur-md border-b border-stone-200/90 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className="font-display font-bold text-lg sm:text-xl tracking-tight text-stone-900 text-left whitespace-nowrap"
          >
            Pitstop Roast & Bakery
          </button>

          {/* Zone 2: Clean text navigation links */}
          <nav className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-medium text-stone-600 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'card'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-amber-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Cartão Digital
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vouchers')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'vouchers'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-amber-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              Vales de Oferta{activeVouchersCount > 0 ? ` (${activeVouchersCount})` : ''}
            </button>
            {isStaffAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab('poster')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'poster'
                    ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-amber-800 decoration-2'
                    : 'hover:text-stone-900'
                }`}
              >
                Cartaz do Dia
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'staff'
                  ? 'text-stone-900 font-semibold underline underline-offset-8 decoration-amber-800 decoration-2'
                  : 'hover:text-stone-900'
              }`}
            >
              {isStaffAuthenticated ? 'Painel Caixa (Ativo)' : 'Área do Caixa'}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Ler QR do Dia</span>
              <span className="sm:hidden">Ler QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="no-print fixed bottom-5 right-5 z-50 max-w-sm w-full px-4 sm:px-0">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
              toast.type === 'reward'
                ? 'bg-amber-900 text-amber-50 border-amber-700'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-stone-900 text-stone-100 border-stone-800'
            }`}
          >
            {toast.type === 'reward' ? (
              <Gift className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs space-y-0.5">
              <p className="font-semibold text-sm">{toast.title}</p>
              <p className="opacity-90 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              className="text-stone-400 hover:text-white p-1"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'card' && <CustomerCardView />}
        {activeTab === 'vouchers' && <VouchersView />}
        {activeTab === 'poster' && <DailyPosterView />}
        {activeTab === 'staff' && <StaffDashboardView />}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="no-print mt-auto border-t border-stone-200/80 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Pitstop Roast & Bakery · Clube de Fidelização Digital</span>
          <div className="flex items-center gap-2">
            <span>1 Visita Diária = 1 Carimbo</span>
            <span aria-hidden="true">·</span>
            <span>8 Carimbos = 1 Oferta Grátis</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QRScannerModal />
      <RegistrationModal />
      <StaffPinModal />
    </div>
  );
};

export default function App() {
  return (
    <LoyaltyProvider>
      <LoyaltyShell />
    </LoyaltyProvider>
  );
}
