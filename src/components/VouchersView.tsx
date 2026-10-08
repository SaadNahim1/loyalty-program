import React from 'react';
import { Gift, CheckCircle2, Clock, QrCode } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const VouchersView: React.FC = () => {
  const { customer, setActiveTab, setIsRegistrationOpen } = useLoyalty();

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4">
        <Gift className="w-10 h-10 text-amber-800 mx-auto" />
        <h2 className="font-display font-semibold text-xl text-stone-900">
          Ative o seu cartão para guardar vales de oferta
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Associe o seu número de telemóvel para consultar e resgatar os seus vales de café e pastelaria grátis.
        </p>
        <button
          type="button"
          onClick={() => setIsRegistrationOpen(true)}
          className="px-5 py-3 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
        >
          Ativar ou Recuperar Cartão
        </button>
      </div>
    );
  }

  const activeRewards = (customer.rewards || []).filter((r) => !r.isRedeemed);
  const redeemedRewards = (customer.rewards || []).filter((r) => r.isRedeemed);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-stone-900">
            Carteira de Vales de Oferta
          </h1>
          <p className="text-sm text-stone-600">
            Apresente o código do seu vale ativo ao funcionário da caixa para receber a oferta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className="px-4 py-2.5 rounded-xl bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 text-xs font-semibold transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          Voltar ao Cartão ({customer.currentStamps}/8)
        </button>
      </div>

      {/* Active Vouchers */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-800">
          Vales Disponíveis para Resgate ({activeRewards.length})
        </h2>

        {activeRewards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
            <QrCode className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-medium text-stone-800">
              Não tem vales disponíveis neste momento.
            </p>
            <p className="text-xs text-stone-500">
              Faltam {Math.max(0, 8 - customer.currentStamps)} carimbo(s) para desbloquear a sua próxima oferta grátis!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRewards.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white rounded-2xl border-2 border-amber-700/80 p-6 flex flex-col justify-between space-y-5 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
                    <span>Vale de 8 Carimbos Completos</span>
                    <span className="font-mono tabular-nums">
                      Válido até{' '}
                      {new Date(voucher.expiresAt).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-stone-900">
                    {voucher.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{voucher.description}</p>
                </div>

                <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Código para o Caixa</span>
                    <span className="font-mono font-semibold text-base text-stone-900 tracking-wider">
                      {voucher.code}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pronto a usar</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeemed History */}
      {redeemedRewards.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <h2 className="text-sm font-semibold text-stone-600">
            Histórico de Vales Já Utilizados ({redeemedRewards.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redeemedRewards.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-stone-100 rounded-2xl border border-stone-200 p-5 flex items-center justify-between gap-4 opacity-75"
              >
                <div>
                  <h4 className="text-sm font-semibold text-stone-800 line-through">
                    {voucher.title}
                  </h4>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    Código: {voucher.code} · Utilizado em{' '}
                    {voucher.redeemedAt
                      ? new Date(voucher.redeemedAt).toLocaleDateString('pt-PT')
                      : 'Balcão'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-600 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Entregue</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
