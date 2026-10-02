import { CustomerProfile, StoreRewardConfig } from '../types';

export const DEFAULT_STORE_REWARD: StoreRewardConfig = {
  treatTitle: 'Café Grátis de Qualquer Tamanho',
  treatDescription: 'Válido para expresso, abatanado, galão, cappuccino ou latte.',
};

export const REWARD_PRESETS: { label: string; config: StoreRewardConfig }[] = [
  {
    label: '☕ Café Grátis de Qualquer Tamanho',
    config: {
      treatTitle: 'Café Grátis de Qualquer Tamanho',
      treatDescription: 'Válido para expresso, cappuccino, galão ou café de filtro.',
    },
  },
  {
    label: '🥐 Pastelaria Fresca à Escolha',
    config: {
      treatTitle: 'Pastelaria Fresca à Escolha',
      treatDescription: 'Válido para pastel de nata, croissant, muffin ou bolo do dia.',
    },
  },
  {
    label: '☕🥐 Par Café + Pastelaria',
    config: {
      treatTitle: 'Par Café + Pastelaria Fresca',
      treatDescription: 'Oferta de 1 café quente/frio mais 1 produto de pastelaria fresca.',
    },
  },
  {
    label: '🍪 Cookie Gigante / Brownie',
    config: {
      treatTitle: 'Cookie Gigante ou Brownie Fresco',
      treatDescription: 'Válido para cookie artesanal ou brownie de chocolate.',
    },
  },
];

export const INITIAL_CUSTOMERS_DATABASE: CustomerProfile[] = [
  {
    id: 'cust-9421',
    name: 'Carlos Silva',
    phone: '912 345 678',
    email: 'carlos.silva@email.pt',
    memberId: 'COFFEE-88392',
    memberSince: 'Março 2026',
    currentStamps: 5, // 5 of 8 stamps
    completedCardsCount: 2,
    lifetimeStampsEarned: 21,
    rewards: [
      {
        id: 'rew-101',
        title: 'Café Grátis de Qualquer Tamanho',
        description: 'Oferta ganha por completar 8 carimbos! Apresente ao funcionário.',
        code: 'VALE-CAFE-882',
        issuedAt: Date.now() - 86400000 * 2,
        expiresAt: Date.now() + 86400000 * 28,
        isRedeemed: false,
      },
    ],
    history: [
      {
        id: 'hist-1',
        timestamp: Date.now() - 86400000 * 1,
        source: 'qr_counter_scan',
        note: 'Leitura QR Balcão (+1 Carimbo)',
      },
      {
        id: 'hist-2',
        timestamp: Date.now() - 86400000 * 2,
        source: 'qr_counter_scan',
        note: 'Leitura QR Balcão (+1 Carimbo)',
      },
    ],
  },
  {
    id: 'cust-2022',
    name: 'Marta Ribeiro',
    phone: '961 884 211',
    email: 'marta.r@email.pt',
    memberId: 'COFFEE-14920',
    memberSince: 'Fevereiro 2026',
    currentStamps: 7, // 7 of 8 stamps - 1 away from reward!
    completedCardsCount: 1,
    lifetimeStampsEarned: 15,
    rewards: [],
    history: [
      {
        id: 'hist-d1',
        timestamp: Date.now() - 86400000 * 1,
        source: 'qr_counter_scan',
        note: 'Leitura QR Balcão (+1 Carimbo)',
      },
    ],
  },
  {
    id: 'cust-3033',
    name: 'João Pedro Santos',
    phone: '933 120 445',
    email: 'joao.santos@email.pt',
    memberId: 'COFFEE-50119',
    memberSince: 'Janeiro 2026',
    currentStamps: 8, // Complete card!
    completedCardsCount: 3,
    lifetimeStampsEarned: 24,
    rewards: [
      {
        id: 'rew-102',
        title: 'Café Grátis de Qualquer Tamanho',
        description: 'Oferta ativa para resgate imediato!',
        code: 'VALE-CAFE-901',
        issuedAt: Date.now() - 3600000 * 5,
        expiresAt: Date.now() + 86400000 * 30,
        isRedeemed: false,
      },
    ],
    history: [],
  },
  {
    id: 'cust-4044',
    name: 'Ana Sofia Marques',
    phone: '919 775 301',
    email: 'ana.marques@email.pt',
    memberId: 'COFFEE-32009',
    memberSince: 'Hoje',
    currentStamps: 2,
    completedCardsCount: 0,
    lifetimeStampsEarned: 2,
    rewards: [],
    history: [],
  },
];

export const INITIAL_CUSTOMER = INITIAL_CUSTOMERS_DATABASE[0];
