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

// Per-operation client timeout. Deliberately below geth's 30 s request ceiling
// (rpc/http.go WriteTimeout) so the client always fails first with a clean,
// deterministic error. 20 s leaves ~8x headroom over a normal 25k-block
// eth_getLogs page (~1.25 s scan + RTT).
const DEFAULT_OPERATION_TIMEOUT_MS = 20_000;
// Provider-level timeout is intentionally longer than the operation timeout so
// our race wins and the surfaced error is the operation timeout, not a generic
// provider failure.
const PROVIDER_TIMEOUT_MS = 25_000;

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
 * Raised when a request is malformed before it is sent (e.g. an eth_getLogs
 * range larger than the hard maximum). This is deterministic: it must never
 * rotate endpoints or mark an RPC as bad.
 */
export class QueryShapeError extends Error {
  readonly isQueryShape = true;

  constructor(message: string) {
    super(message);
    this.name = 'QueryShapeError';
  }
}

function isQueryShapeError(error: any): boolean {
  return !!(
    error &&
    (error.isQueryShape === true || error.name === 'QueryShapeError')
  );
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

      // Query-shape errors are deterministic: never rotate or mark the
      // endpoint bad, just surface the error.
      if (isQueryShapeError(error)) {
        throw error;
      }

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

// ---------------------------------------------------------------------------
// eth_getLogs pagination
// ---------------------------------------------------------------------------
//
// A single eth_getLogs over a large range cannot succeed: geth scans at roughly
// 20k blocks/s and hard-kills any request at 30 s (rpc/http.go WriteTimeout),
// so a 600k-block query takes ~30 s and always fails. The only fix is to split
// the range into pages that comfortably fit the budget, run a bounded number of
// them concurrently, and apply the timeout per page rather than to the sweep.

/** Target page size: ~1.25 s of scanning at the measured ~20k blocks/s. */
export const DEFAULT_LOG_PAGE_BLOCKS = 25_000;
/** Hard ceiling for any single eth_getLogs request. */
export const MAX_LOG_PAGE_BLOCKS = 100_000;
/** Global cap across every paginated log sweep in the app. */
export const MAX_CONCURRENT_LOG_PAGES = 8;

const LOG_PAGE_RETRY_DELAY_MS = 300;
const LOG_PAGE_ATTEMPTS = 3;

export interface LogPageProgress {
  done: number;
  total: number;
  fromBlock: number;
  toBlock: number;
}

export interface PaginatedLogOptions {
  /** Blocks per request. Defaults to 25,000; capped by MAX_LOG_PAGE_BLOCKS. */
  pageSize?: number;
  /** Per-sweep concurrency cap. The global semaphore still applies. */
  concurrency?: number;
  /** Timeout for a single page (not the whole sweep). */
  perPageTimeoutMs?: number;
  onProgress?: (progress: LogPageProgress) => void;
}

let activeLogPages = 0;
const logPageWaiters: Array<() => void> = [];

async function acquireLogPageSlot(): Promise<void> {
  if (activeLogPages < MAX_CONCURRENT_LOG_PAGES) {
    activeLogPages += 1;
    return;
  }
  await new Promise<void>((resolve) => logPageWaiters.push(resolve));
  activeLogPages += 1;
}

function releaseLogPageSlot(): void {
  activeLogPages = Math.max(0, activeLogPages - 1);
  const next = logPageWaiters.shift();
  if (next) {
    next();
  }
}

/**
 * Fetch `eventName` logs across [fromBlock, toBlock] in safe, concurrent pages.
 *
 * @param contractFactory builds the contract from the *current* web3 instance,
 *        so a failover between pages uses the new endpoint.
 */
export async function getPastEventsPaginated(
  contractFactory: (web3: Web3) => any,
  eventName: string,
  fromBlock: number,
  toBlock: number,
  options: PaginatedLogOptions = {}
): Promise<any[]> {
  const pageSize = options.pageSize ?? DEFAULT_LOG_PAGE_BLOCKS;
  const concurrency = Math.max(
    1,
    options.concurrency ?? MAX_CONCURRENT_LOG_PAGES
  );
  const perPageTimeoutMs =
    options.perPageTimeoutMs ?? DEFAULT_OPERATION_TIMEOUT_MS;

  if (
    !Number.isFinite(fromBlock) ||
    !Number.isFinite(toBlock) ||
    toBlock < fromBlock
  ) {
    throw new QueryShapeError(
      `Invalid block range: fromBlock=${fromBlock}, toBlock=${toBlock}`
    );
  }

  if (pageSize > MAX_LOG_PAGE_BLOCKS || pageSize <= 0) {
    throw new QueryShapeError(
      `Invalid log page size ${pageSize}; expected 1..${MAX_LOG_PAGE_BLOCKS}`
    );
  }

  const totalBlocks = toBlock - fromBlock + 1;
  const totalPages = Math.ceil(totalBlocks / pageSize);

  const pages = Array.from({ length: totalPages }, (_, index) => {
    const pageFrom = fromBlock + index * pageSize;
    return {
      index,
      fromBlock: pageFrom,
      toBlock: Math.min(pageFrom + pageSize - 1, toBlock),
    };
  });

  const results: any[][] = new Array(totalPages);
  let nextPage = 0;
  let done = 0;
  let failed: any = null;

  const fetchPage = async (page: (typeof pages)[number]): Promise<any[]> => {
    let lastError: any;

    for (let attempt = 1; attempt <= LOG_PAGE_ATTEMPTS; attempt += 1) {
      if (attempt === LOG_PAGE_ATTEMPTS) {
        // Final attempt: try a different endpoint.
        switchToNextRpc(true);
      }

      try {
        return await executeWithRpcFallback(
          async (web3) => {
            const contract = contractFactory(web3);
            return contract.getPastEvents(eventName, {
              fromBlock: page.fromBlock,
              toBlock: page.toBlock,
            });
          },
          1,
          perPageTimeoutMs
        );
      } catch (error: any) {
        lastError = error;

        // Deterministic failures must not be retried or blamed on the RPC.
        if (isQueryShapeError(error) || isContractError(error)) {
          throw error;
        }

        if (attempt < LOG_PAGE_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              LOG_PAGE_RETRY_DELAY_MS + Math.floor(Math.random() * 200)
            )
          );
        }
      }
    }

    throw lastError;
  };

  const worker = async () => {
    while (!failed && nextPage < pages.length) {
      const page = pages[nextPage];
      nextPage += 1;

      // Yield so React work and timers are not starved while a sweep is
      // running (validator loading is the usual offender).
      await new Promise((resolve) => setTimeout(resolve, 0));

      await acquireLogPageSlot();
      try {
        results[page.index] = await fetchPage(page);
      } catch (error) {
        // Stop scheduling new pages; in-flight ones finish on their own.
        failed = error;
        throw error;
      } finally {
        releaseLogPageSlot();
      }

      done += 1;
      options.onProgress?.({
        done,
        total: totalPages,
        fromBlock: page.fromBlock,
        toBlock: page.toBlock,
      });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pages.length) }, () => worker())
  );

  return results.flat();
}

export function createWeb3(provider?: any) {
  return new Web3(provider || (window.ethereum as any) || Web3.givenProvider);
}

function createWeb3Provider(rpcUrl: string) {
  const useWebsocket = rpcUrl.startsWith('wss');
  return useWebsocket
    ? new Web3.providers.WebsocketProvider(rpcUrl, {
        timeout: PROVIDER_TIMEOUT_MS,
        clientConfig: { keepalive: true, keepaliveInterval: 60_000 },
        reconnect: { auto: false, delay: 5_000, maxAttempts: 1 },
      })
    : new Web3.providers.HttpProvider(rpcUrl, {
        timeout: PROVIDER_TIMEOUT_MS,
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
