import { ValidatorEjectionStatusType } from 'interfaces/common';
import { useEffect, useMemo, useState } from 'react';
import {
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';
import {
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
} from 'config/contractAbi';
import { getWithdrawContractDeploymentBlock, getBeaconHost } from 'config/env';
import { getEthWeb3 } from 'utils/web3Utils';

const findStatus = (status: string) => {
  if (status === 'withdrawal_done') {
    return 'Exited';
  } else if (status === 'active_exiting') {
    return 'Pending';
  } else if (status === 'active_ongoing') {
    return 'Delayed';
  } else {
    return 'Unknown';
  }
};

const findStatusSymbol = (status: string) => {
  if (status === 'withdrawal_done') {
    return '🟢';
  } else if (status === 'active_exiting') {
    return '🟡';
  } else if (status === 'active_ongoing') {
    return '🔴';
  } else {
    return 'Unknown';
  }
};

export const useValidatorEjectionData = (
  validatorStatusFilters?: ValidatorEjectionStatusType[]
) => {
  const [totalCount, setTotalCount] = useState<number>();

  const [exitedCount, setExitedCount] = useState<number>();
  const [pendingCount, setPendingCount] = useState<number>();
  const [delayedCount, setDelayedCount] = useState<number>();
  const [othersCount, setOthersCount] = useState<number>();

  const [validatorElectionData, setValidatorElectionData] = useState<any>([]);

  const web3 = getEthWeb3();
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

  const getData = async () => {
    const currentBlock = await web3.eth.getBlockNumber();
    const events = await networkWithdrawContract.getPastEvents(
      'NotifyValidatorExit',
      {
        fromBlock: getWithdrawContractDeploymentBlock(),
        toBlock: currentBlock,
      }
    );

    let delayedCount = 0;
    let pendingCount = 0;
    let exitedCount = 0;
    let othersCount = 0;
    const data: any = [];

    events.forEach(async (event: any) => {
      const block = await web3.eth.getBlock(event.blockNumber);
      const timeStamp = block.timestamp;

      const response = await fetch(
        `${getBeaconHost()}/eth/v1/beacon/states/head/validators?id=` +
          event?.returnValues?.ejectedValidators[0],
        {
          method: 'GET',
          headers: {},
        }
      );

      const res = await response.json();

      const status = findStatus(res?.data[0]?.status);
      const statusSymbol = findStatusSymbol(res?.data[0]?.status);

      const isExit = findStatus(res?.data[0]?.status) === 'Exited';
      const isPending = findStatus(res?.data[0]?.status) === 'Pending';
      const isDelayed = findStatus(res?.data[0]?.status) === 'Delayed';
      const isOthers = !isDelayed && !isPending && !isExit;

      const poolAddress = res?.data[0]?.validator?.pubkey;

      const pubkeyInfoOf = await networkDepositContract.methods
        .pubkeyInfoOf(poolAddress)
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      const nodeAddress = pubkeyInfoOf._owner;

      const newItem = {
        timeStamp: +timeStamp * 1000,
        poolAddress: poolAddress,
        nodeAddress: nodeAddress,
        status: status,
        statusSymbol: statusSymbol,
      };

      if (isDelayed) {
        delayedCount++;
        if (
          !validatorStatusFilters ||
          validatorStatusFilters.length === 0 ||
          validatorStatusFilters.indexOf(ValidatorEjectionStatusType.Delayed) >=
            0
        ) {
          data.push(newItem);
        }
      } else if (isPending) {
        pendingCount++;
        if (
          !validatorStatusFilters ||
          validatorStatusFilters.length === 0 ||
          validatorStatusFilters.indexOf(ValidatorEjectionStatusType.Pending) >=
            0
        ) {
          data.push(newItem);
        }
      } else if (isExit) {
        exitedCount++;
        if (
          !validatorStatusFilters ||
          validatorStatusFilters.length === 0 ||
          validatorStatusFilters.indexOf(ValidatorEjectionStatusType.Exited) >=
            0
        ) {
          data.push(newItem);
        }
      } else {
        othersCount++;
        if (
          !validatorStatusFilters ||
          validatorStatusFilters.length === 0 ||
          validatorStatusFilters.indexOf(ValidatorEjectionStatusType.Others) >=
            0
        ) {
          data.push(newItem);
        }
      }

      setDelayedCount(delayedCount);
      setPendingCount(pendingCount);
      setExitedCount(exitedCount);
      setOthersCount(othersCount);
      setTotalCount(data.length);
      setValidatorElectionData(data);
    });
  };
  useEffect(() => {
    setValidatorElectionData([]);
    getData();
  }, [validatorStatusFilters]);

  const showLoading = useMemo(() => {
    return validatorElectionData === undefined;
  }, [validatorElectionData]);

  const showEmptyContent = useMemo(() => {
    return validatorElectionData.length === 0 && !showLoading;
  }, [showLoading, validatorElectionData]);

  return {
    showLoading,
    showEmptyContent,
    totalCount,
    othersCount,
    pendingCount,
    delayedCount,
    exitedCount,
    validatorElectionData,
  };
};
