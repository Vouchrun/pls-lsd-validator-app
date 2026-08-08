import { fetchWithBeaconFallback } from './beaconUtils';

export async function fetchPubkeyStatus(id: string) {
  const resJson = await fetchWithBeaconFallback(
    `/eth/v1/beacon/states/head/validators?id=${id}`,
    {
      method: 'GET',
    }
  );
  return resJson;
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
