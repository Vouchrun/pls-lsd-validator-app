import { getNodeDepositContract } from "config/contract";
import { getNodeDepositContractAbi } from "config/contractAbi";
import { useCallback, useEffect, useState } from "react";
import { getEthWeb3, executeWithRpcFallback } from "utils/web3Utils";
import { formatEther } from "viem";
import { useWalletAccount } from "./useWalletAccount";

export function useSoloDepositAmount() {
  const { metaMaskAccount } = useWalletAccount();
  const [soloDepositAmount, setSoloDepositAmount] = useState<string>();
  const [soloDepositAmountInWei, setSoloDepositAmountInWei] =
    useState<string>();

  const updateStatus = useCallback(async () => {
    try {
      await executeWithRpcFallback(async (web3) => {
        let nodeDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {}
        );

        const res = await nodeDepositContract.methods
          .soloNodeDepositAmount()
          .call();
        setSoloDepositAmountInWei(res);
        setSoloDepositAmount(formatEther(res));
      });
    } catch (err: unknown) {
      console.log("err", err);
    }
  }, [metaMaskAccount]);

  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  return { soloDepositAmount, soloDepositAmountInWei };
}
