import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import { ChainPubkeyStatus } from 'interfaces/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBeaconStatusInChunks } from 'utils/apiUtils';
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

      // Process pubkeys in chunks of 100
      const CHUNK_SIZE = 100;
      const pubkeyInfos: any = [];
      // console.log("Processing pubkeys in chunks, total:", pubkeyAddressList.length);

      for (let i = 0; i < pubkeyAddressList.length; i += CHUNK_SIZE) {
        const chunk = pubkeyAddressList.slice(i, i + CHUNK_SIZE);
        const batch = new web3.BatchRequest();
        
        // Create a promise for this batch
        const batchPromise = new Promise((resolve, reject) => {
          const results: any[] = [];
          let completed = 0;
          
          chunk.forEach((pubkeyAddress, index) => {
            const request = nodeDepositContract.methods
              .pubkeyInfoOf(pubkeyAddress)
              .call.request({}, (error: any, result: any) => {
                if (error) {
                  console.error(`Error fetching pubkeyInfo for ${pubkeyAddress}:`, error);
                  results[index] = null; // Maintain order even with errors
                } else {
                  results[index] = result;
                }
                
                completed++;
                if (completed === chunk.length) {
                  resolve(results);
                }
              });
            
            batch.add(request);
          });
          
          // Execute the batch
          try {
            batch.execute();
          } catch (error) {
            reject(error);
          }
        });
        
        // Wait for this batch to complete
        try {
          const batchResults:any = await batchPromise;
          pubkeyInfos.push(...batchResults.filter((result:any) => result !== null));
          // console.log(`Processed chunk ${i/CHUNK_SIZE + 1}/${Math.ceil(pubkeyAddressList.length/CHUNK_SIZE)}`);
        } catch (error) {
          console.error('Batch execution error:', error);
        }
      }

      const [beaconStatusResponses] = await Promise.all([
        fetchBeaconStatusInChunks(pubkeyAddressList),
      ]);
      const beaconStatusData = beaconStatusResponses.flatMap(
        (response) => response.data
      );

      // Calculate matched validators
      const validValidatorCount = pubkeyInfos.filter(
        (item: any, index: number) => {
          const beaconStatus = beaconStatusData
            .find(
              (statusItem: any) =>
                statusItem.validator?.pubkey === pubkeyAddressList[index]
            )
            ?.status?.toUpperCase();

          const isActive = [
            'ACTIVE_ONGOING',
            'ACTIVE_EXITING',
            'ACTIVE_SLASHABLE',
            'PENDING_QUEUED',
          ].includes(beaconStatus ?? '');

          return item?._status === ChainPubkeyStatus.Staked && isActive;
        }
      ).length;

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

  // Initial load effect
  useEffect(() => {
    if (isClient && nodeDepositContract) {
      console.log('Initial load triggered');
      updateMatchedValidators();
    }
  }, [isClient, nodeDepositContract]);

  // Interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isClient && nodeDepositContract) {
      // console.log('Setting up interval');
      interval = setInterval(updateMatchedValidators, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isClient, nodeDepositContract]);

  return {
    matchedValidators,
    trustNodePubkeyNumberLimit,
    nodes,
    isLoading,
    updateMatchedValidators,
  };
}