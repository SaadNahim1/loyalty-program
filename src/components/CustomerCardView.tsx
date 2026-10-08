import React from 'react';
import {
  Coffee,
  Gift,
  QrCode,
  UserPlus,
  LogOut,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { getTodayDateString } from '../types/loyalty';

export const CustomerCardView: React.FC = () => {
  const {
    customer,
    dailyPass,
    setIsScannerOpen,
    setIsRegistrationOpen,
    logoutCustomer,
    setActiveTab,
    lastPunchedIndex,
  } = useLoyalty();

  const currentStamps = customer?.currentStamps || 0;
  const remainingStamps = Math.max(0, 8 - currentStamps);
  const activeVouchers = customer?.rewards.filter((r) => !r.isRedeemed) || [];
  const today = getTodayDateString();
  const hasCollectedToday =
    !!customer && !dailyPass.allowMultiplePerDay && customer.lastStampedDate === today;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left / Main Column: Digital Stamp Card */}
      <div className="lg:col-span-7 space-y-6">
        {/* Customer Identity Banner */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {customer ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="font-semibold text-stone-900 text-sm">{customer.name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{customer.phone}</span>
                <span aria-hidden="true">·</span>
                <span>Desde {customer.memberSince}</span>
              </div>
              <p className="text-xs text-stone-600">
                {hasCollectedToday
                  ? 'Carimbo diário de hoje já recolhido. Obrigado pela sua visita!'
                  : 'O seu cartão está pronto para ler o QR Code do Dia no balcão.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-stone-900">
                Cartão ainda não associado a telemóvel
              </h2>
              <p className="text-xs text-stone-600">
                Ative com o seu número de telemóvel em 10 segundos para nunca perder os seus carimbos.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {customer ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsRegistrationOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Trocar Conta
                </button>
                <button
                  type="button"
                  onClick={logoutCustomer}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 transition-colors"
                  title="Terminar sessão"
                  aria-label="Terminar sessão"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsRegistrationOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ativar / Recuperar Cartão</span>
              </button>
            )}
          </div>
        </div>

        {/* Physical-Style Stamp Card */}
        <div className="relative rounded-3xl bg-[#FDFBF7] border border-stone-200 shadow-lg overflow-hidden">
          {/* Card Dark Header */}
          <div className="bg-stone-900 text-stone-100 px-6 py-5 flex items-center justify-between border-b border-stone-800">
            <div>
              <span className="text-xs text-amber-400 font-medium block">
                Cartão de Fidelização Digital
              </span>
              <h1 className="font-display font-semibold text-xl sm:text-2xl text-stone-50 tracking-tight">
                Pitstop Roast & Bakery
              </h1>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 block">N.º de Membro</span>
              <span className="font-mono text-sm font-semibold text-amber-300 tabular-nums">
                #{customer ? customer.memberId : 'CONVIDADO'}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Reward Subtitle & Unboxed Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200/80">
              <div>
                <p className="text-sm text-stone-800 font-medium">
                  Complete 8 carimbos e ganhe:{' '}
                  <strong className="text-amber-900 font-semibold">{dailyPass.treatTitle}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1 tabular-nums">
                  <span>{customer?.completedCardsCount || 0} cartões completos</span>
                  <span aria-hidden="true">·</span>
                  <span>{customer?.lifetimeStampsEarned || 0} carimbos acumulados</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {remainingStamps === 0
                      ? 'Oferta desbloqueada'
                      : `Faltam ${remainingStamps} para a oferta`}
                  </span>
                </div>
              </div>
            </div>

            {/* 8-Slot Stamp Grid (No manual clicking - strictly QR read only!) */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 py-1">
              {Array.from({ length: 8 }).map((_, idx) => {
                const isStamped = idx < currentStamps;
                const isEighthSlot = idx === 7;
                const isJustPunched = lastPunchedIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-colors ${
                      isStamped
                        ? 'bg-amber-100/80 border-2 border-amber-700'
                        : isEighthSlot
                        ? 'bg-amber-50/50 border-2 border-dashed border-amber-500/80'
                        : 'bg-white border-2 border-dashed border-stone-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1.5 left-2.5 text-[11px] font-mono font-semibold tabular-nums ${
                        isStamped ? 'text-amber-900' : 'text-stone-400'
                      }`}
                    >
                      0{idx + 1}
                    </span>

                    {isStamped ? (
                      <div
                        className={`flex flex-col items-center justify-center ${
                          isJustPunched ? 'animate-stamp-punch' : ''
                        }`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-800 text-amber-50 flex items-center justify-center shadow-xs">
                          {isEighthSlot ? (
                            <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                          ) : (
                            <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-950 mt-1">
                          Validado
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        {isEighthSlot ? (
                          <>
                            <Gift className="w-5 h-5 text-amber-700 mb-1" />
                            <span className="text-[11px] font-semibold text-amber-900 leading-tight">
                              Oferta
                            </span>
                          </>
                        ) : (
                          <>
                            <Coffee className="w-4 h-4 text-stone-300 mb-1" />
                            <span className="text-[10px] text-stone-400">Carimbo</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-stone-600">Progresso do Cartão Atual</span>
                <span className="font-mono font-semibold text-amber-900 tabular-nums">
                  {currentStamps} / 8 carimbos
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-800 h-full rounded-full transition-transform duration-300 origin-left"
                  style={{ transform: `scaleX(${currentStamps / 8})` }}
                />
              </div>
            </div>

            {/* Primary Action: Strictly Scan Today's QR Code or Enter Daily Code from QR */}
            <div className="pt-3 border-t border-stone-200/80 space-y-3">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-4 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md transition-transform active:scale-[0.99]"
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>Ler QR Code do Dia / Inserir Código do QR</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-xs text-stone-500 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Os carimbos só podem ser validados através do QR Code do Dia ou do código impresso no balcão.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Active Vouchers Preview + Recent Stamp History */}
      <div className="lg:col-span-5 space-y-6">
        {/* Active Reward Banner */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 block">Oferta do 8.º Carimbo</span>
              <h3 className="font-display font-semibold text-lg text-stone-900">
                {dailyPass.treatTitle}
              </h3>
            </div>
            <Gift className="w-6 h-6 text-amber-800 shrink-0" />
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {dailyPass.treatDescription}
          </p>

          {activeVouchers.length > 0 ? (
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-semibold text-emerald-800 block">
                  Tem {activeVouchers.length} vale(s) pronto(s) a descontar!
                </span>
                <span className="text-stone-500">Apresente o código ao funcionário no balcão.</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('vouchers')}
                className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Abrir Vales
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Assim que completar os 8 carimbos, o vale digital fica disponível na sua conta.</span>
            </div>
          )}
        </div>

        {/* Stamp History List */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-base text-stone-900">
              Registo de Visitas Recentes
            </h3>
            <Clock className="w-4 h-4 text-stone-400" />
          </div>

          {!customer || customer.history.length === 0 ? (
            <p className="text-xs text-stone-500 py-4 text-center">
              Ainda não existem carimbos registados neste cartão.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {customer.history.slice(0, 6).map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-stone-800">{item.note}</p>
                    <p className="text-[11px] text-stone-500">
                      {item.source === 'qr_counter_scan'
                        ? 'Leitura de QR no Balcão'
                        : 'Código Manual do QR Diário'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 tabular-nums shrink-0">
                    {new Date(item.timestamp).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                    })}{' '}
                    {new Date(item.timestamp).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
