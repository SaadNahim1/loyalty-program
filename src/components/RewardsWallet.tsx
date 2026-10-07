import React, { useState } from 'react';
import { Gift, Check, Clock, Coffee, Croissant } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { RewardVoucher } from '../types';

export const RewardsWallet: React.FC = () => {
  const { customer, redeemReward, setActiveTab } = useLoyalty();
  const [selectedVoucher, setSelectedVoucher] = useState<RewardVoucher | null>(null);

  const activeRewards = (customer?.rewards || []).filter((r) => !r.isRedeemed);
  const usedRewards = (customer?.rewards || []).filter((r) => r.isRedeemed);

  const handleRedeem = (voucher: RewardVoucher) => {
    redeemReward(voucher.id);
    setSelectedVoucher(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Wallet Header Card */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 border border-stone-800 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold block">
            Coffee & Bakery Treats
          </span>
          <h2 className="text-xl font-bold text-amber-100 font-display">
            Your Rewards Wallet
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Redeem at the coffee shop and bakery counter on your next visit.
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {activeRewards.length}
          </span>
          <span className="text-xs text-stone-400 block">Available</span>
        </div>
      </div>

      {/* Active Rewards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
          Active Free Treat Vouchers
        </h3>

        {activeRewards.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-stone-900 text-base">No active vouchers right now</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                You have {customer.currentStamps}/8 stamps on your active punch card. Collect{' '}
                {8 - customer.currentStamps} more stamps to earn a free handcrafted coffee or fresh bakery item!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('stamp_card')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
            >
              View Stamp Card
            </button>
          </div>
        ) : (
          activeRewards.map((voucher) => (
            <div
              key={voucher.id}
              className="relative bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:border-amber-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
            >
              {/* Left Accent Bar */}
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />

              <div className="flex items-start gap-3.5 pl-2">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 text-base">{voucher.title}</h4>
                  <p className="text-xs text-stone-600">{voucher.description}</p>
                  <div className="flex items-center gap-3 text-xs text-stone-400 pt-1 font-mono">
                    <span>CODE: <strong className="text-stone-800">{voucher.code}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Expires in 30 days
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedVoucher(voucher)}
                className="self-start sm:self-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs whitespace-nowrap transition-colors shadow-xs"
              >
                Claim at Counter
              </button>
            </div>
          ))
        )}
      </div>

      {/* Redeemed / Used History */}
      {usedRewards.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-200">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Past Redeemed Rewards
          </h3>
          <div className="space-y-2">
            {usedRewards.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between text-xs text-stone-500 opacity-80"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="line-through font-medium text-stone-700">{voucher.title}</span>
                </div>
                <span className="font-mono text-[11px]">Redeemed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Redeem Free Treat
              </span>
              <h3 className="text-lg font-bold text-stone-900">{selectedVoucher.title}</h3>
              <p className="text-xs text-stone-500">
                Show this voucher code to the barista at the counter.
              </p>
            </div>

            {/* Voucher Code Box */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Voucher Code</span>
              <div className="font-mono text-base font-bold text-stone-900 tracking-wider">
                {selectedVoucher.code}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRedeem(selectedVoucher)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Confirm Given to Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
