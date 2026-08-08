import { getNodeDepositContract } from "config/contract";
import { useCallback, useEffect, useState } from "react";
import { getEthWeb3 } from "utils/web3Utils";
import { useWalletAccount } from "./useWalletAccount";
import { ValidatorNodeType } from "interfaces/common";
import { getNodeDepositContractAbi } from "config/contractAbi";

export function useIsTrustedValidator() {
  const { metaMaskAccount } = useWalletAccount();
  const [isTrust, setIsTrust] = useState(false);

  const updateStatus = useCallback(async () => {
    if (!metaMaskAccount) {
      setIsTrust(false);
      return;
    }
    try {
      const web3 = getEthWeb3();
      let nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract()
      );
      const nodeInfoOf = await nodeDepositContract.methods
        .nodeInfoOf(metaMaskAccount)
        .call();

      setIsTrust(
        nodeInfoOf && nodeInfoOf._nodeType === ValidatorNodeType.Trusted
      );
    } catch (err: unknown) {}
  }, [metaMaskAccount]);

  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  return { isTrust };
}
