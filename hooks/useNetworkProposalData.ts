import {
  getLsdEthTokenContract,
  getNetworkProposalContract,
  getTreasuryAddresses,
} from 'config/contract';
import {
  getLsdEthTokenContractAbi,
  getNetworkProposalContractAbi,
} from 'config/contractAbi';
import { useCallback, useEffect, useState } from 'react';

import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';

export function useNetworkProposalData() {
  const [threshold, setThreshold] = useState<string>();
  const [voters, setVoters] = useState<any>([]);
  const [admin, setAdmin] = useState<string>();
  const [voteManagerAddress, setVoteManagerAddress] = useState<string>();
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const treasuryAddresses = getTreasuryAddresses();
  const web3 = getEthWeb3();
  const { metaMaskAccount } = useWalletAccount();



  const updateNetworkProposalData = useCallback(async () => {
    try {
      await executeWithRpcFallback(async (web3) => {
        const networkProposalContract = new web3.eth.Contract(
            getNetworkProposalContractAbi(),
            getNetworkProposalContract(),
            {
            from: metaMaskAccount,
            }
        );

        const thresholdvalue = await networkProposalContract.methods
            .threshold()
            .call();
        setThreshold(thresholdvalue);

        const votersValue = await networkProposalContract.methods
            .getVoters()
            .call();
        setVoters(votersValue || []);

        const adminWallet = await networkProposalContract.methods
            .admin()
            .call();
        setAdmin(adminWallet);

        const voterManagerAddressValue = await networkProposalContract.methods
            .voterManager()
            .call();
        setVoteManagerAddress(voterManagerAddressValue);

        setTreasuryBalance(0);
        treasuryAddresses.forEach(async (address: string) => {
            const treasuryBalanceValue = await web3.eth.getBalance(address);
            setTreasuryBalance(
            (prev) => prev + +web3.utils.fromWei(treasuryBalanceValue)
            );
        });
      });
    } catch (err: any) {
      console.log({ err });
      // Ensure voters is always an array to prevent crash
      setVoters((prev: any) => prev || []);
    }
  }, [metaMaskAccount, treasuryAddresses]);

  useEffect(() => {
    updateNetworkProposalData();
  }, [updateNetworkProposalData]);

  return {
    threshold,
    voters,
    treasuryBalance,
    admin,
    voteManagerAddress,
  };
}
