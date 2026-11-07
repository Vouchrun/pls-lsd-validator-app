/**
 * Persistence for an in-progress TVA sweep.
 *
 * Signing N Safes takes many wallet prompts. Keeping the collected signatures
 * (and the submitted transaction hash) in localStorage means a refresh, an
 * accidental navigation or a rejected prompt no longer throws the whole
 * session away, and a second run can never be stacked on top of an
 * unconfirmed first one.
 *
 * A stored signature is only valid for the exact (Safe, destination, value,
 * nonce) tuple that was signed, so the risk of a stale entry is bounded: the
 * sweep re-reads the nonce and balance and drops anything that moved.
 */

export interface StoredSweepItem {
  address: string;
  balance: string;
  nonce: string;
  signature: string;
}

export interface StoredSweepSession {
  version: 1;
  destination: string;
  signer: string;
  chainId: number;
  createdAt: number;
  /** Set while a multiSend is waiting for the wallet to return a hash. */
  submitting?: boolean;
  /** Set as soon as the multiSend has been broadcast. */
  submittedTxHash?: string;
  items: StoredSweepItem[];
}

const STORAGE_KEY = 'tva_sweep_session_v1';

/** Signatures older than this are discarded rather than resumed. */
export const SWEEP_SESSION_TTL_MS = 30 * 60 * 1000;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSweepSession(): StoredSweepSession | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSweepSession;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    if (Date.now() - parsed.createdAt > SWEEP_SESSION_TTL_MS) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSweepSession(session: StoredSweepSession): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or disabled: the sweep still works, it just cannot resume.
  }
}

export function clearSweepSession(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
