import {
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from "config/contract";
import {
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
} from "config/contractAbi";
import { getBlockSeconds } from "config/env";
import { NodePubkeyInfo } from "interfaces/common";
import { useCallback, useEffect, useState } from "react";
import { fetchBeaconCheckpoints, fetchPubkeyStatus } from "utils/apiUtils";
import { getPubkeyDisplayStatus } from "utils/commonUtils";
import { getEthWeb3 } from "utils/web3Utils";
import Web3 from "web3";
import { useUnmatchedToken } from "./useUnmatchedToken";
import { useWalletAccount } from "./useWalletAccount";

export function usePubkeyDetail(pubkeyAddress: string | undefined) {
  const { metaMaskAccount } = useWalletAccount();
  const { unmatchedEth } = useUnmatchedToken();

  const [pubkeyInfo, setPubkeyInfo] = useState<NodePubkeyInfo>();

  const updateData = useCallback(async () => {
    if (!pubkeyAddress) {
      return;
    }

    try {
      const web3 = getEthWeb3();
      const networkWithdrawContract = new web3.eth.Contract(
        getNetworkWithdrawContractAbi(),
        getNetworkWithdrawContract(),
        {
          from: metaMaskAccount,
        }
      );

      const nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {
          from: metaMaskAccount,
        }
      );

      const pubkeyInfo = await nodeDepositContract.methods
        .pubkeyInfoOf(pubkeyAddress)
        // .pubkeyInfoOf(
        //   "0xa6710aa9f9bf9e8fb01020e3a7dcca92fa9f24c07b4038d7b8437ad2082df41c01419760111c7857561da5c3d67db664"
        // )
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      // const beaconStatusResponse = await fetch(
      //   `/api/pubkeyStatus?id=${pubkeyAddress}`,
      //   {
      //     method: "GET",
      //   }
      // );
      // const beaconStatusResJson = await beaconStatusResponse.json();
      const beaconStatusResJson = await fetchPubkeyStatus(pubkeyAddress);

      const matchedBeaconData = beaconStatusResJson.data?.find(
        (item: any) => item.validator?.pubkey === pubkeyAddress
      );

      const beaconApiStatus =
        matchedBeaconData?.status?.toUpperCase() || undefined;
      const eligibilityEpoch =
        BigInt(matchedBeaconData?.validator?.activation_eligibility_epoch) >
        BigInt("18000000000000000000")
          ? "--"
          : matchedBeaconData?.validator?.activation_eligibility_epoch || "--";

      // const beaconCheckpointsResponse = await fetch(`/api/beaconCheckpoints`, {
      //   method: "GET",
      // });
      // const beaconCheckpointsResJson = await beaconCheckpointsResponse.json();
      const beaconCheckpointsResJson = await fetchBeaconCheckpoints();

      const currentEpoch = beaconCheckpointsResJson?.data?.finalized?.epoch;

      const days =
        BigInt(matchedBeaconData?.validator?.activation_epoch) >
        BigInt("18000000000000000000")
          ? "--"
          : ((Number(currentEpoch) -
              Number(matchedBeaconData?.validator?.activation_epoch)) *
              32 *
              getBlockSeconds()) /
            (24 * 60 * 60);
      const newPubkeyInfo = {
        pubkeyAddress: pubkeyAddress,
        beaconApiStatus,
        eligibilityEpoch,
        days: !isNaN(Number(days)) ? Math.floor(Number(days)) + "" : "--",
        currentTokenAmount: matchedBeaconData
          ? Web3.utils.fromWei(matchedBeaconData.balance, "gwei")
          : "--",
        ...pubkeyInfo,
      };

      const displayStatus = getPubkeyDisplayStatus(
        newPubkeyInfo,
        Number(unmatchedEth)
      );

      setPubkeyInfo({ ...newPubkeyInfo, displayStatus });
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
