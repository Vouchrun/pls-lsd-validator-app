import { ValidatorEjectionStatusType } from 'interfaces/common';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';
import {
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
} from 'config/contractAbi';
import { getWithdrawContractDeploymentBlock } from 'config/env';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import { fetchWithBeaconFallback } from 'utils/beaconUtils';

const findStatus = (status: string) => {
  if (
    status === 'active_exiting' ||
    status === 'exited_unslashed' ||
    status === 'exited_unfinalized' ||
    status === 'withdrawal_possible' ||
    status === 'active_pending_exit'
  ) {
    return 'Exiting';
  } else if (status === 'active_ongoing' || status === 'active_slashed') {
    return 'Delayed';
  } else if (status === 'withdrawal_done') {
    return 'Withdrawn';
  } else {
    return 'Unknown';
  }
};

const findStatusSymbol = (status: string) => {
  if (
    status === 'active_exiting' ||
    status === 'exited_unslashed' ||
    status === 'exited_unfinalized' ||
    status === 'withdrawal_possible' ||
    status === 'active_pending_exit'
  ) {
    return '🟡';
  } else if (status === 'active_ongoing' || status === 'active_slashed') {
    return '🔴';
  } else if (status === 'withdrawal_done') {
    return '🟢';
  } else {
    return 'Unknown';
  }
};

// Add cache outside the hook to share across hook instances
const dataCache = {
  data: null as any[] | null,
  lastFetchTimestamp: 0,
  isFetching: false,
};

export const useValidatorEjectionData = (
  validatorStatusFilters?: ValidatorEjectionStatusType[],
  nodeEjectionAddress?: string
) => {
  const [allValidatorData, setAllValidatorData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMounted = useRef(true);

  // Remove memoized web3 and contracts to ensure fresh instance on fallback
  // const web3 = useMemo(() => getEthWeb3(), []);

  // Function to check if cache is still valid (e.g., within 5 minutes)
  const isCacheValid = () => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (
      dataCache.data !== null &&
      Date.now() - dataCache.lastFetchTimestamp < CACHE_DURATION
    );
  };

  const processValidator = async (
    validatorId: string, 
    timeStamp: number,
    networkDepositContract: any
  ) => {
    try {
      const res = await fetchWithBeaconFallback(
        `/eth/v1/beacon/states/head/validators?id=${validatorId}`,
        {
          method: 'GET',
          headers: {},
        }
      );

      const status = findStatus(res?.data[0]?.status);
      const statusSymbol = findStatusSymbol(res?.data[0]?.status);
      const poolAddress = res?.data[0]?.validator?.pubkey;

      const pubkeyInfoOf = await networkDepositContract.methods
        .pubkeyInfoOf(poolAddress)
        .call()
        .catch((err: any) => {
          console.log({ err });
          return null;
        });

      if (!pubkeyInfoOf) return null;

      const nodeAddress = pubkeyInfoOf._owner;
      if (nodeEjectionAddress ? nodeEjectionAddress === nodeAddress : true) {
        return {
          timeStamp: timeStamp * 1000,
          poolAddress: poolAddress,
          nodeAddress: nodeAddress,
          status: status,
          statusSymbol: statusSymbol,
        };
      }
      return null;
    } catch (error) {
      console.error('Error processing validator:', error);
      return null;
    }
  };

  const getData = async () => {
    // If data is being fetched by another instance, wait for it
    if (dataCache.isFetching) {
      const waitForCache = async () => {
        while (dataCache.isFetching) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (isMounted.current && dataCache.data) {
          setAllValidatorData(dataCache.data);
          setIsLoading(false);
        }
      };
      waitForCache();
      return;
    }

    // If cache is valid, use cached data
    if (isCacheValid()) {
      setAllValidatorData(dataCache.data || []);
      setIsLoading(false);
      return;
    }

    try {
      dataCache.isFetching = true;
      setIsLoading(true);

      await executeWithRpcFallback(async (web3) => {
        const networkWithdrawContract = new web3.eth.Contract(
          getNetworkWithdrawContractAbi(),
          getNetworkWithdrawContract(),
          {}
        );
        
        const networkDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {}
        );

        const currentBlock = await web3.eth.getBlockNumber();
        const events = await networkWithdrawContract.getPastEvents(
          'NotifyValidatorExit',
          {
            fromBlock: Math.max(
              getWithdrawContractDeploymentBlock(),
              currentBlock - 1555200 // 180 days at 10s per block
            ),
            toBlock: currentBlock,
          }
        );

        let allData: any[] = [];

        // Process events sequentially
        for (const event of events) {
          const block = await web3.eth.getBlock(event.blockNumber);
          const timeStamp = Number(block.timestamp);
          const validators = event?.returnValues?.ejectedValidators || [];

          // For first event, process first 10 validators immediately
          if (allData.length === 0 && validators.length > 0) {
            const firstBatch = validators.slice(0, 10);
            const remainingBatch = validators.slice(10);

            // Process first batch
            const firstBatchResults = await Promise.all(
              firstBatch.map((vid: string) => processValidator(vid, timeStamp, networkDepositContract))
            );

            const validResults = firstBatchResults.filter(
              (item) => item !== null
            );
            if (validResults.length > 0) {
              allData = [...allData, ...validResults];
              allData.sort((a, b) => b.timeStamp - a.timeStamp);
              setAllValidatorData(allData);
              setIsLoading(false);
            }

            // Process remaining validators if any
            if (remainingBatch.length > 0) {
              setIsLoadingMore(true);
              const remainingResults = await Promise.all(
                remainingBatch.map((vid: string) =>
                  processValidator(vid, timeStamp, networkDepositContract)
                )
              );
              const validRemainingResults = remainingResults.filter(
                (item) => item !== null
              );
              if (validRemainingResults.length > 0) {
                allData = [...allData, ...validRemainingResults];
                allData.sort((a, b) => b.timeStamp - a.timeStamp);
                setAllValidatorData(allData);
              }
            }
          } else {
            // Process subsequent events
            setIsLoadingMore(true);
            const results = await Promise.all(
              validators.map((vid: string) => processValidator(vid, timeStamp, networkDepositContract))
            );
            const validResults = results.filter((item) => item !== null);
            if (validResults.length > 0) {
              allData = [...allData, ...validResults];
              allData.sort((a, b) => b.timeStamp - a.timeStamp);
              setAllValidatorData(allData);
            }
          }
        }

        // Update cache
        dataCache.data = allData;
        dataCache.lastFetchTimestamp = Date.now();
      });

    } catch (error) {
      console.error('Error fetching validator data:', error);
    } finally {
      dataCache.isFetching = false;
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    getData();
  }, [nodeEjectionAddress]);

  // Filter data based on status filters
  const filteredData = useMemo(() => {
    if (!validatorStatusFilters || validatorStatusFilters.length === 0) {
      return allValidatorData;
    }

    return allValidatorData.filter((item) => {
      const isExit = item.status === 'Withdrawn';
      const isPending = item.status === 'Exiting';
      const isDelayed = item.status === 'Delayed';
      const isOthers = !isDelayed && !isPending && !isExit;

      return (
        (isDelayed &&
          validatorStatusFilters.includes(
            ValidatorEjectionStatusType.Delayed
          )) ||
        (isPending &&
          validatorStatusFilters.includes(
            ValidatorEjectionStatusType.Exiting
          )) ||
        (isExit &&
          validatorStatusFilters.includes(
            ValidatorEjectionStatusType.Withdrawn
          )) ||
        (isOthers &&
          validatorStatusFilters.includes(ValidatorEjectionStatusType.Others))
      );
    });
  }, [allValidatorData, validatorStatusFilters]);

  // Calculate counts based on all data
  const counts = useMemo(() => {
    const result = {
      total: filteredData.length,
      delayed: 0,
      pending: 0,
      exited: 0,
      others: 0,
    };

    filteredData.forEach((item) => {
      const isExit = item.status === 'Withdrawn';
      const isPending = item.status === 'Exiting';
      const isDelayed = item.status === 'Delayed';

      if (isDelayed) result.delayed++;
      else if (isPending) result.pending++;
      else if (isExit) result.exited++;
      else result.others++;
    });

    return result;
  }, [filteredData]);

  const showEmptyContent = useMemo(() => {
    return filteredData.length === 0 && !isLoading;
  }, [filteredData, isLoading]);

  return {
    showLoading: isLoading,
    showEmptyContent,
    isLoadingMore,
    totalCount: counts.total,
    othersCount: counts.others,
    pendingCount: counts.pending,
    delayedCount: counts.delayed,
    exitedCount: counts.exited,
    validatorElectionData: filteredData,
  };
};
