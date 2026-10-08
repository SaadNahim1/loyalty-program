import React, { useState } from 'react';
import { X, Phone, User, ArrowRight, RotateCcw } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const RegistrationModal: React.FC = () => {
  const {
    isRegistrationOpen,
    setIsRegistrationOpen,
    registerOrRecoverCustomer,
    dailyPass,
  } = useLoyalty();

  const [mode, setMode] = useState<'register' | 'recover'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isRegistrationOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      setError('Introduza um número de telemóvel válido com pelo menos 9 dígitos.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Por favor, indique o seu nome para identificar o cartão.');
      return;
    }

    setIsSubmitting(true);
    const ok = await registerOrRecoverCustomer(name, phone, mode);
    setIsSubmitting(false);

    if (ok) {
      setName('');
      setPhone('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-5 flex items-start justify-between">
          <div>
            <span className="text-xs text-amber-400 font-medium">
              Pitstop Roast & Bakery · 8 Carimbos = {dailyPass.treatTitle}
            </span>
            <h3 className="font-display font-semibold text-xl text-stone-50 mt-1">
              {mode === 'register' ? 'Ativar Cartão de Cliente' : 'Recuperar Cartão Existente'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsRegistrationOpen(false)}
            className="w-9 h-9 rounded-xl bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Fechar janela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Novo Cartão
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('recover');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'recover'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Já Tenho Cartão
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="cust-name-input"
                  className="text-xs font-semibold text-stone-700 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-amber-800" />
                  <span>O Seu Nome</span>
                </label>
                <input
                  id="cust-name-input"
                  name="customerName"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sofia Martins"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-amber-700 focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="cust-phone-input"
                className="text-xs font-semibold text-stone-700 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-amber-800" />
                <span>Número de Telemóvel</span>
              </label>
              <input
                id="cust-phone-input"
                name="customerPhone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 912 345 678"
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-mono tabular-nums focus:outline-none focus:border-amber-700 focus:bg-white transition-colors"
              />
              <p className="text-xs text-stone-500">
                Os seus carimbos ficam sincronizados na cloud através do seu número.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {mode === 'register' ? (
                <>
                  <span>Guardar e Ativar Cartão</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Recuperar o Meu Saldo</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
