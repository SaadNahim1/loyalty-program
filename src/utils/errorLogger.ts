/**
 * Global Error Logging Utility for Pitstop Roast & Bakery
 * Captures, formats, and persists hydration errors, runtime exceptions,
 * and unhandled promise rejections to diagnose client-side crashes.
 */

export interface ErrorReport {
  id: string;
  timestamp: string;
  timestampMs: number;
  type: 'render_crash' | 'hydration_error' | 'unhandled_rejection' | 'window_error';
  message: string;
  name: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  localStorageKeys: string[];
  sessionStorageKeys: string[];
}

const ERROR_LOGS_STORAGE_KEY = 'pitstop_client_error_logs_v1';
const MAX_STORED_ERRORS = 25;

export function isLikelyHydrationError(msg: string): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes('hydration') ||
    lower.includes('did not match') ||
    lower.includes('minified react error #418') ||
    lower.includes('minified react error #423') ||
    lower.includes('minified react error #425') ||
    lower.includes('server-rendered html')
  );
}

export function logErrorToPersistentStore(
  error: unknown,
  errorInfo?: { componentStack?: string | null },
  typeOverride?: ErrorReport['type']
): ErrorReport {
  const now = new Date();
  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorStack = error instanceof Error ? error.stack : undefined;
  const compStack = errorInfo?.componentStack || undefined;

  const isHydration = isLikelyHydrationError(errorMessage) || isLikelyHydrationError(compStack || '');
  const type: ErrorReport['type'] = typeOverride || (isHydration ? 'hydration_error' : 'render_crash');

  let lsKeys: string[] = [];
  let ssKeys: string[] = [];
  try {
    lsKeys = Object.keys(localStorage);
  } catch {
    // Ignore storage security restrictions
  }
  try {
    ssKeys = Object.keys(sessionStorage);
  } catch {
    // Ignore
  }

  const report: ErrorReport = {
    id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    timestampMs: now.getTime(),
    type,
    message: errorMessage,
    name: errorName,
    stack: errorStack,
    componentStack: compStack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
    },
    localStorageKeys: lsKeys,
    sessionStorageKeys: ssKeys,
  };

  // Structured console report
  console.groupCollapsed(
    `%c[Pitstop Error Logger] ${type.toUpperCase()}: ${errorName} - ${now.toLocaleTimeString()}`,
    'background: #7f1d1d; color: #fecaca; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
  );
  console.error('Message:', errorMessage);
  if (errorStack) console.error('Stack Trace:', errorStack);
  if (compStack) console.warn('Component Stack:', compStack);
  console.table({
    Type: report.type,
    Timestamp: report.timestamp,
    URL: report.url,
    'Viewport (WxH)': `${report.viewport.width}x${report.viewport.height}`,
    'Stored Keys': report.localStorageKeys.join(', '),
  });
  console.groupEnd();

  // Save to persistent storage
  try {
    const existingRaw = localStorage.getItem(ERROR_LOGS_STORAGE_KEY);
    const existingList: ErrorReport[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updatedList = [report, ...existingList].slice(0, MAX_STORED_ERRORS);
    localStorage.setItem(ERROR_LOGS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (storeError) {
    console.warn('[ErrorLogger] Failed to write error report to localStorage:', storeError);
  }

  return report;
}

export function getPersistedErrorLogs(): ErrorReport[] {
  try {
    const raw = localStorage.getItem(ERROR_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPersistedErrorLogs(): void {
  try {
    localStorage.removeItem(ERROR_LOGS_STORAGE_KEY);
    console.log('[ErrorLogger] Persisted error reports cleared.');
  } catch {
    // Ignore
  }
}

// Attach diagnostic helper to global window for browser console access
if (typeof window !== 'undefined') {
  (window as unknown as { __PITSTOP_GET_ERROR_LOGS__: () => ErrorReport[] }).__PITSTOP_GET_ERROR_LOGS__ =
    getPersistedErrorLogs;
  (window as unknown as { __PITSTOP_CLEAR_ERROR_LOGS__: () => void }).__PITSTOP_CLEAR_ERROR_LOGS__ =
    clearPersistedErrorLogs;
}
