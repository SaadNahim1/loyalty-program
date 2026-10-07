import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CustomerProfile, RewardVoucher, StampRecord, StoreRewardConfig } from '../types';
import { INITIAL_CUSTOMERS_DATABASE, DEFAULT_STORE_REWARD } from '../data/mockData';
import { soundFX } from '../utils/audio';

interface ToastState {
  title: string;
  message: string;
  type: 'success' | 'info' | 'reward';
}

export interface ScannedStampModalState {
  isOpen: boolean;
  newStampsCount: number;
  totalCards: number;
  isRewardUnlocked: boolean;
  rewardTitle: string;
}

export type ActiveTabType = 'stamp_card' | 'rewards' | 'counter_stand' | 'history' | 'owner_dashboard';

interface LoyaltyContextType {
  customer: CustomerProfile;
  hasActiveSession: boolean;
  isRegistrationOverlayOpen: boolean;
  setIsRegistrationOverlayOpen: (open: boolean) => void;
  pendingFirstScan: boolean;
  registerCustomerSession: (name: string, phone: string) => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  selectCustomerProfile: (profileId: string) => void;
  customersDatabase: CustomerProfile[];
  allProfiles: CustomerProfile[];
  createCustomerInDatabase: (name: string, phone: string, initialStamps?: number) => CustomerProfile;
  punchCustomerStampInDatabase: (customerId: string) => void;
  redeemCustomerRewardInDatabase: (customerId: string, rewardId: string) => void;
  deleteCustomerFromDatabase: (customerId: string) => void;
  resetDatabaseToDefaults: () => void;
  storeReward: StoreRewardConfig;
  updateStoreReward: (config: StoreRewardConfig) => void;
  addSingleStamp: (
    source?: 'qr_counter_scan' | 'counter_code' | 'staff_punch',
    note?: string
  ) => void;
  redeemReward: (rewardId: string) => void;
  resetActiveCard: () => void;
  toast: ToastState | null;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'reward') => void;
  dismissToast: () => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isConfigRewardOpen: boolean;
  setIsConfigRewardOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  updateCustomerProfile: (name: string, phone: string) => void;
  isStaffAuthenticated: boolean;
  loginStaffWithPin: (pin: string) => boolean;
  logoutStaff: () => void;
  isStaffLoginModalOpen: boolean;
  setIsStaffLoginModalOpen: (open: boolean) => void;
  scannedStampModal: ScannedStampModalState;
  setScannedStampModal: React.Dispatch<React.SetStateAction<ScannedStampModalState>>;
}

const STORAGE_KEY = 'coffeebakery_loyalty_customer';
const DATABASE_STORAGE_KEY = 'coffeebakery_customers_db';
const REWARD_CONFIG_KEY = 'coffeebakery_reward_config';
const STAFF_AUTH_KEY = 'coffeebakery_staff_session';
const DEFAULT_STAFF_PIN = '1234';

const createFreshGuestProfile = (): CustomerProfile => {
  const memberNumber = Math.floor(10000 + Math.random() * 90000);
  return {
    id: `cust-${Date.now()}`,
    name: 'Novo Cliente',
    phone: '',
    email: '',
    memberId: `PIT-${memberNumber}`,
    memberSince: 'Hoje',
    currentStamps: 0,
    completedCardsCount: 0,
    lifetimeStampsEarned: 0,
    rewards: [],
    history: [],
  };
};

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Master customers database
  const [customersDatabase, setCustomersDatabase] = useState<CustomerProfile[]>(() => {
    try {
      const saved = localStorage.getItem(DATABASE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_CUSTOMERS_DATABASE;
  });

  // Current active customer profile (Fresh personal card for real clients)
  const [customer, setCustomer] = useState<CustomerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it was the demo account 'cust-1' (Ana Silva) or mock accounts, reset to a fresh real profile
        if (parsed && !['cust-1', 'cust-2', 'cust-3'].includes(parsed.id)) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return createFreshGuestProfile();
  });

  const [storeReward, setStoreReward] = useState<StoreRewardConfig>(() => {
    try {
      const saved = localStorage.getItem(REWARD_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return DEFAULT_STORE_REWARD;
  });

  const [activeTab, setActiveTab] = useState<ActiveTabType>('stamp_card');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isConfigRewardOpen, setIsConfigRewardOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRegistrationOverlayOpen, setIsRegistrationOverlayOpen] = useState(false);
  const [pendingFirstScan, setPendingFirstScan] = useState(false);
  const [pendingActionAfterRegistration, setPendingActionAfterRegistration] = useState<'open_scanner' | null>(null);

  // Determine if visitor has an active registered customer session
  const hasActiveSession = Boolean(
    customer &&
    customer.isRegistered === true &&
    customer.phone &&
    customer.phone.replace(/\D/g, '').length >= 9 &&
    customer.name &&
    customer.name !== 'Novo Cliente' &&
    customer.name !== 'Cliente Pitstop' &&
    customer.name !== 'Cliente VIP'
  );

  // Automatically trigger 'New Customer Registration' overlay if visitor has no active session
  useEffect(() => {
    if (!hasActiveSession) {
      setIsRegistrationOverlayOpen(true);
    }
  }, [hasActiveSession]);

  const handleSetIsScannerOpen = (open: boolean) => {
    if (open && !hasActiveSession) {
      setPendingActionAfterRegistration('open_scanner');
      setIsRegistrationOverlayOpen(true);
      showToast('Registo Prévio Obrigatório', 'Registe o seu nome e telemóvel para abrir o leitor e ganhar carimbos!', 'info');
      return;
    }
    setIsScannerOpen(open);
  };

  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STAFF_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState(false);
  const [scannedStampModal, setScannedStampModal] = useState<ScannedStampModalState>({
    isOpen: false,
    newStampsCount: 0,
    totalCards: 0,
    isRewardUnlocked: false,
    rewardTitle: '',
  });

  // Track if QR scan was processed on page load
  const hasProcessedScanRef = useRef(false);

  // Sync active customer to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
    } catch {
      // Ignore
    }
  }, [customer]);

  // Sync database to local storage
  useEffect(() => {
    try {
      localStorage.setItem(DATABASE_STORAGE_KEY, JSON.stringify(customersDatabase));
    } catch {
      // Ignore
    }
  }, [customersDatabase]);

  // Real-time Firestore synchronization
  useEffect(() => {
    if (!db) return;
    let unsubscribe: (() => void) | undefined;
    try {
      const customersRef = collection(db, 'customers');
      unsubscribe = onSnapshot(
        customersRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CustomerProfile[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as CustomerProfile);
            });
            setCustomersDatabase(list);
          } else {
            // If Firestore is empty, seed with initial demo customers
            INITIAL_CUSTOMERS_DATABASE.forEach((c) => {
              if (db) setDoc(doc(db, 'customers', c.id), c).catch(() => {});
            });
          }
        },
        (error) => {
          console.warn('[Firestore] sync note:', error.message);
        }
      );
    } catch (e) {
      console.warn('[Firestore] init note:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync reward config to local storage
  useEffect(() => {
    try {
      localStorage.setItem(REWARD_CONFIG_KEY, JSON.stringify(storeReward));
    } catch {
      // Ignore
    }
  }, [storeReward]);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'reward' = 'success') => {
    setToast({ title, message, type });
  };

  const dismissToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const selectCustomerProfile = (profileId: string) => {
    const found = customersDatabase.find((p) => p.id === profileId);
    if (found) {
      setCustomer(found);
      showToast(
        'Cliente Selecionado',
        `A visualizar o cartão de ${found.name} (${found.currentStamps}/8 carimbos).`,
        'info'
      );
    }
  };

  const updateStoreReward = (config: StoreRewardConfig) => {
    setStoreReward(config);
    showToast('Oferta Atualizada', `O 8º mimo é agora: ${config.treatTitle}`, 'success');
  };

  const registerCustomerSession = (name: string, phone: string) => {
    const formattedName = name.trim() || 'Cliente VIP';
    const formattedPhone = phone.trim();
    const cleanDigits = formattedPhone.replace(/\D/g, '');

    // Check if phone matches an existing account in database
    if (cleanDigits) {
      const existing = customersDatabase.find((c) => {
        if (!c.phone) return false;
        return c.phone.replace(/\D/g, '') === cleanDigits;
      });

      if (existing) {
        // Recover existing account and merge any pending stamp
        const updated: CustomerProfile = {
          ...existing,
          name: formattedName || existing.name,
          currentStamps: Math.min(8, existing.currentStamps + (pendingFirstScan ? 1 : 0)),
          lifetimeStampsEarned: existing.lifetimeStampsEarned + (pendingFirstScan ? 1 : 0),
          lastScanTimestamp: Date.now(),
          isRegistered: true,
        };
        setCustomer(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        setCustomersDatabase((dbList) => dbList.map((c) => (c.id === existing.id ? updated : c)));
        if (db) setDoc(doc(db, 'customers', updated.id), updated).catch(() => {});
        setIsRegistrationOverlayOpen(false);
        showToast(
          'Bem-vindo de Volta!',
          `Conta recuperada de ${existing.name}. Saldo: ${updated.currentStamps}/8 carimbos.`,
          'success'
        );

        if (pendingFirstScan) {
          setPendingFirstScan(false);
        } else if (pendingActionAfterRegistration === 'open_scanner') {
          setPendingActionAfterRegistration(null);
          setTimeout(() => setIsScannerOpen(true), 350);
        }
        return;
      }
    }

    const memberNumber = Math.floor(10000 + Math.random() * 90000);
    const newProfile: CustomerProfile = {
      id: `cust-${Date.now()}`,
      name: formattedName,
      phone: formattedPhone,
      email: '',
      memberId: `PIT-${memberNumber}`,
      memberSince: 'Hoje',
      currentStamps: pendingFirstScan ? 1 : 0,
      completedCardsCount: 0,
      lifetimeStampsEarned: pendingFirstScan ? 1 : 0,
      rewards: [],
      history: pendingFirstScan
        ? [
            {
              id: `stamp-${Date.now()}`,
              timestamp: Date.now(),
              source: 'qr_counter_scan',
              note: '1º Carimbo Registado (Ativação)',
            },
          ]
        : [],
      isRegistered: true,
    };

    setCustomer(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch {
      // Ignore
    }

    setCustomersDatabase((dbList) => [newProfile, ...dbList]);
    if (db) setDoc(doc(db, 'customers', newProfile.id), newProfile).catch(() => {});

    setIsRegistrationOverlayOpen(false);

    if (pendingFirstScan) {
      setPendingFirstScan(false);
      showToast(
        '🎉 1º Carimbo Creditado!',
        `Bem-vindo(a), ${formattedName}! O seu cartão está pronto com 1 carimbo.`,
        'success'
      );
      setScannedStampModal({
        isOpen: true,
        newStampsCount: 1,
        totalCards: 0,
        isRewardUnlocked: false,
        rewardTitle: storeReward.treatTitle,
      });
    } else {
      showToast(
        'Cartão Ativado!',
        `Bem-vindo(a), ${formattedName}! O seu cartão está pronto a carimbar.`,
        'success'
      );
      if (pendingActionAfterRegistration === 'open_scanner') {
        setPendingActionAfterRegistration(null);
        setTimeout(() => setIsScannerOpen(true), 350);
      }
    }
  };

  const updateCustomerProfile = (name: string, phone: string) => {
    registerCustomerSession(name, phone);
  };

  const loginStaffWithPin = (pin: string): boolean => {
    if (pin.trim() === DEFAULT_STAFF_PIN) {
      setIsStaffAuthenticated(true);
      try {
        sessionStorage.setItem(STAFF_AUTH_KEY, 'true');
      } catch {
        // Ignore
      }
      setIsStaffLoginModalOpen(false);
      setActiveTab('owner_dashboard');
      showToast('Acesso de Caixa Autorizado', 'Sessão iniciada com sucesso.', 'success');
      return true;
    }
    showToast('PIN Incorreto', 'O PIN inserido não está correto. Tente novamente.', 'info');
    return false;
  };

  const logoutStaff = () => {
    setIsStaffAuthenticated(false);
    try {
      sessionStorage.removeItem(STAFF_AUTH_KEY);
    } catch {
      // Ignore
    }
    setActiveTab('stamp_card');
    showToast('Sessão Bloqueada', 'Regressou ao modo do cliente.', 'info');
  };

  // Helper to punch a customer in the database directly from staff/manager view
  const punchCustomerStampInDatabase = (customerId: string) => {
    soundFX.playPunch();

    setCustomersDatabase((prevDb) => {
      return prevDb.map((c) => {
        if (c.id !== customerId) return c;

        const newTotal = c.currentStamps + 1;
        let newCurrentStamps = newTotal;
        let newCompletedCards = c.completedCardsCount;
        const updatedRewards = [...c.rewards];

        if (newTotal >= 8) {
          newCompletedCards += 1;
          newCurrentStamps = 0;
          const voucherNumber = 100 + updatedRewards.length + 1;
          updatedRewards.unshift({
            id: `rew-${Date.now()}`,
            title: storeReward.treatTitle,
            description: storeReward.treatDescription,
            code: `TREAT-${voucherNumber}`,
            issuedAt: Date.now(),
            expiresAt: Date.now() + 86400000 * 30,
            isRedeemed: false,
          });
        }

        const newHistoryItem: StampRecord = {
          id: `stamp-${Date.now()}`,
          timestamp: Date.now(),
          source: 'staff_punch',
          note: 'Carimbo manual no balcão (+1)',
        };

        const updatedCustomer: CustomerProfile = {
          ...c,
          currentStamps: newCurrentStamps,
          completedCardsCount: newCompletedCards,
          lifetimeStampsEarned: c.lifetimeStampsEarned + 1,
          rewards: updatedRewards,
          history: [newHistoryItem, ...c.history],
          lastScanTimestamp: Date.now(),
        };

        // If this customer is currently active, sync it
        if (customer.id === customerId) {
          setCustomer(updatedCustomer);
        }

        if (db) setDoc(doc(db, 'customers', updatedCustomer.id), updatedCustomer).catch(() => {});

        return updatedCustomer;
      });
    });

    showToast('Carimbo Atribuído', 'Mais 1 carimbo registado na base de dados.', 'success');
  };

  const createCustomerInDatabase = (name: string, phone: string, initialStamps: number = 1): CustomerProfile => {
    const newId = `cust-${Date.now().toString().slice(-4)}`;
    const memberNumber = Math.floor(10000 + Math.random() * 90000);

    const newCustomer: CustomerProfile = {
      id: newId,
      name: name.trim() || 'Novo Cliente',
      phone: phone.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, '')}@cliente.pt`,
      memberId: `COFFEE-${memberNumber}`,
      memberSince: 'Hoje',
      currentStamps: initialStamps,
      completedCardsCount: 0,
      lifetimeStampsEarned: initialStamps,
      rewards: [],
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: Date.now(),
          source: 'staff_punch',
          note: `Conta criada com ${initialStamps} carimbo(s)`,
        },
      ],
      lastScanTimestamp: Date.now(),
    };

    setCustomersDatabase((prev) => [newCustomer, ...prev]);
    setCustomer(newCustomer);
    if (db) setDoc(doc(db, 'customers', newCustomer.id), newCustomer).catch(() => {});
    showToast('Cliente Criado', `${newCustomer.name} adicionado à base de dados com ${initialStamps} carimbo!`, 'success');
    return newCustomer;
  };

  const redeemCustomerRewardInDatabase = (customerId: string, rewardId: string) => {
    soundFX.playScanBeep();
    setCustomersDatabase((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const updated = {
          ...c,
          rewards: c.rewards.map((r) =>
            r.id === rewardId ? { ...r, isRedeemed: true, redeemedAt: Date.now() } : r
          ),
        };
        if (customer.id === customerId) setCustomer(updated);
        if (db) setDoc(doc(db, 'customers', updated.id), updated).catch(() => {});
        return updated;
      })
    );
    showToast('Oferta Entregue!', 'Vale descontado com sucesso no balcão.', 'info');
  };

  const deleteCustomerFromDatabase = (customerId: string) => {
    if (db) deleteDoc(doc(db, 'customers', customerId)).catch(() => {});
    setCustomersDatabase((prev) => {
      const filtered = prev.filter((c) => c.id !== customerId);
      if (filtered.length > 0 && customer.id === customerId) {
        setCustomer(filtered[0]);
      }
      return filtered;
    });
    showToast('Cliente Removido', 'Registo apagado da base de dados.', 'info');
  };

  const resetDatabaseToDefaults = () => {
    setCustomersDatabase(INITIAL_CUSTOMERS_DATABASE);
    setCustomer(INITIAL_CUSTOMERS_DATABASE[0]);
    showToast('Base de Dados Reiniciada', 'Dados de teste repostos.', 'info');
  };

  // Exactly 1 stamp per scan on current customer
  const addSingleStamp = (
    source: 'qr_counter_scan' | 'counter_code' | 'staff_punch' = 'qr_counter_scan',
    note?: string
  ) => {
    soundFX.playPunch();

    setCustomer((prev) => {
      const newTotal = prev.currentStamps + 1;
      let newCurrentStamps = newTotal;
      let newCompletedCards = prev.completedCardsCount;
      const updatedRewards = [...prev.rewards];
      let unlockedNewReward = false;

      // Card completes at 8 stamps
      if (newTotal >= 8) {
        unlockedNewReward = true;
        newCompletedCards += 1;
        newCurrentStamps = 0; // Fresh new card

        const voucherNumber = 100 + updatedRewards.length + 1;
        const newVoucher: RewardVoucher = {
          id: `rew-${Date.now()}`,
          title: storeReward.treatTitle,
          description: storeReward.treatDescription,
          code: `TREAT-${voucherNumber}`,
          issuedAt: Date.now(),
          expiresAt: Date.now() + 86400000 * 30, // 30 days
          isRedeemed: false,
        };
        updatedRewards.unshift(newVoucher);
      }

      const newHistoryItem: StampRecord = {
        id: `stamp-${Date.now()}`,
        timestamp: Date.now(),
        source,
        note: note || (source === 'qr_counter_scan' ? 'Leitura QR Balcão (+1 Carimbo)' : 'Carimbo no Balcão (+1)'),
      };

      const lifetime = prev.lifetimeStampsEarned + 1;

      // Pop the prominent scan confirmation dialog
      setScannedStampModal({
        isOpen: true,
        newStampsCount: newCurrentStamps,
        totalCards: newCompletedCards,
        isRewardUnlocked: unlockedNewReward,
        rewardTitle: storeReward.treatTitle,
      });

      if (unlockedNewReward) {
        setTimeout(() => {
          soundFX.playRewardChime();
          confetti({
            particleCount: 110,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#78350f', '#d97706', '#f59e0b', '#10b981'],
          });
        }, 200);

        showToast(
          '🎉 8 Carimbos Completos!',
          `Desbloqueou a oferta de "${storeReward.treatTitle}". Vale adicionado à sua carteira!`,
          'reward'
        );
      } else {
        showToast(
          '+1 Carimbo Registado!',
          `Carimbo adicionado ao cartão de ${prev.name} (${newCurrentStamps}/8 preenchidos).`,
          'success'
        );
      }

      const updatedCustomer: CustomerProfile = {
        ...prev,
        currentStamps: newCurrentStamps,
        completedCardsCount: newCompletedCards,
        lifetimeStampsEarned: lifetime,
        rewards: updatedRewards,
        history: [newHistoryItem, ...prev.history],
        lastScanTimestamp: Date.now(),
      };

      // Keep database in sync
      setCustomersDatabase((db) =>
        db.map((c) => (c.id === prev.id ? updatedCustomer : c))
      );

      if (db) setDoc(doc(db, 'customers', updatedCustomer.id), updatedCustomer).catch(() => {});

      // If customer has no phone registered yet (first scan!), open registration onboarding modal
      if (!prev.phone) {
        setTimeout(() => {
          setIsProfileModalOpen(true);
        }, 1300);
      }

      return updatedCustomer;
    });
  };

  // Handle URL query parameters for instant scan (?scan=counter or #scan=counter)
  useEffect(() => {
    if (hasProcessedScanRef.current) return;

    try {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const isScanRequest =
        search.includes('scan=counter') ||
        search.includes('stamp=true') ||
        hash.includes('scan=counter') ||
        hash.includes('stamp=true');

      if (isScanRequest) {
        hasProcessedScanRef.current = true;
        window.history.replaceState({}, document.title, window.location.pathname);
        if (!hasActiveSession) {
          // Block awarding stamp until visitor registers their name and phone
          setPendingFirstScan(true);
          setIsRegistrationOverlayOpen(true);
          showToast('1º Carimbo Detetado!', 'Registe o seu nome e telemóvel para creditar o seu 1º carimbo!', 'info');
        } else {
          addSingleStamp('qr_counter_scan', 'Leitura QR Balcão (+1 Carimbo)');
        }
      }
    } catch {
      // Ignore
    }
  }, [hasActiveSession]);

  const redeemReward = (rewardId: string) => {
    soundFX.playScanBeep();
    setCustomer((prev) => {
      const updatedRewards = prev.rewards.map((r) => {
        if (r.id === rewardId) {
          return {
            ...r,
            isRedeemed: true,
            redeemedAt: Date.now(),
          };
        }
        return r;
      });
      const updated = { ...prev, rewards: updatedRewards };
      setCustomersDatabase((db) =>
        db.map((c) => (c.id === prev.id ? updated : c))
      );
      return updated;
    });

    showToast('Oferta Reclamada', 'Apresente este ecrã ao funcionário. Bom apetite!', 'info');
  };

  const resetActiveCard = () => {
    setCustomer((prev) => {
      const updated = {
        ...prev,
        currentStamps: 0,
      };
      setCustomersDatabase((db) =>
        db.map((c) => (c.id === prev.id ? updated : c))
      );
      return updated;
    });
    showToast('Cartão Reiniciado', 'Cartão reposto a 0/8 carimbos.', 'info');
  };

  return (
    <LoyaltyContext.Provider
      value={{
        customer,
        hasActiveSession,
        isRegistrationOverlayOpen,
        setIsRegistrationOverlayOpen,
        pendingFirstScan,
        registerCustomerSession,
        activeTab,
        setActiveTab,
        selectCustomerProfile,
        customersDatabase,
        allProfiles: customersDatabase,
        createCustomerInDatabase,
        punchCustomerStampInDatabase,
        redeemCustomerRewardInDatabase,
        deleteCustomerFromDatabase,
        resetDatabaseToDefaults,
        storeReward,
        updateStoreReward,
        addSingleStamp,
        redeemReward,
        resetActiveCard,
        toast,
        showToast,
        dismissToast,
        isScannerOpen,
        setIsScannerOpen: handleSetIsScannerOpen,
        isConfigRewardOpen,
        setIsConfigRewardOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        updateCustomerProfile,
        isStaffAuthenticated,
        loginStaffWithPin,
        logoutStaff,
        isStaffLoginModalOpen,
        setIsStaffLoginModalOpen,
        scannedStampModal,
        setScannedStampModal,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
