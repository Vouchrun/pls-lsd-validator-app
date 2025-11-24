import Web3 from 'web3';
import {
  getEthereumRpc,
  getAllRpcUrls,
  getLsdEthMetamaskParam,
} from 'config/env';
import snackbarUtil from './snackbarUtils';
import { AbiItem } from 'web3-utils';
import { STORAGE_KEY_CUSTOM_RPC } from './storageUtils';

declare const window: any;

export function createWeb3(provider?: any) {
  return new Web3(provider || (window.ethereum as any) || Web3.givenProvider);
}

let ethWeb3: Web3 | undefined = undefined;
let currentRpcIndex = 0;
let lastRpcFailureTime = 0;
const RPC_FAILURE_COOLDOWN = 30000; // 30 seconds before trying failed RPC again
let customRpcFailureCount = 0;
const MAX_CUSTOM_RPC_FAILURES = 2; // After 2 failures, clear custom RPC
let isInitialized = false;

/**
 * Create Web3 provider with current RPC
 */
function createWeb3Provider(rpcUrl: string) {
  const useWebsocket = rpcUrl.startsWith('wss');
  return useWebsocket
    ? new Web3.providers.WebsocketProvider(rpcUrl)
    : new Web3.providers.HttpProvider(rpcUrl);
}

/**
 * Initialize or reset RPC state
 * This ensures clean state on page refresh or initial load
 * Also tests custom RPC on initialization and clears it if it fails
 */
async function initializeRpcState() {
  if (!isInitialized || !ethWeb3) {
    currentRpcIndex = 0;
    customRpcFailureCount = 0;
    lastRpcFailureTime = 0;
    ethWeb3 = undefined;

    // Test custom RPC on page refresh/initialization
    if (typeof window !== 'undefined') {
      const customRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
      if (customRpc) {
        console.log('Testing custom RPC on initialization:', customRpc);
        try {
          // Quick test with 3 second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(customRpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error: any) {
          console.warn(
            'Custom RPC failed on initialization, clearing:',
            error.message
          );
          clearCustomRpc();
        }
      }
    }

    isInitialized = true;
  }
}

/**
 * Reset all RPC state
 * Call this to force a clean reset of the RPC system
 */
export function resetRpcState() {
  console.log('Resetting RPC state...');
  currentRpcIndex = 0;
  customRpcFailureCount = 0;
  lastRpcFailureTime = 0;

  // Cleanup old Web3 instance
  if (ethWeb3 && ethWeb3.currentProvider) {
    try {
      const provider = ethWeb3.currentProvider as any;
      if (provider && typeof provider.disconnect === 'function') {
        provider.disconnect();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  ethWeb3 = undefined;
  isInitialized = false;
}

/**
 * Initialize RPC state and test custom RPC if needed
 * Call this once at app startup
 */
export async function initializeWeb3() {
  await initializeRpcState();
}

/**
 * Get Ethereum web3 instance singleton with RPC fallback
 */
export function getEthWeb3() {
  // Initialize on first call or if web3 is undefined (synchronous fallback)
  if (!isInitialized || !ethWeb3) {
    currentRpcIndex = 0;
    customRpcFailureCount = 0;
    lastRpcFailureTime = 0;
    ethWeb3 = undefined;
    isInitialized = true;
  }

  const rpcList = getAllRpcUrls();
  const rpcLink = rpcList[currentRpcIndex] || getEthereumRpc();

  if (!ethWeb3) {
    ethWeb3 = createWeb3(createWeb3Provider(rpcLink));
  }
  return ethWeb3;
}

/**
 * Clear custom RPC from localStorage and Redux
 */
function clearCustomRpc() {
  if (typeof window !== 'undefined') {
    const customRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
    if (customRpc) {
      console.warn('Clearing failed custom RPC:', customRpc);
      window.localStorage.removeItem(STORAGE_KEY_CUSTOM_RPC);

      // Dispatch event to notify Redux store
      window.dispatchEvent(
        new CustomEvent('customRpcCleared', {
          detail: { reason: 'RPC connection failed', previousRpc: customRpc },
        })
      );

      snackbarUtil.error('Custom RPC failed. Falling back to default RPC.');
    }
  }
}

/**
 * Check if current RPC is a custom RPC
 */
function isCustomRpc(rpcUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  const customRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
  return customRpc === rpcUrl;
}

/**
 * Switch to next RPC in the list and recreate Web3 instance
 */
export function switchToNextRpc(): boolean {
  const rpcList = getAllRpcUrls();
  const now = Date.now();

  // Don't switch too frequently
  if (now - lastRpcFailureTime < RPC_FAILURE_COOLDOWN) {
    return false;
  }

  lastRpcFailureTime = now;
  const currentRpc = rpcList[currentRpcIndex];

  // Track custom RPC failures
  if (isCustomRpc(currentRpc)) {
    customRpcFailureCount++;
    console.warn(
      `Custom RPC failure count: ${customRpcFailureCount}/${MAX_CUSTOM_RPC_FAILURES}`
    );

    // Clear custom RPC after too many failures
    if (customRpcFailureCount >= MAX_CUSTOM_RPC_FAILURES) {
      clearCustomRpc();
      customRpcFailureCount = 0;
      // Reset index to 0 since we cleared custom RPC
      currentRpcIndex = 0;
      const newRpc = getAllRpcUrls()[0]; // Get updated list without custom RPC
      console.warn(`Fallback to default RPC: ${newRpc}`);

      // Cleanup old Web3 instance before creating new one
      if (ethWeb3 && ethWeb3.currentProvider) {
        try {
          const provider = ethWeb3.currentProvider as any;
          if (provider && typeof provider.disconnect === 'function') {
            provider.disconnect();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      ethWeb3 = createWeb3(createWeb3Provider(newRpc));
      return true;
    }
  }

  currentRpcIndex = (currentRpcIndex + 1) % rpcList.length;
  const newRpc = rpcList[currentRpcIndex];

  console.warn(`Switching to RPC: ${newRpc}`);

  // Cleanup old Web3 instance before creating new one
  if (ethWeb3 && ethWeb3.currentProvider) {
    try {
      const provider = ethWeb3.currentProvider as any;
      if (provider && typeof provider.disconnect === 'function') {
        provider.disconnect();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Recreate Web3 instance with new RPC
  ethWeb3 = createWeb3(createWeb3Provider(newRpc));

  return true;
}

/**
 * Reset RPC failure counters (call this on successful operations)
 */
export function resetRpcFailureCounters() {
  customRpcFailureCount = 0;
}

/**
 * Execute Web3 call with automatic RPC fallback on failure
 */
export async function executeWithRpcFallback<T>(
  operation: (web3: Web3) => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;
  let rpcList = getAllRpcUrls();
  const attempts = Math.min(maxRetries, rpcList.length);

  // Ensure currentRpcIndex is valid
  if (currentRpcIndex >= rpcList.length) {
    console.warn(`RPC index ${currentRpcIndex} out of bounds, resetting to 0`);
    currentRpcIndex = 0;
    ethWeb3 = undefined; // Force recreation
  }

  for (let i = 0; i < attempts; i++) {
    try {
      const web3 = getEthWeb3();
      const result = await operation(web3);

      // Reset failure counters on success
      resetRpcFailureCounters();

      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || error.toString();
      console.error(
        `RPC call failed (attempt ${i + 1}/${attempts}):`,
        errorMsg
      );

      // Check for CORS or network errors
      const isCorsError =
        errorMsg.includes('CORS') ||
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('Network request failed');

      const isConnectionError =
        errorMsg.includes('connect') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('ECONNREFUSED');

      if (isCorsError || isConnectionError) {
        console.warn('Detected network/CORS error, attempting fallback...');
      }

      // Try next RPC if available and not last attempt
      if (i < attempts - 1 && rpcList.length > 1) {
        const switched = switchToNextRpc();

        // Refresh RPC list in case custom RPC was cleared
        rpcList = getAllRpcUrls();

        // Ensure currentRpcIndex is valid after switch
        if (currentRpcIndex >= rpcList.length) {
          currentRpcIndex = 0;
          ethWeb3 = undefined; // Force recreation
        }

        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError;
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
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: params.tokenAddress, // The address that the token is at.
            symbol: params.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: params.tokenDecimals, // The number of decimals in the token
            image: params.tokenImage, // A string url of the token logo
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
 * @param data event data
 * @param topics event topics
 * @returns decoded log values
 */
export function decodeBalancesUpdatedLog(data: string, topics: string[]) {
  const web3 = getEthWeb3();
  const values = web3.eth.abi.decodeLog(
    [
      {
        name: 'block',
        type: 'uint256',
      },
      {
        name: 'totalEth',
        type: 'uint256',
      },
      {
        name: 'lsdTokenSupply',
        type: 'uint256',
      },
      {
        name: 'time',
        type: 'uint256',
      },
    ],
    data,
    topics
  );
  return values;
}

/**
 * decode Unstake event log data
 * @param data event data
 * @param topics event topics
 * @returns decoded log values
 */
export function decodeUnstakeLog(data: string, topics: string[]) {
  const web3 = getEthWeb3();
  const values = web3.eth.abi.decodeLog(
    [
      {
        name: 'from',
        type: 'address',
      },
      {
        name: 'lsdTokenAmount',
        type: 'uint256',
      },
      {
        name: 'ethAmount',
        type: 'uint256',
      },
      {
        name: 'withdrawIndex',
        type: 'uint256',
      },
      {
        name: 'instantly',
        type: 'bool',
      },
    ],
    data,
    topics
  );
  return values;
}
