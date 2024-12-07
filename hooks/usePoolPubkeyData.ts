import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import { ChainPubkeyStatus } from 'interfaces/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPubkeyStatus } from 'utils/apiUtils';
import { getEthWeb3 } from 'utils/web3Utils';

const CACHE_KEY = 'matchedValidatorsData';

interface CachedValidatorData {
  matchedValidators: string;
  timestamp: number;
  nodes: string[];
  trustNodePubkeyNumberLimit: string;
}

const storage = {
  get: (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('Local storage access error:', e);
        return null;
      }
    }
    return null;
  },
  set: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('Local storage access error:', e);
      }
    }
  },
};

export function usePoolPubkeyData() {
  const [matchedValidators, setMatchedValidators] = useState<any>();
  const [nodes, setNodes] = useState<any>([]);
  const [trustNodePubkeyNumberLimit, setTrustNodePubkeyNumberLimit] =
    useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const web3 = getEthWeb3();

  const nodeDepositContract = useMemo(
    () =>
      new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {}
      ),
    [web3]
  );

  // Set isClient to true when component mounts on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  let isSettingNodes = false;

  const updateMatchedValidators = useCallback(async () => {
    if (!nodeDepositContract) {
      return 0;
    }

    try {
      setIsLoading(true);

      // Only check cache on client side
      if (isClient) {
        const cached = storage.get(CACHE_KEY);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached) as CachedValidatorData;
            // Use cache if it's less than 5 minutes old
            if (Date.now() - parsedCache.timestamp < 5 * 60 * 1000) {
              setMatchedValidators(parsedCache.matchedValidators);
              setNodes(parsedCache.nodes);
              setTrustNodePubkeyNumberLimit(
                parsedCache.trustNodePubkeyNumberLimit
              );
              setIsLoading(false);
              return parseInt(parsedCache.matchedValidators);
            }
          } catch (e) {
            console.error('Cache parsing error:', e);
          }
        }
      }

      // If cache is invalid or expired, fetch fresh data
      const [nodesLength, trustNodeLimit] = await Promise.all([
        nodeDepositContract.methods.getNodesLength().call(),
        nodeDepositContract.methods.trustNodePubkeyNumberLimit().call(),
      ]);

      const nodesValue = await nodeDepositContract.methods
        .getNodes(0, nodesLength)
        .call();

      // Get pubkeys for all nodes
      const pubkeyAddressList: string[] = [];
      await Promise.all(
        nodesValue.map(async (nodeAddress: string) => {
          const pubkeys = await nodeDepositContract.methods
            .getPubkeysOfNode(nodeAddress)
            .call();
          pubkeyAddressList.push(...pubkeys);
        })
      );

      // Get pubkey info and beacon status in parallel
      const [pubkeyInfos, beaconStatusResponses] = await Promise.all([
        Promise.all(
          pubkeyAddressList.map((pubkeyAddress) =>
            nodeDepositContract.methods.pubkeyInfoOf(pubkeyAddress).call()
          )
        ),
        fetchBeaconStatusInChunks(pubkeyAddressList),
      ]);

      const beaconStatusData = beaconStatusResponses.flatMap(
        (response) => response.data
      );

      // Calculate matched validators
      const validValidatorCount = pubkeyInfos.filter((item, index) => {
        const beaconStatus = beaconStatusData
          .find(
            (statusItem: any) =>
              statusItem.validator?.pubkey === pubkeyAddressList[index]
          )
          ?.status?.toUpperCase();

        const isExited = [
          'EXITED_UNSLASHED',
          'EXITED_SLASHED',
          'EXITED',
        ].includes(beaconStatus ?? '');

        return (
          item._status === ChainPubkeyStatus.Staked &&
          (isExited || (!isExited && beaconStatus !== undefined))
        );
      }).length;

      // Cache the new data only on client side
      if (isClient) {
        const cacheData: CachedValidatorData = {
          matchedValidators: validValidatorCount.toString(),
          nodes: nodesValue,
          trustNodePubkeyNumberLimit: trustNodeLimit,
          timestamp: Date.now(),
        };
        storage.set(CACHE_KEY, JSON.stringify(cacheData));
      }

      // Update state
      setMatchedValidators(validValidatorCount.toString());
      setNodes(nodesValue);
      setTrustNodePubkeyNumberLimit(trustNodeLimit);

      return validValidatorCount;
    } catch (err: any) {
      console.error('Error in updateMatchedValidators:', err);
      return parseInt(matchedValidators) || 0;
    } finally {
      setIsLoading(false);
    }
  }, [nodeDepositContract, matchedValidators, isClient]);

  const fetchBeaconStatusInChunks = async (pubkeyAddressList: string[]) => {
    const chunkSize = 100;
    const beaconStatusResponses = [];

    for (let i = 0; i < pubkeyAddressList.length; i += chunkSize) {
      const chunk = pubkeyAddressList.slice(i, i + chunkSize);
      const response = await fetchPubkeyStatus(chunk.join(','));
      beaconStatusResponses.push(response);
    }

    return beaconStatusResponses;
  };

  useEffect(() => {
    if (isClient) {
      updateMatchedValidators();
      const interval = setInterval(updateMatchedValidators, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [updateMatchedValidators, isClient]);

  return {
    matchedValidators,
    trustNodePubkeyNumberLimit,
    nodes,
    isLoading,
    updateMatchedValidators,
  };
}
