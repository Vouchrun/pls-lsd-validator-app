import { fetchWithBeaconFallback } from './beaconUtils';

// Both the validator table and the pool metrics ask for the same pubkey chunks.
// Cache by chunk id (and dedupe in-flight requests) so the second caller reuses
// the first response instead of doubling the beacon load.
const PUBKEY_STATUS_CACHE_TTL_MS = 60_000;
const pubkeyStatusCache = new Map<
  string,
  { timestamp: number; promise: Promise<any> }
>();

export async function fetchPubkeyStatus(id: string) {
  const now = Date.now();
  const cached = pubkeyStatusCache.get(id);
  if (cached && now - cached.timestamp < PUBKEY_STATUS_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = fetchWithBeaconFallback(
    `/eth/v1/beacon/states/head/validators?id=${id}`,
    {
      method: 'GET',
    }
  );

  pubkeyStatusCache.set(id, { timestamp: now, promise });

  try {
    return await promise;
  } catch (error) {
    pubkeyStatusCache.delete(id);
    throw error;
  }
}

export async function fetchBeaconCheckpoints() {
  const resJson = await fetchWithBeaconFallback(
    `/eth/v1/beacon/states/head/finality_checkpoints`,
    {
      method: 'GET',
    }
  );
  return resJson;
}

export const fetchBeaconStatusInChunks = async (
  pubkeyAddressList: string[],
  concurrency = 8
) => {
  const chunkSize = 100;
  const chunks: string[][] = [];
  for (let i = 0; i < pubkeyAddressList.length; i += chunkSize) {
    chunks.push(pubkeyAddressList.slice(i, i + chunkSize));
  }

  // Fetch chunks concurrently (order-preserving) to bound total latency
  const beaconStatusResponses: any[] = new Array(chunks.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, chunks.length) },
    async () => {
      while (next < chunks.length) {
        const index = next++;
        beaconStatusResponses[index] = await fetchPubkeyStatus(
          chunks[index].join(',')
        );
      }
    }
  );
  await Promise.all(workers);

  return beaconStatusResponses;
};
