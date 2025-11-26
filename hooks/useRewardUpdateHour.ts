import { getNetworkBalanceContract } from 'config/contract';
import { getNetworkBalanceContractAbi } from 'config/contractAbi';
import { getBlockSeconds } from 'config/env';
import { useCallback, useEffect, useState } from 'react';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import Web3 from 'web3';

export function useRewardUpdateHour() {
  const [rewardUpdateHour, setRewardUpdateHour] = useState<string>();
  const [rateChangeLimit, setRateChangeLimit] = useState<string>();

  const updateData = useCallback(async () => {
    try {
    try {
      await executeWithRpcFallback(async (web3) => {
        const networkBalanceContract = new web3.eth.Contract(
          getNetworkBalanceContractAbi(),
          getNetworkBalanceContract(),
          {}
        );

        const updateBalancesEpochs = await networkBalanceContract.methods
          .updateBalancesEpochs()
          .call();

        const updateHours =
          (Number(updateBalancesEpochs) * (getBlockSeconds() * 32)) / 60 / 60;
        setRewardUpdateHour(Math.round(updateHours) + '');

        const rateChangeLimitValue = await networkBalanceContract.methods
          .rateChangeLimit()
          .call();

        setRateChangeLimit(+Web3.utils.fromWei(rateChangeLimitValue) * 100 + '%');
      });
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  useEffect(() => {
    updateData();
  }, [updateData]);

  return { rewardUpdateHour, rateChangeLimit };
}
