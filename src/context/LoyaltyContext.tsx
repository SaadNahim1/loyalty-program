import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Customer,
  DailyPassConfig,
  getTodayDateString,
  generateDailyCredentials,
  normalizePhone,
  REWARD_PRESETS,
} from '../types/loyalty';
import { sound } from '../utils/sound';

const STORAGE_CUSTOMER_KEY = 'pitstop_loyalty_active_customer_v2';
const STORAGE_DAILY_CONFIG_KEY = 'pitstop_loyalty_daily_config_v2';
const STORAGE_STAFF_AUTH_KEY = 'pitstop_loyalty_staff_session_v2';

export type ActiveTab = 'card' | 'vouchers' | 'poster' | 'staff';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'reward';
}

interface LoyaltyContextValue {
  customer: Customer | null;
  dailyPass: DailyPassConfig;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isRegistrationOpen: boolean;
  setIsRegistrationOpen: (open: boolean) => void;
  isStaffAuthenticated: boolean;
  isStaffPinModalOpen: boolean;
  setIsStaffPinModalOpen: (open: boolean) => void;
  allCustomers: Customer[];
  toast: ToastMessage | null;
  dismissToast: () => void;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  lastPunchedIndex: number | null;
  registerOrRecoverCustomer: (name: string, phone: string, mode: 'register' | 'recover') => Promise<boolean>;
  logoutCustomer: () => void;
  validateAndApplyDailyScan: (scannedInput: string, source: 'qr_counter_scan' | 'counter_code') => Promise<{ ok: boolean; reason?: string }>;
  authenticateStaff: (pin: string) => boolean;
  logoutStaff: () => void;
  regenerateDailyPass: () => Promise<void>;
  updateDailyConfig: (updates: Partial<Pick<DailyPassConfig, 'treatTitle' | 'treatDescription' | 'allowMultiplePerDay' | 'staffPin'>>) => Promise<void>;
  staffRedeemVoucher: (customerId: string, voucherId: string) => Promise<void>;
  staffCreateCustomer: (name: string, phone: string) => Promise<void>;
  staffDeleteCustomer: (customerId: string) => Promise<void>;
  // Hydration & Diagnostic Monitor
  isHydrated: boolean;
  initializationStage: string;
  initializationLogs: string[];
  retryInitialization: () => void;
}

const LoyaltyContext = createContext<LoyaltyContextValue | undefined>(undefined);

function createDefaultDailyPass(): DailyPassConfig {
  const today = getTodayDateString();
  const creds = generateDailyCredentials(today);
  return {
    dateStr: today,
    qrToken: creds.qrToken,
    manualCode: creds.manualCode,
    treatTitle: REWARD_PRESETS[0].treatTitle,
    treatDescription: REWARD_PRESETS[0].treatDescription,
    allowMultiplePerDay: false,
    staffPin: '1234',
    generatedAt: Date.now(),
  };
}

function sanitizeDailyPassForFirestore(d: DailyPassConfig): DailyPassConfig {
  const cleanPin = (d.staffPin || '1234').trim().slice(0, 12);
  return {
    dateStr: (d.dateStr || getTodayDateString()).slice(0, 16),
    qrToken: (d.qrToken || '').slice(0, 64),
    manualCode: (d.manualCode || '').slice(0, 24),
    treatTitle: (d.treatTitle || REWARD_PRESETS[0].treatTitle).slice(0, 80),
    treatDescription: (d.treatDescription || REWARD_PRESETS[0].treatDescription).slice(0, 160),
    allowMultiplePerDay: Boolean(d.allowMultiplePerDay),
    staffPin: cleanPin.length >= 4 ? cleanPin : '1234',
    generatedAt: typeof d.generatedAt === 'number' ? d.generatedAt : Date.now(),
  };
}

function sanitizeCustomerForFirestore(c: Customer): Customer {
  return {
    id: c.id.slice(0, 64),
    name: c.name.trim().slice(0, 80) || 'Cliente Pitstop',
    phone: c.phone.trim().slice(0, 20),
    memberId: (c.memberId || 'PIT-0000').slice(0, 32),
    memberSince: (c.memberSince || 'out. 2026').slice(0, 32),
    currentStamps: Math.min(7, Math.max(0, Number(c.currentStamps) || 0)),
    completedCardsCount: Math.max(0, Number(c.completedCardsCount) || 0),
    lifetimeStampsEarned: Math.max(0, Number(c.lifetimeStampsEarned) || 0),
    ...(c.lastStampedDate ? { lastStampedDate: c.lastStampedDate.slice(0, 16) } : {}),
    ...(typeof c.lastScanTimestamp === 'number' ? { lastScanTimestamp: c.lastScanTimestamp } : {}),
    rewards: Array.isArray(c.rewards) ? c.rewards.slice(0, 50) : [],
    history: Array.isArray(c.history) ? c.history.slice(0, 60) : [],
  };
}

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.phone) {
          return sanitizeCustomerForFirestore(parsed);
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [dailyPass, setDailyPass] = useState<DailyPassConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DAILY_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DailyPassConfig;
        if (parsed && parsed.dateStr === getTodayDateString()) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return createDefaultDailyPass();
  });

  const [activeTab, setActiveTabState] = useState<ActiveTab>('card');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isStaffPinModalOpen, setIsStaffPinModalOpen] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_STAFF_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [lastPunchedIndex, setLastPunchedIndex] = useState<number | null>(null);
  const [pendingTokenFromUrl, setPendingTokenFromUrl] = useState<string | null>(null);

  // Diagnostic Monitor & Hydration State
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [initializationStage, setInitializationStage] = useState<string>('A inicializar clube de fidelização...');
  const [initializationLogs, setInitializationLogs] = useState<string[]>([]);

  const logStep = useCallback((step: string, details?: Record<string, unknown>) => {
    const time = new Date().toLocaleTimeString();
    const logMsg = `[${time}] ${step}`;
    setInitializationLogs((prev) => [...prev, logMsg]);
    setInitializationStage(step);
    console.info(`%c[LoyaltyProvider Monitor] ${step}`, 'color: #f59e0b; font-weight: bold;', details || '');
  }, []);

  const retryInitialization = useCallback(() => {
    console.group('%c[LoyaltyProvider Monitor] Re-executando Sequência de Inicialização...', 'color: #f59e0b; font-weight: bold;');
    logStep('Reinicialização manual solicitada');
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.phone) {
          setCustomer(sanitizeCustomerForFirestore(parsed));
          logStep('Cache de cliente restaurada', { id: parsed.id });
        }
      }
    } catch (err) {
      logStep('Aviso na recuperação de cache local', { error: String(err) });
    }
    setIsHydrated(true);
    console.groupEnd();
  }, [logStep]);

  useEffect(() => {
    console.group('%c[LoyaltyProvider Monitor] A iniciar monitor de fidelização...', 'color: #f59e0b; font-weight: bold;');
    logStep('1/4: A carregar dados do armazenamento local');

    const hasCustomer = Boolean(localStorage.getItem(STORAGE_CUSTOMER_KEY));
    logStep('2/4: Verificação de sessão de cliente', { hasCustomer });

    if (db) {
      logStep('3/4: Firebase Firestore disponível (sincronização em tempo real ativa)');
    } else {
      logStep('3/4: Modo Offline-First ativo (Persistência local)');
    }

    const timer = setTimeout(() => {
      logStep('4/4: Interface pronta e totalmente hidratada');
      setIsHydrated(true);
      console.groupEnd();
    }, 120);

    const safetyTimer = setTimeout(() => {
      setIsHydrated((prev) => {
        if (!prev) {
          console.warn('[LoyaltyProvider Monitor] Timeout atingido. Forçando hidratação segura.');
          return true;
        }
        return prev;
      });
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [logStep]);

  const showToast = useCallback(
    (title: string, message: string, type: ToastMessage['type'] = 'success') => {
      setToast({
        id: `toast-${Date.now()}`,
        title,
        message,
        type,
      });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Persist customer locally
  useEffect(() => {
    try {
      if (customer) {
        localStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(STORAGE_CUSTOMER_KEY);
      }
    } catch {
      // ignore
    }
  }, [customer]);

  // Persist dailyPass locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DAILY_CONFIG_KEY, JSON.stringify(dailyPass));
    } catch {
      // ignore
    }
  }, [dailyPass]);

  // Real-time sync of DailyPassConfig from Firestore (/store_config/daily_pass)
  useEffect(() => {
    if (!db) return;
    const configRef = doc(db, 'store_config', 'daily_pass');
    const unsubscribe = onSnapshot(
      configRef,
      async (snapshot) => {
        const today = getTodayDateString();
        if (!snapshot.exists()) {
          const fresh = sanitizeDailyPassForFirestore(createDefaultDailyPass());
          setDailyPass(fresh);
          try {
            await setDoc(configRef, fresh);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'store_config/daily_pass');
          }
          return;
        }

        const data = sanitizeDailyPassForFirestore(snapshot.data() as DailyPassConfig);
        // Auto-rollover if the stored pass is from an older date!
        if (data.dateStr !== today) {
          const creds = generateDailyCredentials(today);
          const rolledOver: DailyPassConfig = sanitizeDailyPassForFirestore({
            ...data,
            dateStr: today,
            qrToken: creds.qrToken,
            manualCode: creds.manualCode,
            generatedAt: Date.now(),
          });
          setDailyPass(rolledOver);
          try {
            await setDoc(configRef, rolledOver);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'store_config/daily_pass');
          }
        } else {
          setDailyPass(data);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'store_config/daily_pass');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time sync for the currently active customer document
  useEffect(() => {
    if (!customer?.id || !db) return;
    const custRef = doc(db, 'customers', customer.id);
    const unsubscribe = onSnapshot(
      custRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remote = sanitizeCustomerForFirestore(snapshot.data() as Customer);
          setCustomer(remote);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `customers/${customer.id}`);
      }
    );

    return () => unsubscribe();
  }, [customer?.id]);

  // Real-time sync of all customers ONLY when Staff Mode is authenticated
  useEffect(() => {
    if (!isStaffAuthenticated || !db) {
      setAllCustomers([]);
      return;
    }

    const colRef = collection(db, 'customers');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          list.push(sanitizeCustomerForFirestore(docSnap.data() as Customer));
        });
        list.sort((a, b) => (b.lastScanTimestamp || 0) - (a.lastScanTimestamp || 0));
        setAllCustomers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'customers');
      }
    );

    return () => unsubscribe();
  }, [isStaffAuthenticated]);

  const setActiveTab = useCallback(
    (tab: ActiveTab) => {
      if ((tab === 'staff' || tab === 'poster') && !isStaffAuthenticated) {
        setIsStaffPinModalOpen(true);
        return;
      }
      setActiveTabState(tab);
    },
    [isStaffAuthenticated]
  );

  // Core helper to apply +1 stamp to a customer record (ONLY via Daily QR or Daily Code)
  const applyStampToCustomerRecord = useCallback(
    async (
      targetCustomer: Customer,
      source: 'qr_counter_scan' | 'counter_code',
      note: string
    ): Promise<Customer> => {
      const today = getTodayDateString();
      const nextStamps = targetCustomer.currentStamps + 1;
      let finalStamps = nextStamps;
      let nextCompletedCards = targetCustomer.completedCardsCount;
      const nextRewards = [...targetCustomer.rewards];
      let unlockedReward = false;

      if (nextStamps >= 8) {
        unlockedReward = true;
        finalStamps = 0;
        nextCompletedCards += 1;
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        nextRewards.unshift({
          id: `rew-${Date.now()}`,
          title: dailyPass.treatTitle.slice(0, 80),
          description: dailyPass.treatDescription.slice(0, 160),
          code: `VALE-${codeSuffix}`,
          issuedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          isRedeemed: false,
        });
      }

      const newEntry = {
        id: `stamp-${Date.now()}`,
        timestamp: Date.now(),
        source,
        note,
      };

      const updated: Customer = sanitizeCustomerForFirestore({
        ...targetCustomer,
        currentStamps: finalStamps,
        completedCardsCount: nextCompletedCards,
        lifetimeStampsEarned: targetCustomer.lifetimeStampsEarned + 1,
        lastStampedDate: today,
        lastScanTimestamp: Date.now(),
        rewards: nextRewards,
        history: [newEntry, ...targetCustomer.history],
      });

      if (db) {
        const custRef = doc(db, 'customers', updated.id);
        try {
          await setDoc(custRef, updated);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `customers/${updated.id}`);
        }
      }

      if (customer?.id === updated.id) {
        setCustomer(updated);
        setLastPunchedIndex(unlockedReward ? 7 : finalStamps - 1);
        setTimeout(() => setLastPunchedIndex(null), 900);
      }

      if (unlockedReward) {
        sound.playRewardChime();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#78350f', '#d97706', '#f59e0b', '#059669'],
        });
        showToast(
          '🎉 8 Carimbos Completos!',
          `Parabéns! Ganhou um vale para "${dailyPass.treatTitle}". Consulte a aba Vales de Oferta.`,
          'reward'
        );
      } else {
        sound.playPunch();
        showToast(
          '+1 Carimbo Registado!',
          `Carimbo validado com sucesso (${finalStamps}/8 no cartão atual).`,
          'success'
        );
      }

      return updated;
    },
    [customer?.id, dailyPass.treatDescription, dailyPass.treatTitle, showToast]
  );

  // Validate a scanned QR payload or manual code against today's DailyPassConfig
  const validateAndApplyDailyScan = useCallback(
    async (
      scannedInput: string,
      source: 'qr_counter_scan' | 'counter_code'
    ): Promise<{ ok: boolean; reason?: string }> => {
      const raw = scannedInput.trim();
      if (!raw) {
        return { ok: false, reason: 'Nenhum código detetado.' };
      }

      // Extract dailyToken if scanning a full URL (e.g. https://.../?dailyToken=PITSTOP_DAILY_...)
      let extractedToken = raw;
      try {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          const url = new URL(raw);
          const paramToken = url.searchParams.get('dailyToken');
          if (paramToken) {
            extractedToken = paramToken;
          }
        }
      } catch {
        // Not a URL, keep raw string
      }

      const normalizedInput = extractedToken.toUpperCase();
      const validQrToken = dailyPass.qrToken.toUpperCase();
      const validManualCode = dailyPass.manualCode.toUpperCase();

      const isMatch =
        normalizedInput === validQrToken ||
        normalizedInput === validManualCode;

      if (!isMatch) {
        sound.playErrorBeep();
        // Check if it looks like an old Pitstop daily QR from a previous day
        if (normalizedInput.startsWith('PITSTOP_DAILY_') || normalizedInput.startsWith('PIT-')) {
          const msg = 'Este código pertence a outro dia ou já foi substituído pelo caixa.';
          showToast('Código Expirado', msg, 'error');
          return { ok: false, reason: msg };
        }
        const msg = 'Código inválido. Aponte apenas para o QR Code Oficial do Dia no balcão.';
        showToast('QR Code Não Reconhecido', msg, 'error');
        return { ok: false, reason: msg };
      }

      // If user is not registered yet, hold the validated token and prompt registration
      if (!customer) {
        sound.playScanBeep();
        setPendingTokenFromUrl(dailyPass.qrToken);
        setIsScannerOpen(false);
        setIsRegistrationOpen(true);
        showToast(
          'QR do Dia Validado!',
          'Identifique-se com o seu nome e telemóvel para guardar já o seu 1.º carimbo.',
          'info'
        );
        return { ok: true };
      }

      const today = getTodayDateString();
      if (!dailyPass.allowMultiplePerDay && customer.lastStampedDate === today) {
        sound.playErrorBeep();
        const msg = 'Já recolheu o seu carimbo diário hoje! Volte amanhã ou peça ao operador no balcão.';
        showToast('Limite Diário Atingido', msg, 'info');
        return { ok: false, reason: msg };
      }

      await applyStampToCustomerRecord(
        customer,
        source,
        source === 'qr_counter_scan'
          ? `Leitura QR do Dia (${dailyPass.manualCode})`
          : `Código do Dia (${dailyPass.manualCode})`
      );

      return { ok: true };
    },
    [applyStampToCustomerRecord, customer, dailyPass, showToast]
  );

  // Check URL parameters on boot (?dailyToken=...) so scanning with native phone camera works seamlessly
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('dailyToken');
      if (urlToken) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        setPendingTokenFromUrl(urlToken);
      }
    } catch {
      // ignore
    }
  }, []);

  // Process pending token from native camera scan once dailyPass is ready
  useEffect(() => {
    if (!pendingTokenFromUrl || !dailyPass.qrToken) return;
    if (isRegistrationOpen) return; // Waiting for user to finish registration
    const tokenToProcess = pendingTokenFromUrl;
    setPendingTokenFromUrl(null);
    validateAndApplyDailyScan(tokenToProcess, 'qr_counter_scan');
  }, [pendingTokenFromUrl, dailyPass.qrToken, isRegistrationOpen, validateAndApplyDailyScan]);

  const registerOrRecoverCustomer = useCallback(
    async (name: string, phone: string, mode: 'register' | 'recover'): Promise<boolean> => {
      const digits = normalizePhone(phone);
      if (digits.length < 9) {
        showToast('Telemóvel Inválido', 'Introduza um número com pelo menos 9 dígitos.', 'error');
        return false;
      }

      const customerId = `cust-${digits}`;
      if (db) {
        const custRef = doc(db, 'customers', customerId);
        try {
          const existingSnap = await getDoc(custRef);
          if (existingSnap.exists()) {
            const existingData = sanitizeCustomerForFirestore(existingSnap.data() as Customer);
            const updatedName = mode === 'register' && name.trim() ? name.trim() : existingData.name;
            const merged: Customer = {
              ...existingData,
              name: updatedName,
            };
            await setDoc(custRef, merged);
            setCustomer(merged);
            setIsRegistrationOpen(false);

            if (pendingTokenFromUrl) {
              setPendingTokenFromUrl(null);
              const today = getTodayDateString();
              if (dailyPass.allowMultiplePerDay || merged.lastStampedDate !== today) {
                await applyStampToCustomerRecord(
                  merged,
                  'qr_counter_scan',
                  `Leitura QR do Dia (${dailyPass.manualCode})`
                );
                return true;
              }
            }

            sound.playScanBeep();
            showToast(
              'Cartão Recuperado!',
              `Bem-vindo(a) de volta, ${merged.name}. Saldo: ${merged.currentStamps}/8 carimbos.`,
              'success'
            );
            return true;
          }

          if (mode === 'recover') {
            sound.playErrorBeep();
            showToast(
              'Cartão Não Encontrado',
              'Não existe nenhum cartão associado a este número. Crie um novo cartão.',
              'error'
            );
            return false;
          }

          // Create brand new customer
          const cleanName = name.trim() || 'Cliente Pitstop';
          const memberCode = `PIT-${digits.slice(-4)}-${Math.floor(10 + Math.random() * 89)}`;
          const hasInitialStamp = !!pendingTokenFromUrl;
          const today = getTodayDateString();

          const newCustomer: Customer = sanitizeCustomerForFirestore({
            id: customerId,
            name: cleanName,
            phone: phone.trim(),
            memberId: memberCode,
            memberSince: new Date().toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
            currentStamps: hasInitialStamp ? 1 : 0,
            completedCardsCount: 0,
            lifetimeStampsEarned: hasInitialStamp ? 1 : 0,
            ...(hasInitialStamp ? { lastStampedDate: today, lastScanTimestamp: Date.now() } : {}),
            rewards: [],
            history: hasInitialStamp
              ? [
                  {
                    id: `stamp-${Date.now()}`,
                    timestamp: Date.now(),
                    source: 'qr_counter_scan',
                    note: `1.º Carimbo na Ativação (${dailyPass.manualCode})`,
                  },
                ]
              : [],
          });

          await setDoc(custRef, newCustomer);
          setCustomer(newCustomer);
          setPendingTokenFromUrl(null);
          setIsRegistrationOpen(false);

          sound.playPunch();
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });

          showToast(
            hasInitialStamp ? 'Cartão Ativado + 1.º Carimbo!' : 'Cartão Digital Ativado!',
            `Bem-vindo(a), ${cleanName}! O seu cartão está associado ao número ${phone.trim()}.`,
            'success'
          );
          return true;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `customers/${customerId}`);
          return false;
        }
      }

      // Offline mode fallback
      const cleanName = name.trim() || 'Cliente Pitstop';
      const memberCode = `PIT-${digits.slice(-4)}-${Math.floor(10 + Math.random() * 89)}`;
      const offlineCustomer: Customer = sanitizeCustomerForFirestore({
        id: customerId,
        name: cleanName,
        phone: phone.trim(),
        memberId: memberCode,
        memberSince: new Date().toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
        currentStamps: pendingTokenFromUrl ? 1 : 0,
        completedCardsCount: 0,
        lifetimeStampsEarned: pendingTokenFromUrl ? 1 : 0,
        rewards: [],
        history: [],
      });
      setCustomer(offlineCustomer);
      setIsRegistrationOpen(false);
      showToast('Cartão Ativado (Modo Local)', `Bem-vindo(a), ${cleanName}!`, 'success');
      return true;
    },
    [applyStampToCustomerRecord, dailyPass.allowMultiplePerDay, dailyPass.manualCode, pendingTokenFromUrl, showToast]
  );

  const logoutCustomer = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_CUSTOMER_KEY);
    showToast('Sessão Terminada', 'Pode entrar novamente a qualquer momento com o seu telemóvel.', 'info');
  }, [showToast]);

  const authenticateStaff = useCallback(
    (pin: string): boolean => {
      if (pin.trim() === dailyPass.staffPin) {
        setIsStaffAuthenticated(true);
        try {
          sessionStorage.setItem(STORAGE_STAFF_AUTH_KEY, 'true');
        } catch {
          // ignore
        }
        setIsStaffPinModalOpen(false);
        setActiveTabState('staff');
        sound.playScanBeep();
        showToast('Modo Caixa Ativo', 'Acesso autorizado ao painel de gestão e gerador de QR do dia.', 'success');
        return true;
      }
      sound.playErrorBeep();
      showToast('PIN Incorreto', 'O código PIN de operador não coincide.', 'error');
      return false;
    },
    [dailyPass.staffPin, showToast]
  );

  const logoutStaff = useCallback(() => {
    setIsStaffAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_STAFF_AUTH_KEY);
    } catch {
      // ignore
    }
    if (activeTab === 'staff' || activeTab === 'poster') {
      setActiveTabState('card');
    }
    showToast('Modo Caixa Bloqueado', 'Sessão de operador encerrada com segurança.', 'info');
  }, [activeTab, showToast]);

  const regenerateDailyPass = useCallback(async () => {
    const today = getTodayDateString();
    const creds = generateDailyCredentials(today);
    const nextConfig: DailyPassConfig = sanitizeDailyPassForFirestore({
      ...dailyPass,
      dateStr: today,
      qrToken: creds.qrToken,
      manualCode: creds.manualCode,
      generatedAt: Date.now(),
    });
    setDailyPass(nextConfig);

    if (db) {
      try {
        await setDoc(doc(db, 'store_config', 'daily_pass'), nextConfig);
        sound.playScanBeep();
        showToast(
          'Novo QR do Dia Gerado!',
          `O código anterior foi invalidado. Novo código manual: ${creds.manualCode}`,
          'success'
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'store_config/daily_pass');
      }
    } else {
      showToast(
        'Novo QR Gerado (Local)',
        `Novo código manual: ${creds.manualCode}`,
        'success'
      );
    }
  }, [dailyPass, showToast]);

  const updateDailyConfig = useCallback(
    async (
      updates: Partial<Pick<DailyPassConfig, 'treatTitle' | 'treatDescription' | 'allowMultiplePerDay' | 'staffPin'>>
    ) => {
      const nextConfig: DailyPassConfig = sanitizeDailyPassForFirestore({
        ...dailyPass,
        ...updates,
      });
      setDailyPass(nextConfig);

      if (db) {
        try {
          await setDoc(doc(db, 'store_config', 'daily_pass'), nextConfig);
          showToast('Configuração Guardada', 'As regras da oferta e do QR diário foram atualizadas.', 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'store_config/daily_pass');
        }
      } else {
        showToast('Configuração Guardada (Local)', 'Atualizado com sucesso.', 'success');
      }
    },
    [dailyPass, showToast]
  );

  const staffRedeemVoucher = useCallback(
    async (customerId: string, voucherId: string) => {
      const target = allCustomers.find((c) => c.id === customerId) || (customer?.id === customerId ? customer : null);
      if (!target) return;

      const updatedRewards = target.rewards.map((r) =>
        r.id === voucherId ? { ...r, isRedeemed: true, redeemedAt: Date.now() } : r
      );

      const updatedCustomer = sanitizeCustomerForFirestore({
        ...target,
        rewards: updatedRewards,
      });

      if (db) {
        try {
          await setDoc(doc(db, 'customers', customerId), updatedCustomer);
          sound.playScanBeep();
          showToast('Vale Resgatado!', `Oferta entregue a ${target.name}.`, 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `customers/${customerId}`);
        }
      } else {
        showToast('Vale Resgatado (Local)!', `Oferta entregue a ${target.name}.`, 'success');
      }
    },
    [allCustomers, customer, showToast]
  );

  const staffCreateCustomer = useCallback(
    async (name: string, phone: string) => {
      const digits = normalizePhone(phone);
      if (digits.length < 9) {
        showToast('Telemóvel Inválido', 'Insira pelo menos 9 dígitos.', 'error');
        return;
      }

      const customerId = `cust-${digits}`;
      const memberCode = `PIT-${digits.slice(-4)}-${Math.floor(10 + Math.random() * 89)}`;
      const newCust: Customer = sanitizeCustomerForFirestore({
        id: customerId,
        name: name.trim() || 'Cliente Balcão',
        phone: phone.trim(),
        memberId: memberCode,
        memberSince: new Date().toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
        currentStamps: 0,
        completedCardsCount: 0,
        lifetimeStampsEarned: 0,
        rewards: [],
        history: [],
      });

      if (db) {
        const custRef = doc(db, 'customers', customerId);
        try {
          const existingSnap = await getDoc(custRef);
          if (existingSnap.exists()) {
            showToast(
              'Cliente Já Registado',
              'Este número já tem cartão ativo. O cliente deve ler o QR Code do Dia para receber carimbo.',
              'info'
            );
            return;
          }

          await setDoc(custRef, newCust);
          sound.playScanBeep();
          showToast(
            'Cliente Registado (0/8)',
            `${newCust.name} criado. O cliente deve ler o QR do Dia no balcão para ganhar carimbos.`,
            'success'
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `customers/${customerId}`);
        }
      } else {
        showToast(
          'Cliente Criado (Local)',
          `${newCust.name} registado. Carimbos apenas por QR Code.`,
          'success'
        );
      }
    },
    [showToast]
  );

  const staffDeleteCustomer = useCallback(
    async (customerId: string) => {
      if (db) {
        try {
          await deleteDoc(doc(db, 'customers', customerId));
          if (customer?.id === customerId) {
            setCustomer(null);
          }
          showToast('Registo Removido', 'Cartão de cliente eliminado.', 'info');
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `customers/${customerId}`);
        }
      }
    },
    [customer?.id, showToast]
  );

  return (
    <LoyaltyContext.Provider
      value={{
        customer,
        dailyPass,
        activeTab,
        setActiveTab,
        isScannerOpen,
        setIsScannerOpen,
        isRegistrationOpen,
        setIsRegistrationOpen,
        isStaffAuthenticated,
        isStaffPinModalOpen,
        setIsStaffPinModalOpen,
        allCustomers,
        toast,
        dismissToast,
        showToast,
        lastPunchedIndex,
        registerOrRecoverCustomer,
        logoutCustomer,
        validateAndApplyDailyScan,
        authenticateStaff,
        logoutStaff,
        regenerateDailyPass,
        updateDailyConfig,
        staffRedeemVoucher,
        staffCreateCustomer,
        staffDeleteCustomer,
        isHydrated,
        initializationStage,
        initializationLogs,
        retryInitialization,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export function useLoyalty() {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return ctx;
}
