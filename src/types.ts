export interface StampRecord {
  id: string;
  timestamp: number;
  source: 'qr_counter_scan' | 'counter_code' | 'staff_punch';
  note?: string;
}

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

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  memberId: string;
  memberSince: string;
  currentStamps: number; // 0 to 8
  completedCardsCount: number;
  lifetimeStampsEarned: number;
  rewards: RewardVoucher[];
  history: StampRecord[];
  lastScanTimestamp?: number;
}

export interface StoreRewardConfig {
  treatTitle: string;
  treatDescription: string;
}
