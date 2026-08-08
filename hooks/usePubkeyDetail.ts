import {
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';
import {
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
} from 'config/contractAbi';
import { getBlockSeconds } from 'config/env';
import { NodePubkeyInfo } from 'interfaces/common';
import { useCallback, useEffect, useState } from 'react';
import { fetchBeaconCheckpoints, fetchPubkeyStatus } from 'utils/apiUtils';
import { getPubkeyDisplayStatus } from 'utils/commonUtils';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import Web3 from 'web3';
import { useUnmatchedToken } from './useUnmatchedToken';
import { useWalletAccount } from './useWalletAccount';

export function usePubkeyDetail(pubkeyAddress: string | undefined) {
  const { metaMaskAccount } = useWalletAccount();
  const { unmatchedEth } = useUnmatchedToken();

  const [pubkeyInfo, setPubkeyInfo] = useState<NodePubkeyInfo>();

  const updateData = useCallback(async () => {
    if (!pubkeyAddress) {
      return;
    }

    try {
      const pubkeyInfo = await executeWithRpcFallback(async (web3) => {
        const nodeDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {
            from: metaMaskAccount,
          }
        );

        const info = await nodeDepositContract.methods
          .pubkeyInfoOf(pubkeyAddress)
          .call();
        return info;
      });

      const beaconStatusResJson = await fetchPubkeyStatus(pubkeyAddress);

      const matchedBeaconData = beaconStatusResJson.data?.find(
        (item: any) => item.validator?.pubkey === pubkeyAddress
      );

      const beaconApiStatus =
        matchedBeaconData?.status?.toUpperCase() || undefined;
      const eligibilityEpoch =
        BigInt(matchedBeaconData?.validator?.activation_eligibility_epoch) >
        BigInt('18000000000000000000')
          ? '--'
          : matchedBeaconData?.validator?.activation_eligibility_epoch || '--';

      const beaconCheckpointsResJson = await fetchBeaconCheckpoints();

      const currentEpoch = beaconCheckpointsResJson?.data?.finalized?.epoch;

      const days =
        BigInt(matchedBeaconData?.validator?.activation_epoch) >
        BigInt('18000000000000000000')
          ? '--'
          : ((Number(currentEpoch) -
              Number(matchedBeaconData?.validator?.activation_epoch)) *
              32 *
              getBlockSeconds()) /
            (24 * 60 * 60);
      const newPubkeyInfo = {
        pubkeyAddress: pubkeyAddress,
        beaconApiStatus,
        eligibilityEpoch,
        days: !isNaN(Number(days)) ? Math.floor(Number(days)) + '' : '--',
        currentTokenAmount: matchedBeaconData
          ? Web3.utils.fromWei(matchedBeaconData.balance, 'gwei')
          : '--',
        ...pubkeyInfo,
      };

      const displayStatus = getPubkeyDisplayStatus(
        newPubkeyInfo,
        Number(unmatchedEth)
      );

      setPubkeyInfo({
        ...newPubkeyInfo,
        displayStatus,
      } as any);
    } catch (err: any) {
      console.log({ err });
    }
  }, [metaMaskAccount]);

  useEffect(() => {
    updateData();
  }, [updateData]);

  return {
    pubkeyInfo,
  };
}
