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
import { getEthWeb3 } from 'utils/web3Utils';
import Web3 from 'web3';

export function useUnstakingPoolData() {
  const [poolEth, setPoolEth] = useState<string>();
  const [unstakeawableEth, setUnstakeawableEth] = useState<string>();
  const [ejectedValidators, setEjectedValidators] = useState<string>();
  const [waitingStakers, setWaitingStakers] = useState<string>();
  const [nodeCommissionValue, setNodeCommissionValue] = useState<string>();
  const [stackCommissionRate, setStackCommissionRate] = useState<string>();
  const [platformCommissionRate, setPlatformCommissionRate] =
    useState<string>();
  const [totalMissingAmountForWithdraw, setTotalMissingAmountForWithdraw] =
    useState<string>();
  const [totalPlatformClaimedAmount, setTotalPlatformClaimedAmount] =
    useState<string>();
  const [totalPlatformCommission, setTotalPlatformCommission] =
    useState<string>();

  const web3 = getEthWeb3();

  const networkWithdrawContract = new web3.eth.Contract(
    getNetworkWithdrawContractAbi(),
    getNetworkWithdrawContract(),
    {}
  );

  const udpatePoolData = useCallback(async () => {
    try {
      const lsdTokenContract = new web3.eth.Contract(
        getLsdEthTokenContractAbi(),
        getLsdEthTokenContract(),
        {}
      );

      const lsdTotalSupply = await lsdTokenContract.methods
        .totalSupply()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      const lsdRate = await lsdTokenContract.methods
        .getRate()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      const userDepositBalance = await web3.eth.getBalance(
        getEthDepositContract()
      );

      const nodeComissionFeeValue = await networkWithdrawContract.methods
        .nodeCommissionRate()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setNodeCommissionValue(Web3.utils.fromWei(nodeComissionFeeValue));

      const platformCommissionValue = await networkWithdrawContract.methods
        .platformCommissionRate()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setPlatformCommissionRate(Web3.utils.fromWei(platformCommissionValue));

      const stackCommissionValue = await networkWithdrawContract.methods
        .stackCommissionRate()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setStackCommissionRate(Web3.utils.fromWei(stackCommissionValue));

      const totalPlatformClaimedAmountValue =
        await networkWithdrawContract.methods
          .totalPlatformClaimedAmount()
          .call()
          .catch((err: any) => {
            console.log({ err });
          });
      setTotalPlatformClaimedAmount(
        (+Web3.utils.fromWei(totalPlatformClaimedAmountValue)).toFixed(0)
      );

      const stackCommissionRateValue = await networkWithdrawContract.methods
        .stackCommissionRate()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setStackCommissionRate(
        (+Web3.utils.fromWei(stackCommissionRateValue)).toFixed(0)
      );

      const totalPlatformCommissionValue = await networkWithdrawContract.methods
        .totalPlatformCommission()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      setTotalPlatformCommission(
        (+Web3.utils.fromWei(totalPlatformCommissionValue)).toFixed(0)
      );

      const totalMissingAmountForWithdrawValue =
        await networkWithdrawContract.methods
          .totalMissingAmountForWithdraw()
          .call()
          .catch((err: any) => {
            console.log({ err });
          });

      setTotalMissingAmountForWithdraw(
        Web3.utils.fromWei(
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
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      const maxClaimableWithdrawIndex = await networkWithdrawContract.methods
        .maxClaimableWithdrawIndex()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      setWaitingStakers(
        Number(nextWithdrawIndex) - Number(maxClaimableWithdrawIndex) + ''
      );
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  const withDraw = async (value: string) => {
    try {
      await networkWithdrawContract.methods
        .platformClaim(value)
        .send()
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
    withDraw,
  };
}
