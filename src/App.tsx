/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LoyaltyProvider, useLoyalty } from './context/LoyaltyContext';
import { Header } from './components/Header';
import { CustomerPassView } from './components/CustomerPassView';
import { QRScannerModal } from './components/QRScannerModal';
import { TreatConfigModal } from './components/TreatConfigModal';
import { ScanSuccessModal } from './components/ScanSuccessModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { StaffLoginModal } from './components/StaffLoginModal';
import { NotificationToast } from './components/NotificationToast';
import { NewCustomerRegistrationOverlay } from './components/NewCustomerRegistrationOverlay';
import { Coffee, Gift, RotateCcw } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isHydrated, retryInitialization, initializationStage } = useLoyalty();

  // Loading Fallback with Manual Retry and Hydration Reset
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f5f0] text-stone-900 p-6 font-sans">
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f0] text-stone-900 font-sans">
      <Header />

      {/* Hero Sub-header Context Bar */}
      <div className="bg-stone-900/95 text-stone-300 py-2.5 px-4 border-b border-stone-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-stone-200">Pitstop Coffee Shop & Fresh Bakery</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="text-stone-400">Scan Counter QR at checkout for 1 stamp</span>
          </div>

          <div className="flex items-center gap-3 text-stone-400 text-[11px]">
            <span className="flex items-center gap-1 text-amber-300">
              <Coffee className="w-3.5 h-3.5" />
              1 Scan = 1 Stamp
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" />
              Collect 8 Stamps = Free Treat
            </span>
          </div>
        </div>
      </div>

      {/* Main Dynamic View */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <CustomerPassView />
      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-stone-100 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-stone-600 font-medium">
            <span>Coffee Shop & Bakery Loyalty Program</span>
            <span aria-hidden="true">·</span>
            <span>Digital Stamp Card</span>
            <span aria-hidden="true">·</span>
            <span>1 Scan = 1 Stamp</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Collect 8 stamps to unlock your complimentary coffee shop treat.
          </p>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <NewCustomerRegistrationOverlay />
      <QRScannerModal />
      <TreatConfigModal />
      <ScanSuccessModal />
      <CustomerProfileModal />
      <StaffLoginModal />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <LoyaltyProvider>
      <MainContent />
    </LoyaltyProvider>
  );
}
