import {
  getLsdEthTokenContract,
  getNetworkProposalContract,
} from 'config/contract';
import {
  getLsdEthTokenContractAbi,
  getNetworkProposalContractAbi,
} from 'config/contractAbi';
import { useCallback, useEffect, useState } from 'react';

import { getEthWeb3 } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';

export function useNetworkProposalData() {
  const [threshold, setThreshold] = useState<string>();
  const [voters, setVoters] = useState<any>([]);
  const [admin, setAdmin] = useState<string>();
  const [voteManagerAddress, setVoteManagerAddress] = useState<string>();
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);

  const web3 = getEthWeb3();
  const { metaMaskAccount } = useWalletAccount();

  const networkProposalContract = new web3.eth.Contract(
    getNetworkProposalContractAbi(),
    getNetworkProposalContract(),
    {
      from: metaMaskAccount,
    }
  );

  const updateNetworkProposalData = useCallback(async () => {
    try {
      const thresholdvalue = await networkProposalContract.methods
        .threshold()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setThreshold(thresholdvalue);

      const votersValue = await networkProposalContract.methods
        .getVoters()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setVoters(votersValue);

      const adminWallet = await networkProposalContract.methods
        .admin()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setAdmin(adminWallet);

      const voterManagerAddressValue = await networkProposalContract.methods
        .voterManager()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setVoteManagerAddress(voterManagerAddressValue);

      const treasuryBalanceValue = await web3.eth.getBalance(
        voterManagerAddressValue
      );
      setTreasuryBalance(+web3.utils.fromWei(treasuryBalanceValue));
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  const addVoter = async (value: string) => {
    try {
      await networkProposalContract.methods
        .addVoter(value)
        .send({ from: metaMaskAccount })
        .catch((err: any) => {
          console.log({ err });
        });
      return true;
    } catch (err: any) {
      console.log({ err });
      return false;
    }
  };

  const removeVoter = async (value: string) => {
    try {
      await networkProposalContract.methods
        .removeVoter(value)
        .send({ from: metaMaskAccount })
        .catch((err: any) => {
          console.log({ err });
        });
      return true;
    } catch (err: any) {
      console.log({ err });
      return false;
    }
  };

  useEffect(() => {
    updateNetworkProposalData();
  }, [updateNetworkProposalData]);

  return {
    threshold,
    voters,
    treasuryBalance,
    admin,
    voteManagerAddress,
    addVoter,
    removeVoter,
  };
}
