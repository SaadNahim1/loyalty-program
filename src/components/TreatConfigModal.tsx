import React, { useState } from 'react';
import { X, Gift, Check, Sliders } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { REWARD_PRESETS } from '../data/mockData';

export const TreatConfigModal: React.FC = () => {
  const { isConfigRewardOpen, setIsConfigRewardOpen, storeReward, updateStoreReward } = useLoyalty();
  const [customTitle, setCustomTitle] = useState(storeReward.treatTitle);
  const [customDesc, setCustomDesc] = useState(storeReward.treatDescription);

  if (!isConfigRewardOpen) return null;

  const handleSelectPreset = (title: string, desc: string) => {
    setCustomTitle(title);
    setCustomDesc(desc);
    updateStoreReward({ treatTitle: title, treatDescription: desc });
    setIsConfigRewardOpen(false);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    updateStoreReward({
      treatTitle: customTitle.trim(),
      treatDescription: customDesc.trim() || 'Complimentary loyalty treat on us!',
    });
    setIsConfigRewardOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100">Set the 8th Treat Reward</h3>
              <p className="text-xs text-stone-400">Choose what customers get when they finish 8 stamps</p>
            </div>
          </div>
          <button
            onClick={() => setIsConfigRewardOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider text-stone-500 block">
              Quick Presets
            </span>
            <div className="grid grid-cols-1 gap-2">
              {REWARD_PRESETS.map((preset, idx) => {
                const isSelected = storeReward.treatTitle === preset.config.treatTitle;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.config.treatTitle, preset.config.treatDescription)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 text-amber-950'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">{preset.label}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{preset.config.treatDescription}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Treat Form */}
          <form onSubmit={handleSaveCustom} className="pt-4 border-t border-stone-100 space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-stone-500 block">
              Or Customize Treat Title
            </span>
            <div className="space-y-2">
              <div>
                <label htmlFor="treat-config-title" className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Treat Name (e.g. Free 16oz Latte or Any Bakery Item)
                </label>
                <input
                  id="treat-config-title"
                  name="treatTitle"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Free Iced Cold Brew or Warm Pastry"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="treat-config-desc" className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Conditions / Details (optional)
                </label>
                <input
                  id="treat-config-desc"
                  name="treatDescription"
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="e.g. Valid at bakery counter for 30 days"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Save Treat Setting
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
