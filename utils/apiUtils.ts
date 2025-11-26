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
  pubkeyAddressList: string[]
) => {
  const chunkSize = 100;
  const beaconStatusResponses = [];

  for (let i = 0; i < pubkeyAddressList.length; i += chunkSize) {
    const chunk = pubkeyAddressList.slice(i, i + chunkSize);
    const response = await fetchPubkeyStatus(chunk.join(','));
    beaconStatusResponses.push(response);
  }

  return beaconStatusResponses;
};
