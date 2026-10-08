export interface RewardVoucher {
  id: string;
  title: string;
  description: string;
  code: string;
  issuedAt: number;
  expiresAt: number;
  isRedeemed: boolean;
  redeemedAt?: number;
}

export interface StampHistoryEntry {
  id: string;
  timestamp: number;
  source: 'qr_counter_scan' | 'counter_code';
  note: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  memberId: string;
  memberSince: string;
  currentStamps: number;
  completedCardsCount: number;
  lifetimeStampsEarned: number;
  lastStampedDate?: string;
  lastScanTimestamp?: number;
  rewards: RewardVoucher[];
  history: StampHistoryEntry[];
}

export interface DailyPassConfig {
  dateStr: string;
  qrToken: string;
  manualCode: string;
  treatTitle: string;
  treatDescription: string;
  allowMultiplePerDay: boolean;
  staffPin: string;
  generatedAt: number;
}

export const REWARD_PRESETS = [
  {
    label: 'Café Grátis de Qualquer Tamanho',
    treatTitle: 'Café Grátis de Qualquer Tamanho',
    treatDescription: 'Válido para expresso, abatanado, galão, cappuccino ou latte.',
  },
  {
    label: 'Pastelaria Fresca à Escolha',
    treatTitle: 'Pastelaria Fresca à Escolha',
    treatDescription: 'Válido para pastel de nata, croissant artesanal, muffin ou bolo do dia.',
  },
  {
    label: 'Menu Pequeno-Almoço (Café + Pastelaria)',
    treatTitle: 'Par Café + Pastelaria Fresca',
    treatDescription: 'Oferta de 1 bebida de cafetaria quente ou fria mais 1 peça de pastelaria.',
  },
  {
    label: 'Cookie Artesanal ou Brownie Quente',
    treatTitle: 'Cookie Gigante ou Brownie Fresco',
    treatDescription: 'Válido para cookie com pepitas de chocolate ou brownie artesanal.',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatPortugueseDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function generateDailyCredentials(dateStr: string): { qrToken: string; manualCode: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const dayMonth = dateStr.slice(8, 10) + dateStr.slice(5, 7);
  const manualCode = `PIT-${dayMonth}-${suffix}`;
  const qrToken = `PITSTOP_DAILY_${dateStr}_${suffix}`;
  return { qrToken, manualCode };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
