import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import { ChainPubkeyStatus } from 'interfaces/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBeaconStatusInChunks } from 'utils/apiUtils';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';

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

  // Set isClient to true when component mounts on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateMatchedValidators = useCallback(async () => {
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

      // Use executeWithRpcFallback for robust RPC calls
      await executeWithRpcFallback(async (web3) => {
          const nodeDepositContract = new web3.eth.Contract(
            getNodeDepositContractAbi(),
            getNodeDepositContract(),
            {}
          );

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

          // Fetch beacon statuses and on-chain pubkey infos concurrently.
          // Beacon statuses resolve first and give a fast-path count so the
          // "Staked PLS"/active-validator metric paints quickly; the on-chain
          // _status check then refines it.
          const beaconPromise = fetchBeaconStatusInChunks(
            pubkeyAddressList
          ).then((responses) => responses.flatMap((r) => r.data));

          // Process pubkeyInfoOf in batches of 100, with bounded concurrency,
          // keeping results aligned to pubkeyAddressList indexes
          const CHUNK_SIZE = 100;
          const batches: string[][] = [];
          for (let i = 0; i < pubkeyAddressList.length; i += CHUNK_SIZE) {
            batches.push(pubkeyAddressList.slice(i, i + CHUNK_SIZE));
          }
          const batchResults: any[][] = new Array(batches.length);
          let nextBatch = 0;
          const rpcWorkers = Array.from(
            { length: Math.min(8, batches.length) },
            async () => {
              while (nextBatch < batches.length) {
                const batchIndex = nextBatch++;
                const chunk = batches[batchIndex];
                const batch = new web3.BatchRequest();

                batchResults[batchIndex] = await new Promise((resolve) => {
                  const results: any[] = [];
                  let completed = 0;
                  chunk.forEach((pubkeyAddress, index) => {
                    const request = nodeDepositContract.methods
                      .pubkeyInfoOf(pubkeyAddress)
                      .call.request({}, (error: any, result: any) => {
                        if (error) {
                          console.error(
                            `Error fetching pubkeyInfo for ${pubkeyAddress}:`,
                            error
                          );
                          results[index] = null;
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
                  try {
                    batch.execute();
                  } catch (error) {
                    console.error('Batch execution error:', error);
                    resolve(results);
                  }
                });
              }
            }
          );

          const beaconStatusData = await beaconPromise;

          const isBeaconActive = (pubkeyAddress: string) => {
            const beaconStatus = beaconStatusData
              .find(
                (statusItem: any) =>
                  statusItem.validator?.pubkey === pubkeyAddress
              )
              ?.status?.toUpperCase();
            return [
              'ACTIVE_ONGOING',
              'ACTIVE_EXITING',
              'ACTIVE_SLASHABLE',
              'PENDING_QUEUED',
            ].includes(beaconStatus ?? '');
          };

          // Fast path: every contract pubkey active on the beacon is a
          // matched (staked) validator, so count from beacon data alone
          const fastValidatorCount = pubkeyAddressList.filter((pubkeyAddress) =>
            isBeaconActive(pubkeyAddress)
          ).length;
          setMatchedValidators(fastValidatorCount.toString());

          // Refined count once on-chain statuses arrive
          await Promise.all(rpcWorkers);
          const pubkeyInfos = batchResults.flat();
          const validValidatorCount = pubkeyInfos.filter(
            (item: any, index: number) =>
              item?._status === ChainPubkeyStatus.Staked &&
              isBeaconActive(pubkeyAddressList[index])
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
      });

    } catch (err: any) {
      console.error('Error in updateMatchedValidators:', err);
      return parseInt(matchedValidators) || 0;
    } finally {
      setIsLoading(false);
    }
  }, [matchedValidators, isClient]);

  // Initial load effect
  useEffect(() => {
    if (isClient) {
      console.log('Initial load triggered');
      updateMatchedValidators();
    }
  }, [isClient, updateMatchedValidators]);

  // Interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isClient) {
      interval = setInterval(updateMatchedValidators, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isClient, updateMatchedValidators]);

  return {
    matchedValidators,
    trustNodePubkeyNumberLimit,
    nodes,
    isLoading,
    updateMatchedValidators,
  };
}