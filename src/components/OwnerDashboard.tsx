import React, { useState } from 'react';
import {
  Users,
  Coffee,
  Gift,
  Search,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  Smartphone,
  Sparkles,
  Phone,
  RotateCcw,
  ExternalLink,
  Lock,
  Printer,
} from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { CounterQRStand } from './CounterQRStand';

export const OwnerDashboard: React.FC = () => {
  const {
    customersDatabase,
    punchCustomerStampInDatabase,
    createCustomerInDatabase,
    redeemCustomerRewardInDatabase,
    deleteCustomerFromDatabase,
    resetDatabaseToDefaults,
    selectCustomerProfile,
    setActiveTab,
    storeReward,
    showToast,
    logoutStaff,
  } = useLoyalty();

  const [caixaSection, setCaixaSection] = useState<'customers' | 'counter_stand'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [initialStamps, setInitialStamps] = useState(1);

  // Filtered customer list
  const filteredCustomers = customersDatabase.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
      c.memberId.toLowerCase().includes(query)
    );
  });

  // Calculate high-level KPIs
  const totalCustomers = customersDatabase.length;
  const totalStampsGiven = customersDatabase.reduce((acc, c) => acc + (Number(c?.lifetimeStampsEarned) || 0), 0);
  const totalCompletedCards = customersDatabase.reduce((acc, c) => acc + (Number(c?.completedCardsCount) || 0), 0);
  const activeUnclaimedRewards = customersDatabase.reduce(
    (acc, c) => acc + (c?.rewards || []).filter((r) => !r.isRedeemed).length,
    0
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() && !newCustomerPhone.trim()) return;

    createCustomerInDatabase(newCustomerName, newCustomerPhone, initialStamps);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setInitialStamps(1);
    setIsNewCustomerModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nome', 'Telefone', 'Email', 'Carimbos_Atuais', 'Cartoes_Completos', 'Carimbos_Totais', 'Data_Registo'];
    const rows = customersDatabase.map((c) => [
      c.memberId,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      c.currentStamps,
      c.completedCardsCount,
      c.lifetimeStampsEarned,
      `"${c.memberSince}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_fidelizacao_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV Exportado', 'Ficheiro de clientes descarregado com sucesso!', 'info');
  };

  const handleQuickAddFromSearch = () => {
    const isNumber = /^[0-9+\s]+$/.test(searchQuery.trim());
    const name = isNumber ? 'Cliente' : searchQuery.trim();
    const phone = isNumber ? searchQuery.trim() : '';

    createCustomerInDatabase(name, phone, 1);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Quick Actions */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 border border-stone-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-display text-amber-100">
              Painel do Dono & Base de Dados
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Gestão de clientes registados, carimbos no balcão e histórico de ofertas entregues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={logoutStaff}
            className="py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Sair do modo caixa e bloquear ecrã"
          >
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Bloquear Sessão</span>
          </button>

          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 border border-stone-700 transition-colors"
            title="Descarregar folha Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={resetDatabaseToDefaults}
            className="py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs transition-colors border border-stone-700"
            title="Repor dados iniciais de demonstração"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs inside Caixa: Gestão de Clientes vs Cartaz QR do Balcão */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-200/90 rounded-2xl max-w-md shadow-inner">
        <button
          onClick={() => setCaixaSection('customers')}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            caixaSection === 'customers'
              ? 'bg-stone-900 text-amber-300 shadow-xs'
              : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Clientes ({customersDatabase.length})</span>
        </button>

        <button
          onClick={() => setCaixaSection('counter_stand')}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            caixaSection === 'counter_stand'
              ? 'bg-amber-500 text-stone-950 shadow-xs font-extrabold'
              : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          <Printer className="w-4 h-4 text-stone-950" />
          <span>Cartaz QR Balcão</span>
        </button>
      </div>

      {caixaSection === 'counter_stand' ? (
        <div className="animate-in fade-in duration-200">
          <CounterQRStand />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Total de Clientes</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900">{totalCustomers}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Carimbos Emitidos</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900">{totalStampsGiven}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Cartões Completados</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900">{totalCompletedCards}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-900 text-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Vales Ativos a Entregar</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900">{activeUnclaimedRewards}</span>
          </div>
        </div>
      </div>

      {/* Quick Lookup Bar for Counter Staff */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <label htmlFor="dashboard-search-query" className="sr-only">Pesquisar clientes</label>
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="dashboard-search-query"
              name="searchQuery"
              type="text"
              autoComplete="off"
              aria-label="Pesquise cliente por telefone ou nome"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise cliente por telefone (ex: 912) ou nome..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {searchQuery.trim() && filteredCustomers.length === 0 && (
            <button
              onClick={handleQuickAddFromSearch}
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Cliente com &ldquo;{searchQuery}&rdquo;</span>
            </button>
          )}
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-600 font-semibold uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Carimbos (8 máx)</th>
                <th className="py-3 px-4">Ofertas</th>
                <th className="py-3 px-4 text-right">Ação no Balcão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Nenhum cliente encontrado com &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const unredeemed = c.rewards.filter((r) => !r.isRedeemed);

                  return (
                    <tr key={c.id} className="hover:bg-amber-50/50 transition-colors">
                      {/* Customer info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block">{c.name}</span>
                            <span className="font-mono text-[10px] text-stone-400">#{c.memberId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        {c.phone ? (
                          <span className="font-mono text-stone-800 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Sem telemóvel</span>
                        )}
                      </td>

                      {/* Stamp Progress */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-900">
                            <span>{c.currentStamps}/8</span>
                            <span className="text-[10px] text-stone-400 font-normal">
                              ({c.completedCardsCount} cartões cheios)
                            </span>
                          </div>
                          {/* Mini visual dots */}
                          <div className="flex gap-1">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  i < c.currentStamps
                                    ? 'bg-amber-600'
                                    : i === 7
                                    ? 'border border-dashed border-amber-600 bg-amber-50'
                                    : 'bg-stone-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Rewards */}
                      <td className="py-3 px-4">
                        {unredeemed.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <Gift className="w-3 h-3" />
                            <span>{unredeemed.length} Vale Pronto</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Nenhuma</span>
                        )}
                      </td>

                      {/* Counter Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Deliver reward button if customer has one */}
                          {unredeemed.length > 0 && (
                            <button
                              onClick={() => redeemCustomerRewardInDatabase(c.id, unredeemed[0].id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                              title="Entregar oferta grátis ao cliente"
                            >
                              <Gift className="w-3 h-3" />
                              <span>Entregar Oferta</span>
                            </button>
                          )}

                          {/* Give Stamp button */}
                          <button
                            onClick={() => punchCustomerStampInDatabase(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                            title="Atribuir 1 carimbo a este cliente"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+1 Carimbo</span>
                          </button>

                          {/* View Customer Pass */}
                          <button
                            onClick={() => {
                              selectCustomerProfile(c.id);
                              setActiveTab('stamp_card');
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                            title="Ver cartão deste cliente"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Tem a certeza que deseja apagar ${c.name}?`)) {
                                deleteCustomerFromDatabase(c.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remover cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Modal: Registar Novo Cliente */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                <span>Registar Cliente na Base de Dados</span>
              </h3>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="dashboard-new-name" className="text-xs font-bold text-stone-700 block">Nome do Cliente</label>
                <input
                  id="dashboard-new-name"
                  name="customerName"
                  type="text"
                  required
                  autoComplete="name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="dashboard-new-phone" className="text-xs font-bold text-stone-700 block">Número de Telemóvel</label>
                <input
                  id="dashboard-new-phone"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Ex: 912 345 678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-700 block">Carimbos de Boas-Vindas</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setInitialStamps(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-colors ${
                        initialStamps === num
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {num} {num === 1 ? 'Carimbo' : 'Carimbos'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Criar Cliente e Atribuir Carimbo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
