import React from 'react';
import { QrCode, Gift, Database, Lock, LogOut } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsScannerOpen,
    setIsConfigRewardOpen,
    customersDatabase,
    isStaffAuthenticated,
    setIsStaffLoginModalOpen,
    logoutStaff,
  } = useLoyalty();

  return (
    <header className="sticky top-0 z-30 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('stamp_card');
            }}
            className="text-lg sm:text-xl font-bold tracking-tight text-amber-100 hover:text-amber-300 transition-colors whitespace-nowrap font-display"
          >
            Pitstop Roast & Bakery
          </a>
        </div>

        {/* Navigation links (Customer sees only client tabs; staff sees management) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
          <button
            onClick={() => setActiveTab('stamp_card')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap ${
              activeTab === 'stamp_card' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Cartão
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap ${
              activeTab === 'rewards' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Ofertas
          </button>
          <button
            onClick={() => setActiveTab('counter_stand')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap ${
              activeTab === 'counter_stand' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Cartaz Balcão
          </button>

          {isStaffAuthenticated && (
            <button
              onClick={() => setActiveTab('owner_dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors whitespace-nowrap ${
                activeTab === 'owner_dashboard'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800 text-amber-200 hover:bg-stone-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Base de Dados (Caixa)</span>
              <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.2 rounded-full font-mono">
                {customersDatabase.length}
              </span>
            </button>
          )}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isStaffAuthenticated ? (
            <>
              <button
                onClick={() => setIsConfigRewardOpen(true)}
                className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-950/80 rounded-lg hover:bg-amber-900 transition-colors items-center gap-1.5 whitespace-nowrap border border-amber-800"
                title="Configurar a oferta dos 8 carimbos"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>8ª Oferta</span>
              </button>

              <button
                onClick={logoutStaff}
                className="px-2.5 py-1.5 text-xs font-semibold text-red-200 bg-red-950/80 border border-red-800 rounded-lg hover:bg-red-900 transition-colors flex items-center gap-1"
                title="Bloquear sessão de caixa"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsStaffLoginModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-stone-400 hover:text-amber-300 bg-stone-800/80 hover:bg-stone-800 rounded-lg border border-stone-700/80 transition-colors flex items-center gap-1.5"
              title="Acesso reservado ao operador de caixa e gerência (PIN)"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Área Caixa</span>
            </button>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            title="Ler código QR para ganhar carimbo"
          >
            <QrCode className="w-4 h-4" />
            <span>Ler QR (+1)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
