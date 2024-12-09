import { getFeePoolContract } from 'config/contract';
import { useCallback, useEffect, useState } from 'react';
import { getEthWeb3 } from 'utils/web3Utils';
import Web3 from 'web3';

export function useFeePoolData() {
  const [feePoolBalance, setFeePoolBalance] = useState<number>(0);
  const feePoolAddress = getFeePoolContract();
  const web3 = getEthWeb3();

  const updateFeePoolData = useCallback(async () => {
    try {
      const feePoolBalanceData = await web3.eth.getBalance(feePoolAddress);
      setFeePoolBalance(+Web3.utils.fromWei(feePoolBalanceData));
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  useEffect(() => {
    updateFeePoolData();
  }, [updateFeePoolData]);

  return {
    feePoolBalance,
  };
}
