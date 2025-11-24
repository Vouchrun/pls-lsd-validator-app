import {
  getLsdEthTokenContract,
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';
import Web3 from 'web3';
import {
  ChainPubkeyStatus,
  IpfsRewardItem,
  RewardJsonResponse,
} from 'interfaces/common';
import { useAppSlice } from './selector';
import {
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
} from 'config/contractAbi';
import { useUserPubkeys } from './useUserPubkeys';
import { getEthereumChainId, getValidatorTotalDepositAmount } from 'config/env';
import { formatScientificNumber, removeDecimals } from 'utils/numberUtils';
import { fetchBeaconStatusInChunks, fetchPubkeyStatus } from 'utils/apiUtils';
import { isPubkeyStillValid } from 'utils/commonUtils';

export function useMyData() {
  const { updateFlag } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();

  const [selfDepositedToken, setSelfDepositedToken] = useState<string>();
  // const [totalManagedToken, setTotalManagedToken] = useState<string>();
  const [myRewardTokenAmount, setMyRewardTokenAmount] = useState<string>();
  const [ipfsMyRewardInfo, setIpfsMyRewardInfo] = useState<IpfsRewardItem>();
  const [availableExitDeposit, setAvailableExitDeposit] = useState<string>();
  const [pubkeysOfNode, setPubkeysOfNode] = useState<string[]>([]);
  const [myShareAmount, setMyShareAmount] = useState<string>();
  const [mySharePercentage, setMySharePercentage] = useState<string>();

  const { nodePubkeys } = useUserPubkeys();

  const totalManagedToken = useMemo(() => {
    if (!nodePubkeys) {
      return undefined;
    }

    let totalManagedToken = 0;
    nodePubkeys.forEach((item) => {
      if (
        item._status === ChainPubkeyStatus.Staked &&
        isPubkeyStillValid(item.beaconApiStatus)
      ) {
        totalManagedToken += getValidatorTotalDepositAmount();
      }
    });

    return totalManagedToken + '';
  }, [nodePubkeys]);

  const updateData = useCallback(async () => {
    if (!metaMaskAccount) {
      setSelfDepositedToken('--');
      setMyRewardTokenAmount('--');
      return;
    }

    const userAddress = metaMaskAccount;

    try {
      // Use executeWithRpcFallback for contract calls to ensure automatic RPC fallback
      const [nodeRewardsFileCid, latestMerkleRootEpoch, totalClaimedRewardOfNode, totalClaimedDepositOfNode] = 
        await executeWithRpcFallback(async (web3) => {
          const networkWithdrawContract = new web3.eth.Contract(
            getNetworkWithdrawContractAbi(),
            getNetworkWithdrawContract(),
            {
              from: userAddress,
            }
          );

          const [cid, epoch, claimedReward, claimedDeposit] = await Promise.all([
            networkWithdrawContract.methods.nodeRewardsFileCid().call().catch((err: any) => {
              console.log({ err });
              return undefined;
            }),
            networkWithdrawContract.methods.latestMerkleRootEpoch().call().catch((err: any) => {
              console.log({ err });
              return undefined;
            }),
            networkWithdrawContract.methods.totalClaimedRewardOfNode(userAddress).call().catch((err: any) => {
              console.log({ err });
              return undefined;
            }),
            networkWithdrawContract.methods.totalClaimedDepositOfNode(userAddress).call().catch((err: any) => {
              console.log({ err });
              return undefined;
            }),
          ]);

          return [cid, epoch, claimedReward, claimedDeposit];
        });

      const response = await fetch(
        `https://${nodeRewardsFileCid}.ipfs.dweb.link/${getLsdEthTokenContract().toLowerCase()}-rewards-${getEthereumChainId()}-${latestMerkleRootEpoch}.json`,
        {
          method: 'GET',
          headers: {},
        }
      );
      const resText = await response.text();
      var JSONbig = require('json-bigint');
      const resTextJson = JSONbig.parse(resText);

      const list: IpfsRewardItem[] = resTextJson.List?.map((item: any) => {
        return {
          ...item,
          totalRewardAmount: removeDecimals(item.totalRewardAmount.toFixed()),
          totalDepositAmount: removeDecimals(item.totalDepositAmount.toFixed()),
          totalExitDepositAmount: removeDecimals(
            item.totalExitDepositAmount.toFixed()
          ),
        };
      });

      const myRewardInfo = list?.find((item) => item.address === userAddress);
      setIpfsMyRewardInfo(myRewardInfo);

      const myTotalRewardAmount = myRewardInfo?.totalRewardAmount || '0';

      const availableExitDeposit = !myRewardInfo
        ? 0
        : Math.max(
            0,
            Number(myRewardInfo?.totalExitDepositAmount) -
              Number(totalClaimedDepositOfNode)
          );

      setAvailableExitDeposit(
        Web3.utils.fromWei(formatScientificNumber(availableExitDeposit))
      );

      // Use executeWithRpcFallback for node deposit contract call
      const pubkeysOfNode = await executeWithRpcFallback(async (web3) => {
        const nodeDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {
            from: userAddress,
          }
        );

        return await nodeDepositContract.methods
          .getPubkeysOfNode(userAddress)
          .call()
          .catch((err: any) => {
            console.log({ err });
            return [];
          });
      });
      
      setPubkeysOfNode(pubkeysOfNode);

      const myRewardEth = Web3.utils.fromWei(
        formatScientificNumber(
          Number(myTotalRewardAmount) - Number(totalClaimedRewardOfNode)
        ) + ''
      );

      setMyRewardTokenAmount(myRewardEth);
    } catch (err: any) {
      console.log({ err });
    }
  }, [metaMaskAccount]);

  useEffect(() => {
    updateData();
  }, [updateData, updateFlag]);

  const updateNodeData = useCallback(async () => {
    try {
      if (!metaMaskAccount) {
        return;
      }
      const userAddress = metaMaskAccount;

      // Use executeWithRpcFallback for contract calls
      const [pubkeyInfos, beaconStatusResponses] = await executeWithRpcFallback(async (web3) => {
        const nodeDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {}
        );

        const [infos, beaconStatuses] = await Promise.all([
          Promise.all(
            pubkeysOfNode.map((pubkeyAddress: string) =>
              nodeDepositContract.methods.pubkeyInfoOf(pubkeyAddress).call()
            )
          ),
          fetchBeaconStatusInChunks(pubkeysOfNode),
        ]);

        return [infos, beaconStatuses];
      });

      const beaconStatusResJson = beaconStatusResponses.flatMap(
        (response) => response.data
      );

      let myShareAmount = 0;
      let selfDepositAmount = 0;

      let totalNodeDepositAmount = 0;

      pubkeyInfos.forEach((pubkeyInfo, index) => {
        const matchedBeaconData = beaconStatusResJson?.find(
          (item: any) => item.validator?.pubkey === pubkeysOfNode[index]
        );

        if (isPubkeyStillValid(matchedBeaconData.status)) {
          totalNodeDepositAmount +=
            Number(pubkeyInfo._nodeDepositAmount) / 1e18;
          myShareAmount += Number(pubkeyInfo._nodeDepositAmount);
        }
      });
      myShareAmount = Math.max(
        0,
        myShareAmount -
          (ipfsMyRewardInfo ? ipfsMyRewardInfo?.totalExitDepositAmount : 0)
      );

      // Use executeWithRpcFallback for network withdraw contract call
      const totalClaimedDepositOfNode = await executeWithRpcFallback(async (web3) => {
        const networkWithdrawContract = new web3.eth.Contract(
          getNetworkWithdrawContractAbi(),
          getNetworkWithdrawContract(),
          {}
        );

        return await networkWithdrawContract.methods
          .totalClaimedDepositOfNode(userAddress)
          .call()
          .catch((err: any) => {
            console.log({ err });
            return '0';
          });
      });
      // console.log({ totalNodeDepositAmount });
      // console.log({ totalClaimedDepositOfNode });

      selfDepositAmount = Math.max(0, totalNodeDepositAmount);
      setMyShareAmount(
        Web3.utils.fromWei(formatScientificNumber(myShareAmount))
      );

      setMySharePercentage(
        Number(Web3.utils.fromWei(formatScientificNumber(myShareAmount))) /
          Number(totalManagedToken) +
          ''
      );
      setSelfDepositedToken(formatScientificNumber(selfDepositAmount));
    } catch (err: any) {
      console.log({ err });
    }
  }, [pubkeysOfNode, ipfsMyRewardInfo, totalManagedToken, metaMaskAccount]);

  useEffect(() => {
    updateNodeData();
  }, [updateNodeData, updateFlag]);

  return {
    selfDepositedToken,
    totalManagedToken,
    myRewardTokenAmount,
    ipfsMyRewardInfo,
    availableExitDeposit,
    myShareAmount,
    mySharePercentage,
  };
}
