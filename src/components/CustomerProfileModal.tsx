import React, { useState, useEffect } from 'react';
import { X, User, Phone, ShieldCheck, Check } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const CustomerProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, customer, updateCustomerProfile } = useLoyalty();

  const [name, setName] = useState(customer.name === 'Novo Cliente' || customer.name === 'Cliente Pitstop' ? '' : customer.name);
  const [phone, setPhone] = useState(customer.phone);

  useEffect(() => {
    if (isProfileModalOpen) {
      setName(customer.name === 'Novo Cliente' || customer.name === 'Cliente Pitstop' ? '' : customer.name);
      setPhone(customer.phone);
    }
  }, [isProfileModalOpen, customer]);

  if (!isProfileModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateCustomerProfile(name, phone);
    setIsProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100 font-display">
                {!customer.phone ? '🎉 Ativar o Seu Cartão' : 'Dados do Titular'}
              </h3>
              <p className="text-xs text-stone-400">
                {!customer.phone
                  ? 'Registo rápido (10 seg) no primeiro scan'
                  : 'Proteja e personalize o seu cartão'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {!customer.phone && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-xl">☕</span>
              <div>
                <p className="font-bold text-amber-950">Bem-vindo à Pitstop Roast & Bakery!</p>
                <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                  Ganhou o seu 1º carimbo! Introduza o seu nome e telemóvel para ativar o seu cartão digital. Fica gravado no seu telemóvel para as próximas visitas!
                </p>
              </div>
            </div>
          )}

          {/* Card Identifier Box */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-400 block font-mono text-[10px] uppercase">Número do Cartão</span>
              <span className="font-mono font-bold text-stone-900 text-sm">#{customer.memberId}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-400 block font-mono text-[10px] uppercase">Saldo Atual</span>
              <span className="font-mono font-bold text-amber-900 text-sm">{customer.currentStamps}/8 Carimbos</span>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>Nome do Titular</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              <span>Número de Telemóvel</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 912 345 678"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-mono focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Value Prop Banner */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-900">
              Ao introduzir o seu número, os seus carimbos ficam guardados. Se mudar de telemóvel ou limpar os cookies, os seus carimbos mantêm-se protegidos!
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Check className="w-4 h-4 text-stone-950" />
              <span>{!customer.phone ? 'Ativar Cartão & Começar' : 'Salvar Dados no Cartão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
