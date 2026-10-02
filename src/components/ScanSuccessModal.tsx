import React from 'react';
import { Gift, CheckCircle2, ArrowRight, Sparkles, Coffee } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const ScanSuccessModal: React.FC = () => {
  const { scannedStampModal, setScannedStampModal, setActiveTab } = useLoyalty();

  if (!scannedStampModal.isOpen) return null;

  const handleClose = () => {
    setScannedStampModal((prev) => ({ ...prev, isOpen: false }));
    setActiveTab('stamp_card');
  };

  const handleGoToRewards = () => {
    setScannedStampModal((prev) => ({ ...prev, isOpen: false }));
    setActiveTab('rewards');
  };

  const remaining = Math.max(0, 8 - scannedStampModal.newStampsCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Animated Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center shadow-lg">
          {scannedStampModal.isRewardUnlocked ? (
            <Gift className="w-10 h-10 text-white animate-bounce" />
          ) : (
            <Coffee className="w-10 h-10 text-white animate-stamp-punch" />
          )}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            {scannedStampModal.isRewardUnlocked ? '🎉 Parabéns / Congratulations!' : '✓ QR Code Validado com Sucesso'}
          </span>
          <h3 className="text-2xl font-extrabold text-stone-900 font-display">
            {scannedStampModal.isRewardUnlocked ? '8 Carimbos Completos!' : '+1 Carimbo Adicionado!'}
          </h3>
          <p className="text-xs text-stone-600">
            {scannedStampModal.isRewardUnlocked
              ? `Desbloqueou a oferta: "${scannedStampModal.rewardTitle}"!`
              : `O seu carimbo digital foi registado no telemóvel.`}
          </p>
        </div>

        {/* Balance Badge */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">Estado do Cartão:</span>
            <span className="font-mono font-bold text-amber-900 text-sm">
              {scannedStampModal.newStampsCount} / 8 CARIMBOS
            </span>
          </div>
          <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(scannedStampModal.newStampsCount / 8) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-500">
            {scannedStampModal.isRewardUnlocked
              ? 'O seu vale gratuito já está disponível na carteira de prémios.'
              : `Faltam ${remaining} carimbo${remaining > 1 ? 's' : ''} para o seu próximo mimo grátis.`}
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          {scannedStampModal.isRewardUnlocked ? (
            <button
              onClick={handleGoToRewards}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver Minha Oferta Grátis</span>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>Ver Meu Cartão de Carimbos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
