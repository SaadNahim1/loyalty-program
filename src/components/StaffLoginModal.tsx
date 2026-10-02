import React, { useState } from 'react';
import { Lock, X, KeyRound, ShieldAlert, Check, ArrowRight } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const StaffLoginModal: React.FC = () => {
  const { isStaffLoginModalOpen, setIsStaffLoginModalOpen, loginStaffWithPin } = useLoyalty();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isStaffLoginModalOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) return;

    const ok = loginStaffWithPin(pin);
    if (!ok) {
      setError(true);
      setPin('');
    } else {
      setPin('');
      setError(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        setTimeout(() => {
          const ok = loginStaffWithPin(nextPin);
          if (!ok) {
            setError(true);
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100 font-display">Acesso de Caixa & Dono</h3>
              <p className="text-[11px] text-stone-400">Área protegida por PIN</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsStaffLoginModalOpen(false);
              setPin('');
              setError(false);
            }}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PIN Indicators */}
        <div className="text-center space-y-3 py-2">
          <p className="text-xs text-stone-300">
            Introduza o PIN de 4 dígitos do balcão:
          </p>

          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  error
                    ? 'border-red-500 bg-red-500/30 animate-shake'
                    : pin.length > index
                    ? 'border-amber-400 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                    : 'border-stone-700 bg-stone-800'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>PIN incorreto. Tente novamente.</span>
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((key) => {
            const isAction = key === 'C' || key === 'OK';

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === 'C') handleClear();
                  else if (key === 'OK') handleSubmit();
                  else handleDigit(key);
                }}
                className={`py-3.5 rounded-2xl text-base font-bold transition-all active:scale-95 flex items-center justify-center ${
                  isAction
                    ? key === 'OK'
                      ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                    : 'bg-stone-800/80 hover:bg-stone-800 text-white border border-stone-700/60'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Helper Note */}
        <div className="pt-2 text-center border-t border-stone-800">
          <span className="text-[11px] text-stone-400">
            PIN inicial de demonstração: <strong className="text-amber-400 font-mono">1234</strong>
          </span>
          <p className="text-[10px] text-stone-500 mt-1">
            Os clientes comuns nunca veem a base de dados nem os dados de outros clientes.
          </p>
        </div>
      </div>
    </div>
  );
};
