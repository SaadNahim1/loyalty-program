import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  RefreshCw,
  Printer,
  Search,
  Plus,
  Gift,
  Trash2,
  Lock,
  SlidersHorizontal,
  UserPlus,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Clock,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';
import { formatPortugueseDate, REWARD_PRESETS } from '../types/loyalty';

type ExpiryPresetMinutes = 5 | 15 | 60 | 1440;

export const StaffDashboardView: React.FC = () => {
  const {
    dailyPass,
    allCustomers,
    regenerateDailyPass,
    updateDailyConfig,
    staffRedeemVoucher,
    staffCreateCustomer,
    staffDeleteCustomer,
    logoutStaff,
    setActiveTab,
  } = useLoyalty();

  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customTreatTitle, setCustomTreatTitle] = useState(dailyPass.treatTitle);
  const [customTreatDesc, setCustomTreatDesc] = useState(dailyPass.treatDescription);
  const [newPin, setNewPin] = useState(dailyPass.staffPin);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState<ExpiryPresetMinutes>(1440);
  const [isHighContrastFullscreen, setIsHighContrastFullscreen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isAutoRotatingRef = React.useRef(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrPayloadUrl = `${originUrl}/?dailyToken=${encodeURIComponent(dailyPass.qrToken)}`;

  // Sync local form state when dailyPass changes externally
  useEffect(() => {
    setCustomTreatTitle(dailyPass.treatTitle);
    setCustomTreatDesc(dailyPass.treatDescription);
    setNewPin(dailyPass.staffPin);
  }, [dailyPass.treatTitle, dailyPass.treatDescription, dailyPass.staffPin]);

  // Live 1-second ticker for temporary QR countdown & auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (expiryMinutes < 1440 && !isAutoRotatingRef.current) {
        const expiresAt = dailyPass.generatedAt + expiryMinutes * 60 * 1000;
        if (current >= expiresAt) {
          isAutoRotatingRef.current = true;
          regenerateDailyPass().finally(() => {
            isAutoRotatingRef.current = false;
          });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyPass.generatedAt, expiryMinutes, regenerateDailyPass]);

  const formatRemainingTime = (): string => {
    if (expiryMinutes === 1440) {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diffSec = Math.max(0, Math.floor((endOfDay.getTime() - nowMs) / 1000));
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }
    const expiresAt = dailyPass.generatedAt + expiryMinutes * 60 * 1000;
    const diffSec = Math.max(0, Math.floor((expiresAt - nowMs) / 1000));
    const mins = String(Math.floor(diffSec / 60)).padStart(2, '0');
    const secs = String(diffSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleGenerateTemporaryQr = async () => {
    setIsRegenerating(true);
    try {
      await regenerateDailyPass();
    } finally {
      setTimeout(() => setIsRegenerating(false), 250);
    }
  };

  const filteredCustomers = allCustomers.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
      c.memberId.toLowerCase().includes(q) ||
      c.rewards.some((r) => !r.isRedeemed && r.code.toLowerCase().includes(q))
    );
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(dailyPass.manualCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrPayloadUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerPhone.trim()) return;
    await staffCreateCustomer(newCustomerName, newCustomerPhone);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDailyConfig({
      treatTitle: customTreatTitle,
      treatDescription: customTreatDesc,
      staffPin: newPin.trim() || '1234',
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Operator Bar */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-amber-400 font-medium block">
            Painel de Controlo do Caixa
          </span>
          <h1 className="font-display font-semibold text-xl text-stone-50">
            Gestão Diária de QR Code, Carimbos e Clientes
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsHighContrastFullscreen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mostrar QR Alto Contraste</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('poster')}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Abrir Modo Expositor / Impressão</span>
          </button>
          <button
            type="button"
            onClick={logoutStaff}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear Caixa</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Temporary High-Contrast Daily QR Generator + Reward Rules */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Temporary High-Contrast Daily QR Generator */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                  <span>Passe Temporário de Alto Contraste</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-emerald-800">
                    Expira em {formatRemainingTime()}
                  </span>
                </div>
                <h2 className="font-display font-semibold text-lg text-stone-900 mt-0.5">
                  Gerador de QR Code do Dia
                </h2>
                <p className="text-xs text-stone-500 capitalize mt-0.5">
                  {formatPortugueseDate(dailyPass.dateStr)} · Emitido às{' '}
                  <span className="font-mono tabular-nums">
                    {new Date(dailyPass.generatedAt).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateTemporaryQr}
                disabled={isRegenerating}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                title="Invalida o código anterior e gera um novo QR temporário imediato"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Novo QR Agora</span>
              </button>
            </div>

            {/* Temporary Validity Duration Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-800" />
                  <span>Rotação Automática do Código Temporário</span>
                </span>
                <span className="font-mono tabular-nums text-stone-500">
                  {expiryMinutes === 1440 ? 'Diário (24h)' : `Cada ${expiryMinutes} min`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl">
                {(
                  [
                    { label: '5 min', value: 5 },
                    { label: '15 min', value: 15 },
                    { label: '1 hora', value: 60 },
                    { label: 'Hoje', value: 1440 },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiryMinutes(opt.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      expiryMinutes === opt.value
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Contrast Scannable QR Frame (#000000 on #FFFFFF) */}
            <div className="p-5 rounded-2xl bg-white border-2 border-stone-950 flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between text-[11px] text-stone-600 border-b border-stone-200 pb-2.5">
                <span className="font-semibold text-stone-950">
                  Contraste Máximo (Nível H)
                </span>
                <span className="font-mono tabular-nums">
                  {dailyPass.qrToken.slice(-8)}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-900">
                <QRCodeSVG
                  value={qrPayloadUrl}
                  size={210}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <p className="text-xs text-stone-600 text-center max-w-xs leading-relaxed">
                Vire o ecrã para o cliente ou amplie em modo de balcão para leitura imediata pela câmara.
              </p>

              {/* Action Row: Expand High-Contrast Display */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setIsHighContrastFullscreen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Abrir Mostrador de Balcão (Ecrã Inteiro)</span>
                </button>
              </div>

              {/* Manual Daily Fallback Code & Direct Link Copy */}
              <div className="w-full pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-stone-500 block">
                    Código Manual Temporário
                  </span>
                  <span className="font-mono font-bold text-base text-stone-950 tracking-wider tabular-nums">
                    {dailyPass.manualCode}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Código Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors whitespace-nowrap"
                    title="Copiar link direto de leitura"
                  >
                    {copiedUrl ? 'Link Copiado' : 'Link QR'}
                  </button>
                </div>
              </div>
            </div>

            {/* Anti-Fraud Rule Toggle: 1 Stamp/Day vs Multiple/Day */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-stone-800 block">
                  Limite de 1 leitura QR por dia por cliente
                </span>
                <span className="text-[11px] text-stone-500">
                  {dailyPass.allowMultiplePerDay
                    ? 'Modo Teste Ativo: Permite ler o QR várias vezes no mesmo dia.'
                    : 'Modo Seguro Ativo: Cada cliente só pode ler o QR 1 vez por dia.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateDailyConfig({ allowMultiplePerDay: !dailyPass.allowMultiplePerDay })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  !dailyPass.allowMultiplePerDay
                    ? 'bg-emerald-800 text-white'
                    : 'bg-amber-100 text-amber-950 border border-amber-300'
                }`}
              >
                {!dailyPass.allowMultiplePerDay ? '1x / Dia (Seguro)' : 'Ilimitado (Teste)'}
              </button>
            </div>
          </div>

          {/* Card 2: Configure 8th Stamp Treat & Staff PIN */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-800" />
              <h3 className="font-display font-semibold text-base text-stone-900">
                Configurar Oferta do 8.º Carimbo e PIN
              </h3>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-stone-500 block">
                Sugestões Rápidas de Oferta
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {REWARD_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCustomTreatTitle(preset.treatTitle);
                      setCustomTreatDesc(preset.treatDescription);
                      updateDailyConfig({
                        treatTitle: preset.treatTitle,
                        treatDescription: preset.treatDescription,
                      });
                    }}
                    className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                      dailyPass.treatTitle === preset.treatTitle
                        ? 'bg-amber-50/90 border-amber-700 text-stone-900 font-semibold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-stone-100">
              <div>
                <label htmlFor="staff-custom-treat-title" className="text-xs font-semibold text-stone-700 block mb-1">
                  Título Personalizado da Oferta
                </label>
                <input
                  id="staff-custom-treat-title"
                  name="treatTitle"
                  type="text"
                  value={customTreatTitle}
                  onChange={(e) => setCustomTreatTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label htmlFor="staff-custom-treat-desc" className="text-xs font-semibold text-stone-700 block mb-1">
                  Condições da Oferta
                </label>
                <input
                  id="staff-custom-treat-desc"
                  name="treatDescription"
                  type="text"
                  value={customTreatDesc}
                  onChange={(e) => setCustomTreatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label htmlFor="staff-custom-pin" className="text-xs font-semibold text-stone-700 block mb-1">
                  PIN de Acesso do Caixa
                </label>
                <input
                  id="staff-custom-pin"
                  name="staffPin"
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
              >
                Guardar Alterações
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Customer Search & Voucher Redemption */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Register New Customer at Counter */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-800" />
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Criar Ficha de Cliente (Sem Carimbos Automáticos)
                </h3>
              </div>
              <span className="text-[11px] text-stone-500">
                Carimbos exigem leitura do QR do Dia
              </span>
            </div>

            <form onSubmit={handleQuickCreateCustomer} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label htmlFor="staff-new-cust-name" className="sr-only">Nome do cliente</label>
                <input
                  id="staff-new-cust-name"
                  name="customerName"
                  type="text"
                  placeholder="Nome do cliente"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-700"
                />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="staff-new-cust-phone" className="sr-only">Telemóvel</label>
                <input
                  id="staff-new-cust-phone"
                  name="customerPhone"
                  type="tel"
                  required
                  placeholder="Telemóvel (9 dígitos)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-700"
                />
              </div>
              <button
                type="submit"
                className="sm:col-span-3 py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Cartão</span>
              </button>
            </form>
          </div>

          {/* Customer Database & Voucher Validation */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Clientes Registados ({allCustomers.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Pesquise por telemóvel, nome ou código de vale (ex: VALE-1234).
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <label htmlFor="staff-search-input" className="sr-only">Procurar cliente</label>
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="staff-search-input"
                  name="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Procurar telemóvel ou vale..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-700"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-500">
                Nenhum cliente encontrado na base de dados.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {filteredCustomers.map((c) => {
                  const unredeemed = (c.rewards || []).filter((r) => !r.isRedeemed);
                  return (
                    <div key={c.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                            <span className="font-semibold text-stone-900 text-sm">{c.name}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-stone-700">{c.phone}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">#{c.memberId}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1 tabular-nums">
                            <span className="font-semibold text-amber-900">
                              Cartão atual: {c.currentStamps} / 8 carimbos
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{c.completedCardsCount} cartões completos</span>
                            <span aria-hidden="true">·</span>
                            <span>{c.lifetimeStampsEarned} carimbos totais</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-amber-800" />
                            <span>Carimbo via QR / Código do Dia</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => staffDeleteCustomer(c.id)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-700 transition-colors"
                            title="Apagar cliente"
                            aria-label="Apagar cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Active Vouchers for this customer that Cashier can redeem */}
                      {unredeemed.length > 0 && (
                        <div className="pl-3 border-l-2 border-amber-600 space-y-2">
                          {unredeemed.map((v) => (
                            <div
                              key={v.id}
                              className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-amber-800 shrink-0" />
                                <div>
                                  <span className="font-semibold text-stone-900">{v.title}</span>
                                  <span className="font-mono text-amber-900 ml-2 font-semibold">
                                    [{v.code}]
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => staffRedeemVoucher(c.id, v.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                              >
                                Validar e Entregar Oferta
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High-Contrast Fullscreen Counter Display Modal for Customer Scanning */}
      {isHighContrastFullscreen && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white text-stone-950 rounded-3xl border-4 border-stone-950 shadow-2xl overflow-hidden">
            {/* Top Bar */}
            <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-amber-400 font-semibold block">
                  Mostrador de Balcão Alto Contraste
                </span>
                <h3 className="font-display font-semibold text-lg text-white">
                  Leia o QR Code para +1 Carimbo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHighContrastFullscreen(false)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Fechar Ecrã</span>
              </button>
            </div>

            {/* Ultra-High-Contrast QR Body */}
            <div className="p-8 flex flex-col items-center text-center space-y-6 bg-white">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-stone-600">
                <span className="capitalize font-semibold text-stone-900">
                  {formatPortugueseDate(dailyPass.dateStr)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-emerald-800 font-semibold">
                  Válido por {formatRemainingTime()}
                </span>
              </div>

              <div className="p-5 bg-white rounded-2xl border-4 border-black">
                <QRCodeSVG
                  value={qrPayloadUrl}
                  size={280}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>

              <div className="w-full max-w-xs space-y-1">
                <span className="text-xs font-medium text-stone-500 block">
                  Código do Dia (associado a este QR Code):
                </span>
                <div className="py-3 px-4 rounded-xl bg-stone-950 text-white font-mono font-bold text-2xl tracking-widest tabular-nums">
                  {dailyPass.manualCode}
                </div>
              </div>

              <div className="w-full pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Emitido às{' '}
                    <strong className="font-mono tabular-nums text-stone-900">
                      {new Date(dailyPass.generatedAt).toLocaleTimeString('pt-PT', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleGenerateTemporaryQr}
                    disabled={isRegenerating}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Rodar Código Agora</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
