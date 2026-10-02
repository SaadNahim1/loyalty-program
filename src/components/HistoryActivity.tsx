import React from 'react';
import { Coffee, Croissant, Sparkles, RotateCcw, Trash2 } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const HistoryActivity: React.FC = () => {
  const { customer, resetActiveCard, selectCustomerProfile, allProfiles } = useLoyalty();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-stone-500 font-medium block">Lifetime Stamps</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-stone-900 tabular-nums">
            {customer.lifetimeStampsEarned}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-stone-500 font-medium block">Cards Completed (8/8)</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-800 tabular-nums">
            {customer.completedCardsCount}
          </span>
        </div>
      </div>

      {/* Activity Ledger */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              {customer.name}&apos;s Stamp Ledger
            </h3>
            <p className="text-xs text-stone-500">
              Device Card #{customer.memberId}
            </p>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {customer.history.length} transactions
          </span>
        </div>

        {customer.history.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No stamp transactions recorded yet for this customer profile.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {customer.history.map((record) => (
              <div key={record.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">
                      {record.note || 'Counter Visit Stamp'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{formatDate(record.timestamp)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{record.source.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-amber-800 tabular-nums">
                    +1 stamp
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Switcher / Demo verification */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
        <span className="text-xs uppercase font-bold tracking-wider text-stone-500 block">
          Simulate Different Customers & Devices
        </span>
        <p className="text-xs text-stone-600">
          In real life, each customer has their own phone with their own stamp card. Switch below to see how different customers maintain completely separate cards:
        </p>
        <div className="flex flex-wrap gap-2">
          {allProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => selectCustomerProfile(p.id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                customer.id === p.id
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {p.name} ({p.currentStamps}/8 stamps)
            </button>
          ))}
          <button
            onClick={resetActiveCard}
            className="py-1.5 px-3 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset {customer.name}&apos;s Card to 0</span>
          </button>
        </div>
      </div>
    </div>
  );
};
