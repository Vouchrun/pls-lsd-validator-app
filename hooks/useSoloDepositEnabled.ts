import { getNodeDepositContract } from "config/contract";
import { getNodeDepositContractAbi } from "config/contractAbi";
import { useCallback, useEffect, useState } from "react";
import { getEthWeb3, executeWithRpcFallback } from "utils/web3Utils";

export function useSoloDepositEnabled() {
  const [enabled, setEnabled] = useState(false);

  const updateStatus = useCallback(async () => {
    try {
    try {
      await executeWithRpcFallback(async (web3) => {
        let nodeDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract()
        );
        const depositEnabled = await nodeDepositContract.methods
          .soloNodeDepositEnabled()
          .call();

        setEnabled(depositEnabled);
      });
    } catch (err: unknown) {}
  }, []);

  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  return enabled;
}
