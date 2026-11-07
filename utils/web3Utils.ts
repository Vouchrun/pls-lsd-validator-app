import Web3 from 'web3';
import { getEthereumRpc, getAllRpcUrls, getLsdEthMetamaskParam } from 'config/env';
import snackbarUtil from './snackbarUtils';
import { AbiItem } from 'web3-utils';

declare const window: any;

const STORAGE_KEY_CUSTOM_RPC = 'eth_lsd_custom_rpc';
const STORAGE_KEY_BAD_RPCS = 'eth_lsd_bad_rpcs_v1';
// Legacy, index-only key written by the old failover. It is deliberately purged:
// a stale persisted index must not override the configured / custom endpoint.
const STORAGE_KEY_LEGACY_RPC_INDEX = 'working_rpc_index';

// A failed endpoint becomes eligible again after this window. Previously a bad
// RPC was never retried, so one transient outage could stick for the session.
const BAD_RPC_TTL = 30 * 60 * 1000; // 30 minutes

const DEFAULT_OPERATION_TIMEOUT_MS = 15_000;

// RPC failover state
let currentRpcIndex = 0;
let workingRpc: string | null = null;
let lastRpcUrl: string | null = null;
// rpcUrl -> epoch ms when it was marked bad
let badRpcs: Map<string, number> = new Map();

let ethWeb3: Web3 | undefined = undefined;

type RpcChangeListener = (rpc: string) => void;
const rpcChangeListeners: RpcChangeListener[] = [];

function getStorageValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / disabled storage
  }
}

function removeStorageValue(key: string) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Read the custom RPC from storage on every call so a change made in another
 * tab (or by the settings drawer) is picked up without a reload.
 */
function getCustomRpc(): string | null {
  const stored = getStorageValue(STORAGE_KEY_CUSTOM_RPC);
  return stored && stored.trim() ? stored.trim() : null;
}

/**
 * Load bad RPCs from storage, dropping marks older than BAD_RPC_TTL. The
 * legacy array format is discarded: it carries no timestamp and would never
 * recover.
 */
function loadBadRpcs(): Map<string, number> {
  const map = new Map<string, number>();
  const now = Date.now();
  const raw = getStorageValue(STORAGE_KEY_BAD_RPCS);
  if (!raw) {
    return map;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      Object.keys(parsed).forEach((rpcUrl) => {
        const markedAt = typeof parsed[rpcUrl] === 'number' ? parsed[rpcUrl] : 0;
        if (now - markedAt < BAD_RPC_TTL) {
          map.set(rpcUrl, markedAt);
        }
      });
    }
  } catch (e) {
    console.error('Error loading bad RPCs:', e);
  }
  return map;
}

function saveBadRpcs(map: Map<string, number>) {
  const serialized: Record<string, number> = {};
  map.forEach((markedAt, rpcUrl) => {
    serialized[rpcUrl] = markedAt;
  });
  setStorageValue(STORAGE_KEY_BAD_RPCS, JSON.stringify(serialized));
}

function isRpcMarkedBad(rpcUrl: string): boolean {
  const markedAt = badRpcs.get(rpcUrl);
  if (markedAt === undefined) {
    return false;
  }
  if (Date.now() - markedAt >= BAD_RPC_TTL) {
    badRpcs.delete(rpcUrl);
    saveBadRpcs(badRpcs);
    return false;
  }
  return true;
}

function markRpcAsBad(rpcUrl: string) {
  badRpcs.set(rpcUrl, Date.now());
  saveBadRpcs(badRpcs);
  console.warn(`Marked RPC as bad: ${rpcUrl}`);
  if (workingRpc === rpcUrl) {
    workingRpc = null;
  }
}

function setSessionWorkingRpc(rpcUrl: string) {
  workingRpc = rpcUrl;
}

function initializeRpcState() {
  badRpcs = loadBadRpcs();
  workingRpc = null;
  currentRpcIndex = 0;
  removeStorageValue(STORAGE_KEY_LEGACY_RPC_INDEX);
}

if (typeof window !== 'undefined') {
  initializeRpcState();
}

export function clearBadRpcs() {
  badRpcs.clear();
  saveBadRpcs(badRpcs);
}

export function getBadRpcs(): string[] {
  return Array.from(badRpcs.keys());
}

export function getWorkingRpc(): string | null {
  return workingRpc;
}

export function onRpcChange(listener: RpcChangeListener) {
  rpcChangeListeners.push(listener);
  return () => {
    const index = rpcChangeListeners.indexOf(listener);
    if (index > -1) {
      rpcChangeListeners.splice(index, 1);
    }
  };
}

function notifyRpcChange(newRpc: string) {
  rpcChangeListeners.forEach((listener) => listener(newRpc));
}

/**
 * Find the next RPC that is not currently marked bad.
 * Priority: the current RPC if healthy, the user's custom RPC, the session's
 * working RPC, then the first configured endpoint.
 */
function findNextWorkingRpc(currentRpc?: string): string | null {
  const allRpcs = getAllRpcUrls();
  const healthy = allRpcs.filter((rpc) => !isRpcMarkedBad(rpc));

  if (healthy.length === 0) {
    // Everything is marked bad: assume they may have recovered and reset.
    badRpcs.clear();
    saveBadRpcs(badRpcs);
    return allRpcs[0] || null;
  }

  if (currentRpc && healthy.includes(currentRpc)) {
    return currentRpc;
  }

  const customRpc = getCustomRpc();
  if (customRpc && healthy.includes(customRpc)) {
    return customRpc;
  }

  if (workingRpc && healthy.includes(workingRpc)) {
    return workingRpc;
  }

  return healthy[0] || null;
}

/**
 * Get the current active RPC URL.
 */
export function getCurrentRpc(): string {
  const allRpcs = getAllRpcUrls();

  if (workingRpc && !isRpcMarkedBad(workingRpc) && allRpcs.includes(workingRpc)) {
    const index = allRpcs.indexOf(workingRpc);
    if (index >= 0) {
      currentRpcIndex = index;
    }
    return workingRpc;
  }

  const nextRpc = findNextWorkingRpc();
  if (nextRpc) {
    const index = allRpcs.indexOf(nextRpc);
    if (index >= 0) {
      currentRpcIndex = index;
      setSessionWorkingRpc(nextRpc);
    }
    return nextRpc;
  }

  return allRpcs[currentRpcIndex % allRpcs.length] || getEthereumRpc();
}

/**
 * Backwards-compatible alias used by the settings drawer.
 */
export function getCurrentWorkingRpc(): string {
  return getCurrentRpc();
}

/**
 * Persist a user-selected custom RPC and make it active immediately. Clears any
 * stale "bad" mark so an endpoint the operator just chose is never skipped.
 */
export function updateCachedCustomRpc(customRpc: string | null) {
  const normalized = customRpc && customRpc.trim() ? customRpc.trim() : null;

  if (normalized) {
    setStorageValue(STORAGE_KEY_CUSTOM_RPC, normalized);
    if (badRpcs.delete(normalized)) {
      saveBadRpcs(badRpcs);
    }
    workingRpc = normalized;
    currentRpcIndex = 0;
  } else {
    removeStorageValue(STORAGE_KEY_CUSTOM_RPC);
    workingRpc = null;
    currentRpcIndex = 0;
  }

  ethWeb3 = undefined;
  lastRpcUrl = null;
  notifyRpcChange(normalized || getCurrentRpc());
}

/**
 * Switch to the next working RPC.
 * @param markCurrentAsBad mark the current endpoint as failed before switching
 */
export function switchToNextRpc(markCurrentAsBad: boolean = false): boolean {
  const currentRpc = getCurrentRpc();

  if (markCurrentAsBad && currentRpc) {
    markRpcAsBad(currentRpc);
  }

  const nextRpc = findNextWorkingRpc();
  if (!nextRpc) {
    console.error('No working RPC found');
    return false;
  }

  if (nextRpc === currentRpc && !markCurrentAsBad) {
    return false;
  }

  const allRpcs = getAllRpcUrls();
  const newIndex = allRpcs.indexOf(nextRpc);
  if (newIndex < 0) {
    return false;
  }

  currentRpcIndex = newIndex;
  setSessionWorkingRpc(nextRpc);
  ethWeb3 = undefined;
  lastRpcUrl = null;

  console.warn(`Switching to working RPC: ${nextRpc} (index ${newIndex})`);
  notifyRpcChange(nextRpc);
  return true;
}

/**
 * True when the error carries revert data / a revert message. These are
 * deterministic: retrying on another endpoint will not fix them, and they must
 * surface quickly (the sweep relies on reading GS codes per Safe).
 */
function isContractError(error: any): boolean {
  if (!error) {
    return false;
  }
  const message = `${error.message || ''} ${error.shortMessage || ''}`.toLowerCase();
  return (
    (typeof error.data === 'string' && error.data.length >= 10) ||
    message.includes('revert') ||
    message.includes('execution reverted')
  );
}

/**
 * Check if an error indicates a blocked / failed RPC request.
 */
function isRpcError(error: any): boolean {
  if (!error || isContractError(error)) {
    return false;
  }

  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = error.code;
  const errorString = String(error).toLowerCase();

  return (
    errorMessage.includes('blocked') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('failed') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('connection reset') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('bad gateway') ||
    errorString.includes('blocked') ||
    errorString.includes('network') ||
    errorCode === -32603 ||
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'TIMEOUT' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ERR_NETWORK' ||
    errorCode === 'ERR_INTERNET_DISCONNECTED' ||
    (error instanceof TypeError && errorMessage.includes('fetch')) ||
    error.name === 'NetworkError' ||
    (error.name === 'TypeError' && errorMessage.includes('network'))
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: any;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `Request timeout after ${timeoutMs}ms - RPC may be blocked or unresponsive`
            )
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Execute a Web3 operation with automatic RPC failover.
 *
 * - Tries every configured endpoint by default (the old default was 2).
 * - Races each attempt against a timeout so a hung provider cannot stall the UI.
 * - Only rotates on transport/RPC errors; contract reverts are thrown
 *   immediately instead of being retried on every endpoint.
 */
export async function executeWithRpcFallback<T>(
  operation: (web3: Web3) => Promise<T>,
  maxRetries?: number,
  timeoutMs: number = DEFAULT_OPERATION_TIMEOUT_MS
): Promise<T> {
  const allRpcs = getAllRpcUrls();
  const maxAttempts = maxRetries || allRpcs.length;
  let lastError: any;
  const initialRpcIndex = currentRpcIndex;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const web3 = getEthWeb3();
      const result = await withTimeout(operation(web3), timeoutMs);

      const currentRpc = getCurrentRpc();
      if (currentRpc && !isRpcMarkedBad(currentRpc)) {
        setSessionWorkingRpc(currentRpc);
      }

      return result;
    } catch (error: any) {
      lastError = error;
      const isRpcFailure =
        isRpcError(error) || (error?.message || '').includes('timeout');

      console.error(
        `RPC call failed (attempt ${attempt}/${maxAttempts}):`,
        error?.message,
        isRpcFailure ? '(RPC error detected)' : '(non-RPC error)'
      );

      // Deterministic failure (e.g. a Safe revert): do not rotate or retry.
      if (!isRpcFailure) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const switched = switchToNextRpc(true);
        if (switched) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
      }
    }
  }

  currentRpcIndex = initialRpcIndex;
  ethWeb3 = undefined;
  lastRpcUrl = null;

  throw new Error(
    `All RPC endpoints failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
  );
}

export function createWeb3(provider?: any) {
  return new Web3(provider || (window.ethereum as any) || Web3.givenProvider);
}

function createWeb3Provider(rpcUrl: string) {
  const useWebsocket = rpcUrl.startsWith('wss');
  return useWebsocket
    ? new Web3.providers.WebsocketProvider(rpcUrl, {
        timeout: DEFAULT_OPERATION_TIMEOUT_MS,
        clientConfig: { keepalive: true, keepaliveInterval: 60_000 },
        reconnect: { auto: false, delay: 5_000, maxAttempts: 1 },
      })
    : new Web3.providers.HttpProvider(rpcUrl, {
        timeout: DEFAULT_OPERATION_TIMEOUT_MS,
        keepAlive: false,
      });
}

/**
 * Get the Ethereum Web3 singleton. Recreates it whenever the active RPC
 * changes, so a failover actually takes effect.
 */
export function getEthWeb3(): Web3 {
  const rpcLink = getCurrentRpc();

  if (!ethWeb3 || lastRpcUrl !== rpcLink) {
    ethWeb3 = createWeb3(createWeb3Provider(rpcLink));
    lastRpcUrl = rpcLink;
  }

  return ethWeb3;
}

export async function getErc20AssetBalance(
  userAddress: string | undefined,
  tokenAbi: AbiItem | AbiItem[],
  tokenAddress: string | undefined
) {
  if (!userAddress || !tokenAbi || !tokenAddress) {
    return undefined;
  }
  try {
    return await executeWithRpcFallback(async (web3) => {
      let contract = new web3.eth.Contract(tokenAbi, tokenAddress, {
        from: userAddress,
      });
      const result = await contract.methods.balanceOf(userAddress).call();
      let balance = web3.utils.fromWei(result + '', 'ether');
      return balance;
    });
  } catch (err: any) {
    return undefined;
  }
}

/**
 * add lsd ETH to metamask
 */
export async function addLsdEthToMetaMask() {
  if (!window.ethereum) {
    return;
  }

  const params = getLsdEthMetamaskParam();

  try {
    window.ethereum
      .request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: params.tokenAddress,
            symbol: params.tokenSymbol,
            decimals: params.tokenDecimals,
            image: params.tokenImage,
          },
        },
      })
      .then((wasAdded: boolean) => {
        if (wasAdded) {
          snackbarUtil.success('Add token success');
        }
      });
  } catch (err: any) {}
}

/**
 * decode BalancesUpdated event log data
 */
export function decodeBalancesUpdatedLog(data: string, topics: string[]) {
  const web3 = getEthWeb3();
  const values = web3.eth.abi.decodeLog(
    [
      { name: 'block', type: 'uint256' },
      { name: 'totalEth', type: 'uint256' },
      { name: 'lsdTokenSupply', type: 'uint256' },
      { name: 'time', type: 'uint256' },
    ],
    data,
    topics
  );
  return values;
}
