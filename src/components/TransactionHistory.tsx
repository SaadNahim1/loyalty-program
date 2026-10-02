import React, { useState, useEffect } from 'react';
import { 
  History, 
  Coffee, 
  Gift, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Cloud, 
  Filter, 
  Calendar,
  Sparkles,
  QrCode
} from 'lucide-react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLoyalty } from '../context/LoyaltyContext';
import { CustomerProfile, StampRecord, RewardVoucher } from '../types';

export interface UnifiedTransaction {
  id: string;
  type: 'stamp' | 'reward_redeemed' | 'reward_issued';
  title: string;
  subtitle: string;
  timestamp: number;
  badgeText: string;
  badgeColor: string;
  code?: string;
  source?: string;
}

export const TransactionHistory: React.FC = () => {
  const { customer } = useLoyalty();
  const [firestoreCustomer, setFirestoreCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'stamps' | 'rewards'>('all');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Real-time Firestore document listener for the active customer
  useEffect(() => {
    if (!customer?.id) return;

    setIsLoading(true);
    const docRef = doc(db, 'customers', customer.id);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setIsLoading(false);
        setIsRefreshing(false);
        if (snapshot.exists()) {
          const data = snapshot.data() as CustomerProfile;
          setFirestoreCustomer(data);
          setLastSyncedTime(new Date());
          setIsCloudConnected(true);
        } else {
          // If document doesn't exist yet in Firestore, fall back to current context customer
          setFirestoreCustomer(customer);
          setIsCloudConnected(true);
        }
      },
      (error) => {
        console.warn('[TransactionHistory] Firestore listener note:', error);
        setIsLoading(false);
        setIsRefreshing(false);
        setIsCloudConnected(false);
        // Fallback to local context customer
        setFirestoreCustomer(customer);
      }
    );

    return () => unsubscribe();
  }, [customer?.id]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (!customer?.id) return;
    setIsRefreshing(true);
    try {
      const docRef = doc(db, 'customers', customer.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setFirestoreCustomer(snapshot.data() as CustomerProfile);
        setLastSyncedTime(new Date());
        setIsCloudConnected(true);
      } else {
        setFirestoreCustomer(customer);
      }
    } catch (err) {
      console.warn('[TransactionHistory] Manual refresh fallback:', err);
      setIsCloudConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentData = firestoreCustomer || customer;

  // Build unified transactions list
  const transactions: UnifiedTransaction[] = [];

  // 1. Stamp Collections
  (currentData.history || []).forEach((record: StampRecord) => {
    const isQR = record.source === 'qr_counter_scan';
    const isStaff = record.source === 'staff_punch';

    transactions.push({
      id: record.id,
      type: 'stamp',
      title: record.note || (isQR ? 'Carimbo no Balcão (QR Code)' : 'Carimbo Registado'),
      subtitle: isQR
        ? 'Leitura de QR Code no balcão'
        : isStaff
        ? 'Registo manual no Terminal do Caixa'
        : 'Código de balcão introduzido',
      timestamp: record.timestamp,
      badgeText: '+1 Carimbo',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      source: record.source,
    });
  });

  // 2. Rewards Redeemed & Issued
  (currentData.rewards || []).forEach((reward: RewardVoucher) => {
    // If voucher has been redeemed
    if (reward.isRedeemed && reward.redeemedAt) {
      transactions.push({
        id: `redeem-${reward.id}`,
        type: 'reward_redeemed',
        title: `Oferta Descontada: ${reward.title}`,
        subtitle: `Vale #${reward.code} utilizado e entregue no balcão`,
        timestamp: reward.redeemedAt,
        badgeText: 'Oferta Entregue',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        code: reward.code,
      });
    }

    // When the reward was initially unlocked / issued
    if (reward.issuedAt) {
      transactions.push({
        id: `issue-${reward.id}`,
        type: 'reward_issued',
        title: `Oferta Desbloqueada: ${reward.title}`,
        subtitle: `Completou 8 carimbos · Código gerado: ${reward.code}`,
        timestamp: reward.issuedAt,
        badgeText: '🎉 8/8 Carimbos',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
        code: reward.code,
      });
    }
  });

  // Sort chronologically (most recent first)
  transactions.sort((a, b) => b.timestamp - a.timestamp);

  // Apply filter
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'stamps') return t.type === 'stamp';
    if (filterType === 'rewards') return t.type === 'reward_redeemed' || t.type === 'reward_issued';
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const redeemedCount = (currentData.rewards || []).filter((r) => r.isRedeemed).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cloud Sync Status & Header Card */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 border border-stone-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">Histórico de Transações</h3>
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-emerald-400 border border-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firestore Cloud</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Carimbos e ofertas de {currentData.name} gravados na base de dados
              </p>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors border border-stone-700 disabled:opacity-50"
            title="Atualizar dados do Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'A sincronizar...' : 'Atualizar'}</span>
          </button>
        </div>

        {/* Sync Metadata Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Coleção: <code className="font-mono text-stone-300">/customers/{currentData.id}</code></span>
          </span>
          <span className="font-mono text-stone-400">
            Última sync: {lastSyncedTime.toLocaleTimeString('pt-PT')}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs text-center space-y-1">
          <span className="text-[11px] text-stone-500 font-medium block">Total Carimbos</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900 tabular-nums">
            {currentData.lifetimeStampsEarned}
          </span>
          <span className="text-[10px] text-amber-700 block font-medium">acumulados</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs text-center space-y-1">
          <span className="text-[11px] text-stone-500 font-medium block">Cartões Concluídos</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {currentData.completedCardsCount}
          </span>
          <span className="text-[10px] text-stone-400 block font-medium">ciclos de 8</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs text-center space-y-1">
          <span className="text-[11px] text-stone-500 font-medium block">Ofertas Entregues</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {redeemedCount}
          </span>
          <span className="text-[10px] text-emerald-600 block font-medium">descontadas</span>
        </div>
      </div>

      {/* Transactions Feed & Filter */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Registo de Movimentos</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Lista cronológica com datas e comprovativos de carimbos e vales
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('stamps')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterType === 'stamps'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Carimbos
            </button>
            <button
              onClick={() => setFilterType('rewards')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterType === 'rewards'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ofertas
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-xs">A carregar histórico do Firestore...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">Sem registos nesta categoria</p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              {filterType === 'rewards'
                ? 'Ainda não existem ofertas resgatadas para este cliente.'
                : 'Quando fizer o primeiro scan do QR Code no balcão, a data aparecerá aqui automaticamente.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 p-2.5 rounded-2xl transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  {/* Icon depending on type */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      tx.type === 'stamp'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : tx.type === 'reward_redeemed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {tx.type === 'stamp' ? (
                      <Coffee className="w-5 h-5" />
                    ) : tx.type === 'reward_redeemed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Gift className="w-5 h-5" />
                    )}
                  </div>

                  {/* Title and details */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-sm font-bold text-stone-900">{tx.title}</h5>
                      {tx.code && (
                        <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200 font-bold">
                          {tx.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">{tx.subtitle}</p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 pt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{formatDate(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Badge */}
                <div className="sm:text-right shrink-0 pl-13 sm:pl-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border font-mono ${tx.badgeColor}`}
                  >
                    {tx.badgeText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
