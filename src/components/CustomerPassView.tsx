import React from 'react';
import { CreditCard, QrCode, Gift, History, Printer, Phone, CheckCircle2, Database, Lock, User } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { StampCard } from './StampCard';
import { CustomerRegistrationView } from './CustomerRegistrationView';
import { RewardsWallet } from './RewardsWallet';
import { HistoryActivity } from './HistoryActivity';
import { TransactionHistory } from './TransactionHistory';
import { CounterQRStand } from './CounterQRStand';
import { OwnerDashboard } from './OwnerDashboard';

export const CustomerPassView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    customer,
    setIsScannerOpen,
    customersDatabase,
    isStaffAuthenticated,
    setIsStaffLoginModalOpen,
  } = useLoyalty();

  const unredeemedRewardsCount = customer.rewards.filter((r) => !r.isRedeemed).length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Customer Info Bar (Only shown on customer tabs, hidden on owner dashboard for focus) */}
      {activeTab !== 'owner_dashboard' && (
        <div className="max-w-xl mx-auto bg-stone-900 text-stone-100 rounded-3xl p-5 border border-stone-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-base shrink-0 shadow-sm font-display">
              {customer.phone ? customer.name.slice(0, 2).toUpperCase() : <User className="w-6 h-6 text-stone-950" />}
              {customer.phone && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-stone-900">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-amber-100">
                  {customer.phone ? customer.name : 'Novo Cliente'}
                </span>
                {customer.phone ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                    Registo Pendente
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400 mt-0.5">
                <span className="font-mono text-stone-300 tabular-nums">#{customer.memberId}</span>
                {customer.phone && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-emerald-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-semibold tabular-nums">
                  {customer.currentStamps}/8 Carimbos
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('counter_stand')}
              className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
              title="Ver cartaz para imprimir no balcão"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cartaz QR</span>
            </button>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              title="Ler código QR para ganhar carimbo"
            >
              <QrCode className="w-4 h-4" />
              <span>Ler QR</span>
            </button>
          </div>
        </div>
      )}

      {/* Segmented Filter Navigation */}
      <div className="max-w-2xl mx-auto flex items-center p-1 bg-stone-200/80 rounded-2xl shadow-inner overflow-x-auto">
        <button
          onClick={() => setActiveTab('stamp_card')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap px-3 ${
            activeTab === 'stamp_card'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Cartão
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap px-3 relative ${
            activeTab === 'rewards'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Ofertas</span>
          {unredeemedRewardsCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-mono">
              {unredeemedRewardsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('counter_stand')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap px-3 ${
            activeTab === 'counter_stand'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Cartaz Balcão
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap px-3 ${
            activeTab === 'history'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Histórico
        </button>

        {/* Staff / Owner Access - Protected by PIN */}
        {isStaffAuthenticated ? (
          <button
            onClick={() => setActiveTab('owner_dashboard')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap px-3 flex items-center justify-center gap-1.5 ${
              activeTab === 'owner_dashboard'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-amber-900 bg-amber-100/70 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Balcão Caixa</span>
            <span className="text-[10px] bg-amber-800 text-white px-1.5 rounded-full font-mono">
              {customersDatabase.length}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setIsStaffLoginModalOpen(true)}
            className="py-2 text-xs font-medium text-stone-500 hover:text-amber-900 transition-colors whitespace-nowrap px-2.5 flex items-center gap-1"
            title="Acesso de Caixa / Staff (PIN)"
          >
            <Lock className="w-3 h-3 text-stone-400" />
            <span>Caixa</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <main className="transition-all">
        {activeTab === 'stamp_card' && (
          !customer.phone ? <CustomerRegistrationView /> : <StampCard />
        )}
        {activeTab === 'rewards' && <RewardsWallet />}
        {activeTab === 'counter_stand' && <CounterQRStand />}
        {activeTab === 'history' && <TransactionHistory />}
        {activeTab === 'owner_dashboard' && <OwnerDashboard />}
      </main>

      {/* Mobile Ergonomic Fixed Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-400">
        <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('stamp_card')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'stamp_card' ? 'text-amber-400' : 'hover:text-stone-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[9px] font-semibold mt-1">Cartão</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`min-h-[48px] flex flex-col items-center justify-center relative transition-colors ${
              activeTab === 'rewards' ? 'text-amber-400' : 'hover:text-stone-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span className="text-[9px] font-semibold mt-1">Ofertas</span>
            {unredeemedRewardsCount > 0 && (
              <span className="absolute top-2.5 right-6 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('counter_stand')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'counter_stand' ? 'text-amber-400' : 'hover:text-stone-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span className="text-[9px] font-semibold mt-1">Balcão</span>
          </button>

          {isStaffAuthenticated ? (
            <button
              onClick={() => setActiveTab('owner_dashboard')}
              className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                activeTab === 'owner_dashboard' ? 'text-amber-400' : 'hover:text-stone-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="text-[9px] font-semibold mt-1">Caixa</span>
            </button>
          ) : (
            <button
              onClick={() => setIsStaffLoginModalOpen(true)}
              className="min-h-[48px] flex flex-col items-center justify-center transition-colors hover:text-stone-200"
            >
              <Lock className="w-4 h-4 text-stone-400" />
              <span className="text-[9px] font-semibold mt-1 text-stone-400">Caixa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
