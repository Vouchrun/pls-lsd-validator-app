import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { getNodeDepositContract } from "config/contract";
import { getNodeDepositContractAbi } from "config/contractAbi";
import { getEthWeb3, executeWithRpcFallback } from "utils/web3Utils";
import Web3 from "web3";

export function useSoloNodeDepositAmount() {
  const amountResult: UseQueryResult<string | undefined> = useQuery({
    queryKey: ["GetSoloNodeDepositAmount"],
    staleTime: 10000,
    queryFn: async () => {
      try {
        return await executeWithRpcFallback(async (web3) => {
          const nodeDepositContract = new web3.eth.Contract(
            getNodeDepositContractAbi(),
            getNodeDepositContract(),
            {}
          );

          const soloNodeDepositAmount = await nodeDepositContract.methods
            .soloNodeDepositAmount()
            .call();

          return Web3.utils.fromWei(soloNodeDepositAmount);
        });
      } catch (err: any) {
        console.log({ err });
      }
      return undefined;
    },
  });

  return {
    soloNodeDepositAmount: amountResult.data,
  };
}
