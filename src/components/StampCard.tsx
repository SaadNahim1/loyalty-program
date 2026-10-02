import React, { useState } from 'react';
import { Coffee, Sparkles, Gift, QrCode, Smartphone, SlidersHorizontal, Plus, ShieldCheck, User, Phone, Check } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const StampCard: React.FC = () => {
  const {
    customer,
    addSingleStamp,
    setActiveTab,
    setIsScannerOpen,
    selectCustomerProfile,
    allProfiles,
    storeReward,
    setIsConfigRewardOpen,
    setIsProfileModalOpen,
    isStaffAuthenticated,
  } = useLoyalty();

  const [justStampedIndex, setJustStampedIndex] = useState<number | null>(null);

  const totalSlots = 8;
  const currentStamps = customer.currentStamps;
  const stampsRemaining = Math.max(0, totalSlots - currentStamps);

  const handleQuickPunch = () => {
    const nextIdx = Math.min(totalSlots - 1, currentStamps);
    setJustStampedIndex(nextIdx);
    setTimeout(() => setJustStampedIndex(null), 700);

    addSingleStamp('counter_code', 'Simulação de Visita (+1 Carimbo)');
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Active Treat Reward Banner */}
      <div className="bg-amber-900/90 text-amber-50 rounded-2xl p-3.5 sm:p-4 shadow-sm border border-amber-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-amber-950" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
              Oferta ao 8º Carimbo
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">
              {storeReward.treatTitle}
            </h4>
          </div>
        </div>

        {isStaffAuthenticated && (
          <button
            onClick={() => setIsConfigRewardOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-800 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-700/80 whitespace-nowrap shrink-0"
            title="Alterar a oferta atribuída aos 8 carimbos"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Alterar Oferta</span>
          </button>
        )}
      </div>

      {/* Identificação do Cliente / Guardar com Telemóvel Banner */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            customer.phone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {customer.phone ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900">
                {customer.phone ? customer.name : 'Cartão Não Registado'}
              </span>
              {customer.phone && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-medium">
                  {customer.phone}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              {customer.phone
                ? 'Cartão protegido e associado ao seu número.'
                : 'Registe o seu nome e telemóvel para guardar os seus carimbos.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors border shrink-0 ${
            customer.phone
              ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
              : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold border-amber-400 shadow-xs'
          }`}
        >
          {customer.phone ? 'Alterar' : 'Ativar Cartão'}
        </button>
      </div>

      {/* Staff Demo Switcher (Only visible to authenticated staff with PIN) */}
      {isStaffAuthenticated && (
        <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <Smartphone className="w-4 h-4 text-amber-800" />
            <span>Modo Operador (Alternar Clientes):</span>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200">
            {allProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => selectCustomerProfile(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  customer.id === p.id
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title={`Ver cartão de ${p.name}`}
              >
                {p.name.split(' ')[0]} ({p.currentStamps}/8)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Physical Punch Card Container */}
      <div className="relative rounded-3xl bg-[#fdfbf7] border-2 border-stone-200 shadow-xl overflow-hidden stamp-card-pattern transition-all">
        {/* Top Header Strip */}
        <div className="bg-stone-900 text-stone-100 px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div>
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold block">
              Cartão de Carimbos Digital
            </span>
            <h2 className="text-xl font-extrabold text-amber-100 font-display">
              Pitstop Roast & Bakery
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block font-mono">Cartão de Membro</span>
            <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
              #{customer.memberId}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Card Info & Progress Message */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
            <div>
              <p className="text-stone-800 font-medium text-sm">
                Cada visita ao balcão vale <strong className="text-amber-900">1 carimbo</strong>. 8º é grátis!
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                <span className="font-semibold text-stone-700">{customer.name}</span>
                {customer.phone && <span>({customer.phone})</span>}
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{customer.completedCardsCount} cartões cheios</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{customer.lifetimeStampsEarned} carimbos totais</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{stampsRemaining === 0 ? 'Cartão Cheio!' : `Faltam ${stampsRemaining} para a oferta`}</span>
            </div>
          </div>

          {/* 8 Stamp Circles Grid */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 py-2">
            {Array.from({ length: totalSlots }).map((_, index) => {
              const isStamped = index < currentStamps;
              const isFreeRewardSlot = index === 7;
              const isJustStamped = justStampedIndex === index;

              return (
                <div
                  key={index}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                    isStamped
                      ? 'bg-amber-100/90 border-2 border-amber-600 shadow-sm'
                      : isFreeRewardSlot
                      ? 'bg-stone-50 border-2 border-dashed border-amber-500/80'
                      : 'bg-white/80 border-2 border-dashed border-stone-300'
                  }`}
                >
                  {/* Slot Number Label */}
                  <span
                    className={`absolute top-1.5 left-2 text-[10px] font-mono font-bold tabular-nums ${
                      isStamped ? 'text-amber-800' : 'text-stone-400'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  {/* Stamp Content */}
                  {isStamped ? (
                    <div
                      className={`flex flex-col items-center justify-center ${
                        isJustStamped ? 'animate-stamp-punch' : ''
                      }`}
                      style={{
                        transform: `rotate(${((index * 7) % 13) - 6}deg)`,
                      }}
                    >
                      {isFreeRewardSlot ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
                          <Gift className="w-6 h-6 animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-800 bg-amber-200 text-amber-900 flex items-center justify-center">
                          <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 mt-1">
                        CARIMBADO
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      {isFreeRewardSlot ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                            <Gift className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 leading-tight">
                            GRÁTIS
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-0.5">
                            <Coffee className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] text-stone-400 font-medium">1 Carimbo</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar & Counter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">
                Progresso dos Carimbos
              </span>
              <span className="font-mono font-bold text-amber-900 tabular-nums">
                {currentStamps} / 8 CARIMBOS
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentStamps / totalSlots) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Ler Código QR do Balcão (+1)</span>
              </button>

              <button
                onClick={handleQuickPunch}
                className="py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                title="Simular 1 carimbo manual"
              >
                <Plus className="w-4 h-4 text-amber-900" />
                <span>+1 Carimbo</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
              <span>Aponte para o código QR físico do balcão.</span>
              <button
                onClick={() => setActiveTab('counter_stand')}
                className="font-bold text-amber-900 underline hover:text-amber-800"
              >
                Ver Cartaz
              </button>
            </div>
          </div>
        </div>

        {/* Notched Scalloped Side Cutouts */}
        <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#f7f5f0] border-r-2 border-stone-200" />
        <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#f7f5f0] border-l-2 border-stone-200" />
      </div>

      {/* Rewards callout if customer has active free treat */}
      {customer.rewards.filter((r) => !r.isRedeemed).length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                Tem {customer.rewards.filter((r) => !r.isRedeemed).length} vale(s) de oferta disponível!
              </h4>
              <p className="text-xs text-stone-600">
                Apresente o código no balcão no seu próximo café ou doce.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('rewards')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap transition-colors"
          >
            Reclamar Oferta
          </button>
        </div>
      )}
    </div>
  );
};
