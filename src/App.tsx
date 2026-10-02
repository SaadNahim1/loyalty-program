/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { Header } from './components/Header';
import { CustomerPassView } from './components/CustomerPassView';
import { QRScannerModal } from './components/QRScannerModal';
import { TreatConfigModal } from './components/TreatConfigModal';
import { ScanSuccessModal } from './components/ScanSuccessModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { StaffLoginModal } from './components/StaffLoginModal';
import { NotificationToast } from './components/NotificationToast';
import { Coffee, Gift } from 'lucide-react';

const MainContent: React.FC = () => {
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
