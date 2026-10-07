import React, { useState } from 'react';
import { Coffee, Gift, ShieldCheck, Sparkles, User, Phone, ArrowRight, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

export const NewCustomerRegistrationOverlay: React.FC = () => {
  const {
    hasActiveSession,
    isRegistrationOverlayOpen,
    setIsRegistrationOverlayOpen,
    registerCustomerSession,
    pendingFirstScan,
    storeReward,
    customersDatabase,
    selectCustomerProfile,
    showToast,
  } = useLoyalty();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already registered and overlay is not requested, do not render
  if (hasActiveSession && !isRegistrationOverlayOpen) {
    return null;
  }

  // If overlay is explicitly closed and not pending first scan, do not render
  if (!isRegistrationOverlayOpen) {
    return null;
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMsg('Por favor, introduza o seu nome.');
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      setErrorMsg('Por favor, introduza um número de telemóvel válido (mínimo 9 dígitos).');
      return;
    }

    setIsSubmitting(true);
    soundFX.playPunch();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#78350f', '#d97706', '#f59e0b', '#10b981'],
    });

    registerCustomerSession(cleanName, cleanPhone);
    setIsSubmitting(false);
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanDigits = recoveryPhone.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      setErrorMsg('Introduza o seu número de telemóvel com pelo menos 9 dígitos.');
      return;
    }

    const found = customersDatabase.find((c) => {
      if (!c.phone) return false;
      return c.phone.replace(/\D/g, '') === cleanDigits;
    });

    if (found) {
      selectCustomerProfile(found.id);
      soundFX.playScanBeep();
      showToast('Sessão Recuperada!', `Bem-vindo de volta, ${found.name}!`, 'success');
      setIsRegistrationOverlayOpen(false);
    } else {
      setErrorMsg('Não encontrámos nenhum cartão com este número. Crie um novo cartão no formulário de registo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Strip */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-stone-100 p-6 sm:p-7 text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-bold flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-3">
            <Coffee className="w-7 h-7 text-stone-950" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
              Pitstop Roast & Bakery · Programa de Fidelização
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
              {isRecovering ? 'Recuperar o Seu Cartão' : 'Ativar Cartão de Fidelização'}
            </h2>
            <p className="text-xs text-stone-300 max-w-xs mx-auto leading-relaxed pt-1">
              {isRecovering
                ? 'Insira o seu telemóvel para retomar o seu cartão existente.'
                : 'Identifique-se para começar a acumular carimbos e ganhar ofertas exclusivas.'}
            </p>
          </div>

          {/* First Scan Pending Callout */}
          {pendingFirstScan && (
            <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1º Carimbo Detetado no Balcão!</span>
            </div>
          )}

          {/* Reward Goal Pill */}
          {!pendingFirstScan && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[11px] font-semibold">
              <Gift className="w-3 h-3 text-amber-400" />
              <span>8 Carimbos = {storeReward.treatTitle}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-in fade-in">
              ⚠️ {errorMsg}
            </div>
          )}

          {!isRecovering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>O seu Nome Completo:</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Ferreira"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>Número de Telemóvel:</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 912 345 678"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-mono focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
                />
                <span className="text-[11px] text-stone-500 block">
                  Necessário para guardar os seus carimbos com segurança.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-900">
                  {pendingFirstScan 
                    ? 'Ao ativar agora, o seu 1º carimbo fica imediatamente gravado e creditado no seu novo cartão!'
                    : 'Registo único. Fica associado ao seu telemóvel para nunca perder os seus carimbos.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {pendingFirstScan
                    ? 'Ativar Cartão & Receber 1º Carimbo'
                    : 'Criar Cartão & Prosseguir'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>O seu Telemóvel de Registo:</span>
                </label>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  placeholder="Ex: 912 345 678"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-mono focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Restaurar o Meu Cartão</span>
              </button>
            </form>
          )}

          {/* Toggle between Register and Recover */}
          <div className="pt-2 border-t border-stone-200 text-center">
            {!isRecovering ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsRecovering(true);
                }}
                className="text-xs font-semibold text-stone-600 hover:text-amber-900 transition-colors"
              >
                Já tem um cartão anterior? <strong className="text-amber-800 underline">Recuperar por Telemóvel</strong>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsRecovering(false);
                }}
                className="text-xs font-semibold text-stone-600 hover:text-amber-900 transition-colors"
              >
                Quer criar um cartão novo? <strong className="text-amber-800 underline">Voltar ao Registo</strong>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
