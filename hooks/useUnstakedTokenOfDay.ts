import { getNetworkWithdrawContract } from "config/contract";
import { useCallback, useEffect, useState } from "react";
import { getEthWeb3, executeWithRpcFallback } from "utils/web3Utils";
import Web3 from "web3";
import { useAppSlice } from "./selector";
import { getNetworkWithdrawContractAbi } from "config/contractAbi";

export function useUnstakedTokenOfDay() {
  const { updateFlag } = useAppSlice();

  const [unstakedTokenOfDay, setUnstakedTokenOfDay] = useState<string>();

  const updateData = useCallback(async () => {
    try {
      await executeWithRpcFallback(async (web3) => {
        const networkWithdrawContract = new web3.eth.Contract(
          getNetworkWithdrawContractAbi(),
          getNetworkWithdrawContract(),
          {}
        );

        const currentBlock = await web3.eth.getBlockNumber();

        const events = await networkWithdrawContract.getPastEvents("Unstake", {
          fromBlock: currentBlock - Math.floor((1 / 12) * 60 * 60 * 24),
          toBlock: currentBlock,
        });

        const unstakeEvents = events.sort(
          (a, b) => a.blockNumber - b.blockNumber
        );

        let totalUnstakedAmount = 0;

        unstakeEvents.forEach((event) => {
          const unstakeEventLog = event.returnValues;
          totalUnstakedAmount += Number(unstakeEventLog.ethAmount);
        });

        setUnstakedTokenOfDay(Web3.utils.fromWei(totalUnstakedAmount + ""));
      });
    } catch (err: any) {
      console.log({ err });
    }
  }, [updateFlag]);

  useEffect(() => {
    updateData();
  }, [updateData]);

  return { unstakedTokenOfDay };
}
