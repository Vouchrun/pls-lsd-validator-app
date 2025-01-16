import { getBeaconHost } from 'config/env';

export async function fetchPubkeyStatus(id: string) {
  const response = await fetch(
    `${getBeaconHost()}/eth/v1/beacon/states/head/validators\?id=${id}`,
    {
      method: 'GET',
    }
  );
  const resJson = await response.json();
  return resJson;
}

export async function fetchBeaconCheckpoints() {
  const response = await fetch(
    `${getBeaconHost()}/eth/v1/beacon/states/head/finality_checkpoints`,
    {
      method: 'GET',
    }
  );
  const resJson = await response.json();
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
