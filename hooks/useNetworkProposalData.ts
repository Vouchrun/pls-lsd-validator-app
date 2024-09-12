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

export function useNetworkProposalData() {
  const [threshold, setThreshold] = useState<string>();
  const [voters, setVoters] = useState<string[]>([]);
  const [admin, setAdmin] = useState<string>();
  const [treasuryBalance, setTreasuryBalance] = useState<string>();

  const updateNetworkProposalData = useCallback(async () => {
    try {
      const web3 = getEthWeb3();

      const networkProposalContract = new web3.eth.Contract(
        getNetworkProposalContractAbi(),
        getNetworkProposalContract(),
        {}
      );

      const lsdTokenContract = new web3.eth.Contract(
        getLsdEthTokenContractAbi(),
        getLsdEthTokenContract(),
        {}
      );

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

      const voterManagerAddress = await networkProposalContract.methods
        .voterManager()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      const treasuryBalanceValue = await web3.eth.getBalance(
        voterManagerAddress
      );
      setTreasuryBalance(
        (+web3.utils.fromWei(treasuryBalanceValue)).toFixed(2)
      );
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  useEffect(() => {
    updateNetworkProposalData();
  }, [updateNetworkProposalData]);

  return {
    threshold,
    voters,
    treasuryBalance,
    admin,
  };
}
