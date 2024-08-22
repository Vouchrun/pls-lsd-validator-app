import { getNodeDepositContract } from "config/contract";
import { getNodeDepositContractAbi } from "config/contractAbi";
import {
  getTrustValidatorDepositAmount,
  getValidatorTotalDepositAmount,
} from "config/env";
import {
  ChainPubkeyStatus,
  NodePubkeyInfo,
  PubkeyStatus,
} from "interfaces/common";
import { useEffect, useMemo, useState } from "react";
import { getPubkeyDisplayStatus } from "utils/commonUtils";
import { getEthWeb3 } from "utils/web3Utils";
import { formatEther } from "viem";
import { useAppSlice } from "./selector";
import { useIsTrustedValidator } from "./useIsTrustedValidator";
import { useUnmatchedToken } from "./useUnmatchedToken";
import { useUserPubkeys } from "./useUserPubkeys";

export const usePubkeysHome = (
  nodeAddress: string | undefined,
  page: number,
  selectedPubkeyStatus?: PubkeyStatus
) => {
  const { updateFlag } = useAppSlice();
  const [totalCount, setTotalCount] = useState<number>();
  const [unmatchedCount, setUnmatchedCount] = useState<number>();
  const [stakedCount, setStakedCount] = useState<number>();
  const [othersCount, setOthersCount] = useState<number>();

  const { nodePubkeys } = useUserPubkeys();
  const { isTrust } = useIsTrustedValidator();

  const [displayPubkeyInfos, setDisplayPubkeyInfos] = useState<
    NodePubkeyInfo[]
  >([]);

  const [requestFirstTime, setRequestFirstTime] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { unmatchedEth } = useUnmatchedToken();

  useEffect(() => {
    (async () => {
      if (!nodePubkeys) {
        return;
      }

      const web3 = getEthWeb3();
      let nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {}
      );

      const res = await nodeDepositContract.methods
        .soloNodeDepositAmount()
        .call();
      const soloDepositAmount = formatEther(res);

      const minimalMatchAmount = isTrust
        ? getValidatorTotalDepositAmount() - getTrustValidatorDepositAmount()
        : getValidatorTotalDepositAmount() - Number(soloDepositAmount);

      let remainingTokenAmount =
        !unmatchedEth || isNaN(Number(unmatchedEth)) ? 0 : Number(unmatchedEth);

      let unmatchedCount = 0;
      let stakedCount = 0;
      let othersCount = 0;

      const resList: NodePubkeyInfo[] = [];

      nodePubkeys.forEach((item) => {
        const displayStatus = getPubkeyDisplayStatus(
          item,
          remainingTokenAmount
        );
        // console.log({ remainingTokenAmount });
        // console.log({ minimalMatchAmount });
        let canStake = false;
        if (
          item._status === ChainPubkeyStatus.Match &&
          remainingTokenAmount >= minimalMatchAmount
        ) {
          remainingTokenAmount -= minimalMatchAmount;
          canStake = true;
        }

        const isUnmatch = displayStatus === "Unmatched";
        const isStaked =
          item._status === ChainPubkeyStatus.Staked &&
          item.beaconApiStatus !== "EXITED_UNSLASHED" &&
          item.beaconApiStatus !== "EXITED_SLASHED" &&
          item.beaconApiStatus !== "WITHDRAWAL_POSSIBLE" &&
          item.beaconApiStatus !== "WITHDRAWAL_DONE" &&
          item.beaconApiStatus !== "EXITED" &&
          item.beaconApiStatus !== "WITHDRAWAL";

        if (isUnmatch) {
          unmatchedCount++;
        } else if (isStaked) {
          stakedCount++;
        } else {
          othersCount++;
        }

        const newItem = { ...item, displayStatus, canStake };

        if (isUnmatch && selectedPubkeyStatus === PubkeyStatus.Unmatched) {
          resList.push(newItem);
        } else if (isStaked && selectedPubkeyStatus === PubkeyStatus.Staked) {
          resList.push(newItem);
        } else if (
          !isUnmatch &&
          !isStaked &&
          selectedPubkeyStatus === PubkeyStatus.Others
        ) {
          resList.push(newItem);
        } else if (!selectedPubkeyStatus) {
          resList.push(newItem);
        }
      });

      setDisplayPubkeyInfos(resList);
      setUnmatchedCount(unmatchedCount);
      setStakedCount(stakedCount);
      setOthersCount(othersCount);
    })();
  }, [
    nodePubkeys,
    selectedPubkeyStatus,
    unmatchedEth,
    // Number(minimalMatchAmount),
  ]);

  const showLoading = useMemo(() => {
    return nodePubkeys === undefined;
  }, [nodePubkeys]);

  const showEmptyContent = useMemo(() => {
    return displayPubkeyInfos.length === 0 && !showLoading;
  }, [showLoading, displayPubkeyInfos]);

  return {
    showLoading,
    showEmptyContent,
    displayPubkeyInfos,
    totalCount,
    unmatchedCount,
    stakedCount,
    othersCount,
  };
};
