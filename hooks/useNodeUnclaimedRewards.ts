import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { useAppSlice } from 'hooks/selector';
import {
  getNetworkWithdrawContract,
  getLsdEthTokenContract,
  
} from '../config/contract';
import { formatNumber, formatScientificNumber, removeDecimals } from '../utils/numberUtils';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import {
    getNetworkWithdrawContractAbi,
    
  } from 'config/contractAbi';
import { getEthereumChainId } from 'config/env';

import { IpfsRewardItem } from 'interfaces/common';

// The rewards file location (cid + epoch) and the IPFS rewards JSON itself
// are shared by every node, so fetch and parse them once and reuse across
// hook instances (with a short TTL and in-flight dedupe).
interface RewardsData {
  timestamp: number;
  list: IpfsRewardItem[];
}
const REWARDS_CACHE_TTL = 5 * 60 * 1000;
let rewardsCache: RewardsData | null = null;
let inFlightRewards: Promise<RewardsData> | null = null;

async function getSharedRewardsData(web3: any): Promise<RewardsData> {
  if (
    rewardsCache &&
    Date.now() - rewardsCache.timestamp < REWARDS_CACHE_TTL
  ) {
    return rewardsCache;
  }
  if (inFlightRewards) {
    return inFlightRewards;
  }

  inFlightRewards = (async () => {
    const networkWithdrawContract = new web3.eth.Contract(
      getNetworkWithdrawContractAbi(),
      getNetworkWithdrawContract(),
      {}
    );

    const nodeRewardsFileCid = await networkWithdrawContract.methods
      .nodeRewardsFileCid()
      .call();

    const latestMerkleRootEpoch = await networkWithdrawContract.methods
      .latestMerkleRootEpoch()
      .call();

    const response = await fetch(
      `https://fuchsia-adjacent-spoonbill-601.mypinata.cloud/ipfs/${nodeRewardsFileCid}/${getLsdEthTokenContract().toLowerCase()}-rewards-${getEthereumChainId()}-${latestMerkleRootEpoch}.json`
    );

    const resText = await response.text();
    var JSONbig = require('json-bigint');
    const resTextJson = JSONbig.parse(resText);

    const list: IpfsRewardItem[] =
      resTextJson.List?.map((item: any) => ({
        ...item,
        totalRewardAmount: removeDecimals(item.totalRewardAmount.toFixed()),
        totalDepositAmount: removeDecimals(item.totalDepositAmount.toFixed()),
        totalExitDepositAmount: removeDecimals(
          item.totalExitDepositAmount.toFixed()
        ),
      })) || [];

    rewardsCache = { timestamp: Date.now(), list };
    return rewardsCache;
  })().finally(() => {
    inFlightRewards = null;
  });

  return inFlightRewards;
}

export async function getNodeRewardItemsForAddresses(
  nodeAddresses: string[],
  web3?: any
): Promise<IpfsRewardItem[]> {
  const targetWeb3 = web3 || getEthWeb3();
  const rewardsData = await getSharedRewardsData(targetWeb3);
  const lower = nodeAddresses.map((a) => a.toLowerCase());
  return rewardsData.list.filter((item) =>
    lower.includes(item.address.toLowerCase())
  );
}

export const useNodeUnclaimedRewards = (nodeAddress: string) => {
  const { updateFlag } = useAppSlice();
  const [unclaimedRewards, setUnclaimedRewards] = useState<string>('0');
  const [hasUnclaimed, setHasUnclaimed] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);
  const [isContract, setIsContract] = useState(false);
  const [ipfsRewardItem, setIpfsRewardItem] = useState<
    IpfsRewardItem | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnclaimedRewards = async () => {
      if (!nodeAddress) {
        setHasBalance(false);
        setIsContract(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await executeWithRpcFallback(async (web3) => {
          const networkWithdrawContract = new web3.eth.Contract(
            getNetworkWithdrawContractAbi(),
            getNetworkWithdrawContract(),
            {
              from: nodeAddress,
            }
          );

          // Shared: contract meta + IPFS rewards file (cached across nodes)
          const rewardsData = await getSharedRewardsData(web3);

          // Per-node: total claimed rewards for the node
          const totalClaimedRewardOfNode = await networkWithdrawContract.methods
            .totalClaimedRewardOfNode(nodeAddress)
            .call();

          // Per-node: PLS balance and contract code (sweep eligibility)
          const [balance, code] = await Promise.all([
            web3.eth.getBalance(nodeAddress),
            web3.eth.getCode(nodeAddress),
          ]);
          setHasBalance(BigInt(balance) > 0n);
          setIsContract(code !== '0x');

          // Find reward info for the specific node
          const nodeRewardInfo = rewardsData.list.find(
            (item) =>
              item.address.toLowerCase() === nodeAddress.toLowerCase()
          );

          if (nodeRewardInfo) {
            const totalRewardAmount = nodeRewardInfo.totalRewardAmount || '0';

            // Calculate unclaimed rewards
            const unclaimedRewardAmount = Web3.utils.fromWei(
              formatScientificNumber(
                Number(totalRewardAmount) - Number(totalClaimedRewardOfNode)
              ) + ''
            );

            setHasUnclaimed(
              BigInt(totalRewardAmount) - BigInt(totalClaimedRewardOfNode) > 0n
            );
            setIpfsRewardItem(nodeRewardInfo);
            setUnclaimedRewards(
              formatNumber(+unclaimedRewardAmount, {
                hideDecimalsForZero: true,
                decimals: 0,
              })
            );
          } else {
            setUnclaimedRewards('0');
            setHasUnclaimed(false);
            setIpfsRewardItem(undefined);
          }
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching unclaimed rewards:', err);
        setError(err.message || 'Failed to fetch unclaimed rewards');
        setHasBalance(false);
        setIsContract(false);
        setIsLoading(false);
      }
    };

    fetchUnclaimedRewards();
  }, [nodeAddress, updateFlag]);

  return {
    unclaimedRewards,
    hasUnclaimed,
    hasBalance,
    isContract,
    ipfsRewardItem,
    isLoading,
    error,
  };
};