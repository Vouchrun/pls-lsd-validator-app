import appConfig from './appConf/app.json';
import appDevConfig from './appConf/dev.json';
import appProdConfig from './appConf/prod.json';
import { getLsdEthTokenContract } from './contract';

export function isDev() {
  return process.env.NEXT_PUBLIC_ENV !== 'production';
}

export function getEthereumChainId() {
  if (isDev()) {
    return appDevConfig.chain.id;
  }
  return appProdConfig.chain.id;
}

export function getEthereumChainName() {
  if (isDev()) {
    return appDevConfig.chain.name;
  }
  return appProdConfig.chain.name;
}

export function getNetworkName() {
  if (isDev()) {
    return appDevConfig.chain.networkName;
  }
  return appProdConfig.chain.networkName;
}

// Cache for working RPC
let cachedWorkingRpc: string | null = null;
let lastRpcCheckTime = 0;
const RPC_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cache for working Beacon RPC
let cachedWorkingBeaconRpc: string | null = null;
let lastBeaconRpcCheckTime = 0;
const BEACON_RPC_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Test if RPC is accessible
async function testRpcHealth(rpcUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(rpcUrl, {
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
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Test if Beacon RPC is accessible
async function testBeaconRpcHealth(beaconUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${beaconUrl}/eth/v1/beacon/states/head/finality_checkpoints`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Get array of RPC URLs based on environment
function getRpcList(): string[] {
  const rpcConfig = isDev() ? appDevConfig.rpc : appProdConfig.rpc;
  return Array.isArray(rpcConfig) ? rpcConfig : [rpcConfig];
}

// Get all RPC URLs for wagmi/public use
// Custom RPC has priority and will be tried first if set
export function getAllRpcUrls(): string[] {
  const defaultRpcList = getRpcList();
  
  // Check for custom RPC in localStorage
  if (typeof window !== 'undefined') {
    const customRpc = window.localStorage.getItem('eth_lsd_custom_rpc');
    if (customRpc && customRpc.trim()) {
      // Prepend custom RPC to the list so it's tried first
      return [customRpc, ...defaultRpcList];
    }
  }
  
  return defaultRpcList;
}

// Find first working RPC from the list
export async function getWorkingRpc(): Promise<string> {
  const rpcList = getRpcList();

  // Return cached RPC if still valid
  const now = Date.now();
  if (cachedWorkingRpc && now - lastRpcCheckTime < RPC_CHECK_INTERVAL) {
    return cachedWorkingRpc;
  }

  // Test RPCs in order
  for (const rpc of rpcList) {
    const isHealthy = await testRpcHealth(rpc);
    if (isHealthy) {
      cachedWorkingRpc = rpc;
      lastRpcCheckTime = now;
      return rpc;
    }
  }

  // If all fail, return the first one as fallback
  console.warn(
    'All RPC endpoints failed health check, using first RPC as fallback'
  );
  return rpcList[0];
}

// Get array of Beacon RPC URLs based on environment
function getBeaconRpcList(): string[] {
  const beaconConfig = isDev() ? appDevConfig.beaconRPC : appProdConfig.beaconRPC;
  return Array.isArray(beaconConfig) ? beaconConfig : [beaconConfig];
}

// Get all Beacon RPC URLs for public use
export function getAllBeaconRpcUrls(): string[] {
  return getBeaconRpcList();
}

// Find first working Beacon RPC from the list
export async function getWorkingBeaconRpc(): Promise<string> {
  const beaconRpcList = getBeaconRpcList();

  // Return cached Beacon RPC if still valid
  const now = Date.now();
  if (cachedWorkingBeaconRpc && now - lastBeaconRpcCheckTime < BEACON_RPC_CHECK_INTERVAL) {
    return cachedWorkingBeaconRpc;
  }

  // Test Beacon RPCs in order
  for (const beaconRpc of beaconRpcList) {
    const isHealthy = await testBeaconRpcHealth(beaconRpc);
    if (isHealthy) {
      cachedWorkingBeaconRpc = beaconRpc;
      lastBeaconRpcCheckTime = now;
      return beaconRpc;
    }
  }

  // If all fail, return the first one as fallback
  console.warn(
    'All Beacon RPC endpoints failed health check, using first Beacon RPC as fallback'
  );
  return beaconRpcList[0];
}

export function getEthereumRpc(): string {
  if (typeof window !== 'undefined') {
    const customRpc = window.localStorage.getItem('eth_lsd_custom_rpc');
    if (customRpc) {
      return customRpc;
    }
  }

  const rpcConfig = isDev() ? appDevConfig.rpc : appProdConfig.rpc;
  // Return first RPC from array, or the RPC itself if it's a string
  return Array.isArray(rpcConfig) ? rpcConfig[0] : rpcConfig;
}

export function getExplorerUrl() {
  if (isDev()) {
    return appDevConfig.explorer;
  }
  return appProdConfig.explorer;
}

export function getValidatorExplorerUrl() {
  if (isDev()) {
    return appDevConfig.validatorExplorer;
  }
  return appProdConfig.validatorExplorer;
}

export function getBeaconHost() {
  const beaconConfig = isDev() ? appDevConfig.beaconRPC : appProdConfig.beaconRPC;
  // Return first Beacon RPC from array, or the Beacon RPC itself if it's a string
  return Array.isArray(beaconConfig) ? beaconConfig[0] : beaconConfig;
}

export function getLsdEthMetamaskParam() {
  return {
    tokenAddress: getLsdEthTokenContract(),
    tokenSymbol: appConfig.token.lsdTokenName,
    tokenDecimals: 18,
    tokenImage: appConfig.token.lsdTokenIconUri,
  };
}

export function getLsdAppUrl() {
  if (isDev()) {
    return appDevConfig.lsdAppUrl;
  }
  return appProdConfig.lsdAppUrl;
}

export function getValidatorTotalDepositAmount() {
  return appConfig.validatorTotalDepositAmount;
}

export function getTrustValidatorDepositAmount() {
  return appConfig.trustValidatorDepositAmount;
}

export function getBlockSeconds() {
  if (isDev()) {
    return appDevConfig.blockSeconds;
  }
  return appProdConfig.blockSeconds;
}

export function getValidatorInfoURL() {
  if (isDev()) {
    return appDevConfig.ValidatorInfoURL;
  }
  return appProdConfig.ValidatorInfoURL;
}

export function getExplorerAPIURL() {
  if (isDev()) {
    return appDevConfig.explorerAPIURL;
  }
  return appProdConfig.explorerAPIURL;
}

export function getWithdrawContractDeploymentBlock() {
  if (isDev()) {
    return appDevConfig.withdrawContractDeploymentBlock;
  }
  return appProdConfig.withdrawContractDeploymentBlock;
}

export function getNetworkBalanceContractDeploymentBlock() {
  if (isDev()) {
    return appDevConfig.networkBalanceContractDeploymentBlock;
  }
  return appProdConfig.networkBalanceContractDeploymentBlock;
}

export function getWagmiChainConfig() {
  const allRpcUrls = getAllRpcUrls();
  
  return {
    id: getEthereumChainId(),
    name: getEthereumChainName(),
    network: getEthereumChainName(),
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: allRpcUrls,
      },
      public: {
        http: allRpcUrls,
      },
    },
    blockExplorers: {
      etherscan: {
        name: '',
        url: getExplorerUrl(),
      },
      default: {
        name: '',
        url: getExplorerUrl(),
      },
    },
    contracts: {},
    testnet: isDev(),
  };
}
