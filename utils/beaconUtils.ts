import { getAllBeaconRpcUrls } from 'config/env';

// Cache for working Beacon RPC index
let currentBeaconRpcIndex = 0;

/**
 * Executes a fetch request with fallback to other Beacon RPCs if the first one fails.
 * @param path The path to append to the Beacon RPC URL (e.g., '/eth/v1/beacon/states/head/validators')
 * @param options Fetch options (method, headers, body, etc.)
 * @returns The JSON response from the successful fetch
 * @throws Error if all RPCs fail
 */
export async function fetchWithBeaconFallback(
  path: string,
  options?: RequestInit
): Promise<any> {
  const beaconRpcUrls = getAllBeaconRpcUrls();
  
  if (!beaconRpcUrls || beaconRpcUrls.length === 0) {
    throw new Error('No Beacon RPC URLs configured');
  }

  // Start from the last known working index
  let startIndex = currentBeaconRpcIndex;
  
  // If index is out of bounds (e.g. config changed), reset to 0
  if (startIndex >= beaconRpcUrls.length) {
    startIndex = 0;
    currentBeaconRpcIndex = 0;
  }

  // Try RPCs starting from the current index, then wrap around
  for (let i = 0; i < beaconRpcUrls.length; i++) {
    const index = (startIndex + i) % beaconRpcUrls.length;
    const rpcUrl = beaconRpcUrls[index];
    
    // Ensure path starts with / if not present
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${rpcUrl}${normalizedPath}`;

    try {
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // If successful, update the current working index
      if (index !== currentBeaconRpcIndex) {
        currentBeaconRpcIndex = index;
        console.log(`Switched to Beacon RPC: ${rpcUrl}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Beacon RPC failed: ${rpcUrl}`, error);
      // Continue to next RPC
    }
  }

  throw new Error('All Beacon RPCs failed');
}
