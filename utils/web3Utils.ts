import Web3 from 'web3';
import { getEthereumRpc, getAllRpcUrls, getLsdEthMetamaskParam } from 'config/env';
import snackbarUtil from './snackbarUtils';
import { AbiItem } from 'web3-utils';

declare const window: any;

export function createWeb3(provider?: any) {
  return new Web3(provider || (window.ethereum as any) || Web3.givenProvider);
}

const STORAGE_KEY_WORKING_RPC_INDEX = 'working_rpc_index';

let ethWeb3: Web3 | undefined = undefined;
let currentRpcIndex = 0;

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  const savedIndex = window.localStorage.getItem(STORAGE_KEY_WORKING_RPC_INDEX);
  if (savedIndex) {
    currentRpcIndex = parseInt(savedIndex, 10);
    // Validate index
    const rpcList = getAllRpcUrls();
    if (currentRpcIndex >= rpcList.length || currentRpcIndex < 0) {
      currentRpcIndex = 0;
    }
  }
}

let lastRpcFailureTime = 0;
const RPC_FAILURE_COOLDOWN = 30000; // 30 seconds before trying failed RPC again

/**
 * Create Web3 provider with current RPC with error handling
 */
function createWeb3Provider(rpcUrl: string) {
  const useWebsocket = rpcUrl.startsWith('wss');
  const provider = useWebsocket
    ? new Web3.providers.WebsocketProvider(rpcUrl, {
        timeout: 5000, // Reduced to 5s
        clientConfig: {
          keepalive: true,
          keepaliveInterval: 60000,
        },
        reconnect: {
          auto: false, // Disable auto-reconnect to fail fast
          delay: 5000,
          maxAttempts: 1,
        },
      })
    : new Web3.providers.HttpProvider(rpcUrl, {
        timeout: 5000, // Reduced to 5s
        keepAlive: false,
      });
  
  return provider;
}

/**
 * Get Ethereum web3 instance singleton with RPC fallback
 */
export function getEthWeb3() {
  const rpcList = getAllRpcUrls();
  
  if (!ethWeb3) {
    // Try to create Web3 with current RPC, if fails, try next ones
    let attempts = 0;
    while (attempts < rpcList.length) {
      try {
        const rpcLink = rpcList[currentRpcIndex];
        ethWeb3 = createWeb3(createWeb3Provider(rpcLink));
        break; // Success
      } catch (error) {
        console.warn(`Failed to create Web3 instance with RPC ${rpcList[currentRpcIndex]}:`, error);
        
        // If custom RPC failed (index 0 and custom RPC exists), remove it
        if (currentRpcIndex === 0 && typeof window !== 'undefined' && window.localStorage.getItem('eth_lsd_custom_rpc')) {
           window.localStorage.removeItem('eth_lsd_custom_rpc');
        }

        // Try next RPC
        currentRpcIndex = (currentRpcIndex + 1) % rpcList.length;
        // Save new index
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY_WORKING_RPC_INDEX, currentRpcIndex.toString());
        }
        attempts++;
      }
    }

    // If all failed, just try to create with the current one (will likely fail again but we need an instance)
    if (!ethWeb3) {
       const rpcLink = rpcList[currentRpcIndex] || getEthereumRpc();
       ethWeb3 = createWeb3(createWeb3Provider(rpcLink));
    }
  }
  return ethWeb3;
}

// Event listeners for RPC changes
type RpcChangeListener = (rpc: string) => void;
const rpcChangeListeners: RpcChangeListener[] = [];

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
  rpcChangeListeners.forEach(listener => listener(newRpc));
}

/**
 * Get the currently active working RPC URL
 */
export function getCurrentWorkingRpc(): string {
  const rpcList = getAllRpcUrls();
  return rpcList[currentRpcIndex] || rpcList[0];
}

/**
 * Switch to next RPC in the list and recreate Web3 instance
 */
export function switchToNextRpc(force: boolean = false): boolean {
  const rpcList = getAllRpcUrls();
  const now = Date.now();
  
  // Don't switch too frequently unless forced
  if (!force && now - lastRpcFailureTime < RPC_FAILURE_COOLDOWN) {
    return false;
  }
  
  lastRpcFailureTime = now;
  currentRpcIndex = (currentRpcIndex + 1) % rpcList.length;
  
  // Save new index
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_WORKING_RPC_INDEX, currentRpcIndex.toString());
  }

  const newRpc = rpcList[currentRpcIndex];
  
  console.warn(`Switching to RPC: ${newRpc}`);
  notifyRpcChange(newRpc);
  
  // Recreate Web3 instance with new RPC
  try {
      ethWeb3 = createWeb3(createWeb3Provider(newRpc));
  } catch (e) {
      console.error("Failed to switch RPC provider", e);
      // If immediate creation fails, try next one recursively (prevent infinite loop with max depth?)
      // For now, just let the next call handle it
  }
  
  return true;
}

/**
 * Execute Web3 call with automatic RPC fallback on failure
 */
export async function executeWithRpcFallback<T>(
  operation: (web3: Web3) => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;
  const rpcList = getAllRpcUrls();
  const attempts = Math.min(maxRetries, rpcList.length);
  
  for (let i = 0; i < attempts; i++) {
    try {
      const web3 = getEthWeb3();
      const result = await operation(web3);
      
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`RPC call failed (attempt ${i + 1}/${attempts}):`, error.message);
      
      // Try next RPC if available and not last attempt
      if (i < attempts - 1 && rpcList.length > 1) {
        switchToNextRpc(true);
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
