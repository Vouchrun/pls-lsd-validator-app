import { useEffect, useState } from 'react';
import Web3 from 'web3';
import {
  getNetworkWithdrawContract,
  getLsdEthTokenContract,
  
} from '../config/contract';
import { formatNumber, formatScientificNumber, removeDecimals } from '../utils/numberUtils';
import { getEthWeb3 } from 'utils/web3Utils';
import {
    getNetworkWithdrawContractAbi,
    
  } from 'config/contractAbi';
import { getEthereumChainId } from 'config/env';

interface IpfsRewardItem {
  address: string;
  totalRewardAmount: string;
  totalDepositAmount: string;
  totalExitDepositAmount: string;
}

export const useNodeUnclaimedRewards = (nodeAddress: string) => {
  const [unclaimedRewards, setUnclaimedRewards] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnclaimedRewards = async () => {
      if (!nodeAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const web3 = getEthWeb3();
        const networkWithdrawContract = new web3.eth.Contract(
          getNetworkWithdrawContractAbi(),
          getNetworkWithdrawContract(),
          {
            from: nodeAddress,
          }
        );

        // Get IPFS data location
        const nodeRewardsFileCid = await networkWithdrawContract.methods
          .nodeRewardsFileCid()
          .call();

        const latestMerkleRootEpoch = await networkWithdrawContract.methods
          .latestMerkleRootEpoch()
          .call();

        // Get total claimed rewards for the node
        const totalClaimedRewardOfNode = await networkWithdrawContract.methods
          .totalClaimedRewardOfNode(nodeAddress)
          .call();

        // Fetch rewards data from IPFS
        const response = await fetch(
          `https://${nodeRewardsFileCid}.ipfs.dweb.link/${getLsdEthTokenContract().toLowerCase()}-rewards-${getEthereumChainId()}-${latestMerkleRootEpoch}.json`
        );
        
        const resText = await response.text();
        var JSONbig = require('json-bigint');
        const resTextJson = JSONbig.parse(resText);

        const list: IpfsRewardItem[] = resTextJson.List?.map((item: any) => ({
          ...item,
          totalRewardAmount: removeDecimals(item.totalRewardAmount.toFixed()),
          totalDepositAmount: removeDecimals(item.totalDepositAmount.toFixed()),
          totalExitDepositAmount: removeDecimals(item.totalExitDepositAmount.toFixed()),
        }));

        // Find reward info for the specific node
        const nodeRewardInfo = list?.find((item) => item.address.toLowerCase() === nodeAddress.toLowerCase());
        
        if (nodeRewardInfo) {
          const totalRewardAmount = nodeRewardInfo.totalRewardAmount || '0';
          
          // Calculate unclaimed rewards
          const unclaimedRewardAmount = Web3.utils.fromWei(
            formatScientificNumber(
              Number(totalRewardAmount) - Number(totalClaimedRewardOfNode)
            ) + ''
          );

          setUnclaimedRewards(formatNumber(+unclaimedRewardAmount, {
            hideDecimalsForZero: true,
            decimals: 0,
          }));
        } else {
          setUnclaimedRewards('0');
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching unclaimed rewards:', err);
        setError(err.message || 'Failed to fetch unclaimed rewards');
        setIsLoading(false);
      }
    };

    fetchUnclaimedRewards();
  }, [nodeAddress]);

  return { unclaimedRewards, isLoading, error };
};