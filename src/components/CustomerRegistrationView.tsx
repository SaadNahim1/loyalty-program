import React, { useState } from 'react';
import { Coffee, Gift, ShieldCheck, Sparkles, User, Phone, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

export const CustomerRegistrationView: React.FC = () => {
  const { 
    updateCustomerProfile, 
    storeReward, 
    customersDatabase, 
    selectCustomerProfile, 
    showToast 
  } = useLoyalty();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMsg('Por favor, introduza o seu nome.');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 9) {
      setErrorMsg('Por favor, introduza um número de telemóvel válido (mínimo 9 dígitos).');
      return;
    }

    soundFX.playPunch();
    confetti({
      particleCount: 90,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#78350f', '#d97706', '#f59e0b', '#10b981'],
    });

    updateCustomerProfile(cleanName, cleanPhone);
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanDigits = recoveryPhone.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      setErrorMsg('Introduza o seu número de telemóvel com 9 dígitos.');
      return;
    }

    const found = customersDatabase.find((c) => {
      if (!c.phone) return false;
      return c.phone.replace(/\D/g, '') === cleanDigits;
    });

    if (found) {
      selectCustomerProfile(found.id);
      soundFX.playScanBeep();
      showToast('Bem-vindo de Volta!', `Cartão recuperado com sucesso para ${found.name}!`, 'success');
    } else {
      setErrorMsg('Não encontrámos nenhum cartão com este número. Pode criar um novo agora em baixo!');
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-stone-100 p-6 sm:p-7 text-center space-y-3 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-bold flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Coffee className="w-7 h-7 text-stone-950" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Pitstop Roast & Bakery
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-display">
              {isRecovering ? 'Recuperar Cartão' : 'Criar o Seu Cartão de Fidelização'}
            </h2>
            <p className="text-xs text-stone-300 max-w-xs mx-auto leading-relaxed">
              {isRecovering 
                ? 'Insira o seu número de telemóvel para recuperar os seus carimbos acumulados.'
                : 'Registo rápido (15 segundos) para começar a acumular carimbos e ganhar ofertas!'}
            </p>
          </div>

          {/* Value Prop Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>8 Carimbos = {storeReward.treatTitle}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {!isRecovering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reg-customer-name" className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>O seu Nome Completo:</span>
                </label>
                <input
                  id="reg-customer-name"
                  name="name"
                  type="text"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Ferreira"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-customer-phone" className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>Número de Telemóvel:</span>
                </label>
                <input
                  id="reg-customer-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 912 345 678"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-mono focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
                />
                <span className="text-[11px] text-stone-500 block">
                  Usado apenas para garantir que não perde os seus carimbos.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-900">
                  O seu cartão fica gravado neste telemóvel. Ao registar-se agora, recebe já o seu <strong>1º carimbo</strong>!
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ativar Cartão & Receber 1º Carimbo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reg-recovery-phone" className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>O seu Telemóvel Registado:</span>
                </label>
                <input
                  id="reg-recovery-phone"
                  name="recoveryPhone"
                  type="tel"
                  required
                  autoFocus
                  autoComplete="tel"
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
          <div className="pt-3 border-t border-stone-200 text-center">
            {!isRecovering ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsRecovering(true);
                }}
                className="text-xs font-semibold text-stone-600 hover:text-amber-900 transition-colors"
              >
                Já tem um cartão registado? <strong className="text-amber-800 underline">Recuperar por Telemóvel</strong>
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
