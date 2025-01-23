import {
  ChainPubkeyStatus,
  NodePubkeyInfo,
  PubkeyStatusType,
} from 'interfaces/common';
import { useEffect, useMemo, useState } from 'react';
import { getPubkeyDisplayStatus } from 'utils/commonUtils';
import { useAppSlice } from './selector';
import { useUnmatchedToken } from './useUnmatchedToken';
import { useUserPubkeys } from './useUserPubkeys';

export const usePubkeysMyData = (
  nodeAddress: string | undefined,
  page: number,
  pubkeyStatusTypes?: PubkeyStatusType[]
) => {
  const [totalCount, setTotalCount] = useState<number>();

  const [pendingCount, setPendingCount] = useState<number>();
  const [activeCount, setActiveCount] = useState<number>();
  const [exitedCount, setExitedCount] = useState<number>();
  const [matchedCount, setMatchedCount] = useState<number>();
  const [othersCount, setOthersCount] = useState<number>();

  const { nodePubkeys } = useUserPubkeys();
  const [displayPubkeyInfos, setDisplayPubkeyInfos] = useState<
    NodePubkeyInfo[]
  >([]);

  const { unmatchedEth } = useUnmatchedToken();

  useEffect(() => {
    if (!nodePubkeys) {
      return;
    }

    let remainingTokenAmount =
      !unmatchedEth || isNaN(Number(unmatchedEth)) ? 0 : Number(unmatchedEth);

    let activeCount = 0;
    let pendingCount = 0;
    let exitedCount = 0;
    let matchedCount = 0;
    let othersCount = 0;

    const resList: NodePubkeyInfo[] = [];

    nodePubkeys.forEach((item) => {
      const displayStatus = getPubkeyDisplayStatus(item, remainingTokenAmount);
      item.displayStatus === displayStatus;
      let canStake = false;
      if (
        item._status === ChainPubkeyStatus.Match &&
        remainingTokenAmount >= 31
      ) {
        remainingTokenAmount -= 31;
        canStake = true;
      }

      const newItem = { ...item, displayStatus, canStake };

      const isActive =
        item._status === ChainPubkeyStatus.Staked &&
        (item.beaconApiStatus === 'ACTIVE_ONGOING' ||
          item.beaconApiStatus === 'ACTIVE_EXITING' ||
          item.beaconApiStatus === 'ACTIVE_SLASHED' ||
          item.beaconApiStatus === 'ACTIVE');

      const isPending =
        item._status === ChainPubkeyStatus.Staked &&
        (item.beaconApiStatus === undefined ||
          item.beaconApiStatus === 'PENDING_INITIALIZED' ||
          item.beaconApiStatus === 'PENDING_QUEUED' ||
          item.beaconApiStatus === 'PENDING');

      const isExit =
        item._status === ChainPubkeyStatus.Staked &&
        (item.beaconApiStatus === 'EXITED_UNSLASHED' ||
          item.beaconApiStatus === 'EXITED_SLASHED' ||
          item.beaconApiStatus === 'EXITED');

      const isMatched = item._status === ChainPubkeyStatus.Match;

      const isOthers = !isActive && !isPending && !isExit;

      if (isActive) {
        activeCount++;
        if (
          !pubkeyStatusTypes ||
          pubkeyStatusTypes.length === 0 ||
          pubkeyStatusTypes.indexOf(PubkeyStatusType.Active) >= 0
        ) {
          resList.push(newItem);
        }
      } else if (isPending) {
        pendingCount++;
        if (
          !pubkeyStatusTypes ||
          pubkeyStatusTypes.length === 0 ||
          pubkeyStatusTypes.indexOf(PubkeyStatusType.Pending) >= 0
        ) {
          resList.push(newItem);
        }
      } else if (isExit) {
        exitedCount++;
        if (
          !pubkeyStatusTypes ||
          pubkeyStatusTypes.length === 0 ||
          pubkeyStatusTypes.indexOf(PubkeyStatusType.Exited) >= 0
        ) {
          resList.push(newItem);
        }
      } else if (isMatched) {
        matchedCount++;
        if (
          !pubkeyStatusTypes ||
          pubkeyStatusTypes.length === 0 ||
          pubkeyStatusTypes.indexOf(PubkeyStatusType.Matched) >= 0
        ) {
          resList.push(newItem);
        }
      } else {
        othersCount++;
        if (
          !pubkeyStatusTypes ||
          pubkeyStatusTypes.length === 0 ||
          pubkeyStatusTypes.indexOf(PubkeyStatusType.Others) >= 0
        ) {
          resList.push(newItem);
        }
      }
    });

    setDisplayPubkeyInfos(resList);
    setActiveCount(activeCount);
    setPendingCount(pendingCount);
    setExitedCount(exitedCount);
    setMatchedCount(matchedCount);
    setOthersCount(othersCount);
    setTotalCount(nodePubkeys.length);
  }, [nodePubkeys, pubkeyStatusTypes, unmatchedEth]);

  const showLoading = useMemo(() => {
    return nodePubkeys === undefined;
  }, [nodePubkeys]);

  const showEmptyContent = useMemo(() => {
    return displayPubkeyInfos.length === 0 && !showLoading;
  }, [showLoading, displayPubkeyInfos]);

  return {
    showLoading,
    showEmptyContent,
    totalCount,
    othersCount,
    pendingCount,
    activeCount,
    exitedCount,
    matchedCount,
    displayPubkeyInfos,
  };
};
