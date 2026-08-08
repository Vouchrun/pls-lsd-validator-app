import {
  getEthDepositContract,
  getLsdEthTokenContract,
  getNetworkWithdrawContract,
} from 'config/contract';
import {
  getLsdEthTokenContractAbi,
  getNetworkWithdrawContractAbi,
} from 'config/contractAbi';
import { useCallback, useEffect, useState } from 'react';
import { formatScientificNumber } from 'utils/numberUtils';
import { getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import Web3 from 'web3';

export function useUnstakingPoolData() {
  const [poolEth, setPoolEth] = useState<string>();
  const [unstakeawableEth, setUnstakeawableEth] = useState<string>();
  const [ejectedValidators, setEjectedValidators] = useState<string>();
  const [waitingStakers, setWaitingStakers] = useState<string>();
  const [nodeCommissionValue, setNodeCommissionValue] = useState<number>(0);
  const [stackCommissionRate, setStackCommissionRate] = useState<number>(0);
  const [platformCommissionRate, setPlatformCommissionRate] =
    useState<number>(0);
  const [totalMissingAmountForWithdraw, setTotalMissingAmountForWithdraw] =
    useState<number>(0);
  const [totalPlatformClaimedAmount, setTotalPlatformClaimedAmount] =
    useState<number>(0);
  const [totalPlatformCommission, setTotalPlatformCommission] =
    useState<number>(0);
  const [withdrawCycleSeconds, setWithdrawCycleSeconds] = useState<string>();

  const udpatePoolData = useCallback(async () => {
    try {
      await executeWithRpcFallback(async (web3) => {
        const networkWithdrawContract = new web3.eth.Contract(
          getNetworkWithdrawContractAbi(),
          getNetworkWithdrawContract(),
          {}
        );

        const lsdTokenContract = new web3.eth.Contract(
          getLsdEthTokenContractAbi(),
          getLsdEthTokenContract(),
          {}
        );

        const lsdTotalSupply = await lsdTokenContract.methods
          .totalSupply()
          .call();

        const lsdRate = await lsdTokenContract.methods
          .getRate()
          .call();

        const userDepositBalance = await web3.eth.getBalance(
          getEthDepositContract()
        );

        const nodeComissionFeeValue = await networkWithdrawContract.methods
          .nodeCommissionRate()
          .call();
        setNodeCommissionValue(+Web3.utils.fromWei(nodeComissionFeeValue) * 100);

        const platformCommissionValue = await networkWithdrawContract.methods
          .platformCommissionRate()
          .call();
        setPlatformCommissionRate(
          +Web3.utils.fromWei(platformCommissionValue) * 100
        );

        const stackCommissionValue = await networkWithdrawContract.methods
          .stackCommissionRate()
          .call();
        setStackCommissionRate(+Web3.utils.fromWei(stackCommissionValue) * 100);

        const totalPlatformClaimedAmountValue =
          await networkWithdrawContract.methods
            .totalPlatformClaimedAmount()
            .call();
        setTotalPlatformClaimedAmount(
          +Web3.utils.fromWei(totalPlatformClaimedAmountValue)
        );

        const totalPlatformCommissionValue = await networkWithdrawContract.methods
          .totalPlatformCommission()
          .call();
        setTotalPlatformCommission(
          +Web3.utils.fromWei(totalPlatformCommissionValue)
        );

        const totalMissingAmountForWithdrawValue =
          await networkWithdrawContract.methods
            .totalMissingAmountForWithdraw()
            .call();

        setTotalMissingAmountForWithdraw(
          +Web3.utils.fromWei(
            formatScientificNumber(Number(totalMissingAmountForWithdrawValue))
          )
        );

        const poolEth = Web3.utils.fromWei(
          formatScientificNumber(
            Number(userDepositBalance) -
              Number(totalMissingAmountForWithdrawValue)
          ) + ''
        );
        setPoolEth(poolEth);

        setUnstakeawableEth('0');

        const nextWithdrawIndex = await networkWithdrawContract.methods
          .nextWithdrawIndex()
          .call();

        const maxClaimableWithdrawIndex = await networkWithdrawContract.methods
          .maxClaimableWithdrawIndex()
          .call();

        setWaitingStakers(
          Number(nextWithdrawIndex) - Number(maxClaimableWithdrawIndex) - 1 + ''
        );
        const withdrawCycleSecondsValue = await networkWithdrawContract.methods
          .withdrawCycleSeconds()
          .call();

        setWithdrawCycleSeconds(withdrawCycleSecondsValue);
      });
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  useEffect(() => {
    udpatePoolData();
  }, [udpatePoolData]);

  return {
    poolEth,
    unstakeawableEth,
    waitingStakers,
    ejectedValidators,
    totalMissingAmountForWithdraw,
    nodeCommissionValue,
    platformCommissionRate,
    stackCommissionRate,
    totalPlatformClaimedAmount,
    totalPlatformCommission,
    withdrawCycleSeconds,
  };
}
