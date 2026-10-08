import React, { useState } from 'react';
import { Lock, X, ShieldCheck } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const StaffPinModal: React.FC = () => {
  const { isStaffPinModalOpen, setIsStaffPinModalOpen, authenticateStaff } = useLoyalty();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isStaffPinModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = authenticateStaff(pin);
    if (ok) {
      setPin('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="bg-stone-900 text-stone-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-semibold text-lg">Acesso Caixa / Operador</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setPin('');
              setError(false);
              setIsStaffPinModalOpen(false);
            }}
            className="w-9 h-9 rounded-xl bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Introduza o PIN de operador para aceder ao painel do caixa, gerar o <strong>QR Code do Dia</strong> ou validar vales de oferta.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="staff-pin-field" className="text-xs font-semibold text-stone-700 block">
              PIN de Balcão
            </label>
            <input
              id="staff-pin-field"
              name="staffPin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              autoFocus
              required
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-center text-lg font-mono tracking-widest text-stone-900 focus:outline-none focus:border-amber-700 focus:bg-white"
            />
            {error && (
              <p className="text-xs text-rose-600 font-medium">
                PIN incorreto. (Predefinido para teste: 1234)
              </p>
            )}
            <p className="text-[11px] text-stone-400 text-center">
              PIN padrão de demonstração: <span className="font-mono font-semibold text-stone-600">1234</span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Entrar no Modo Caixa</span>
          </button>
        </form>
      </div>
    </div>
  );
};
