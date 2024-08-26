import {
  getEthDepositContract,
  getLsdEthTokenContract,
  getNetworkWithdrawContract,
} from "config/contract";
import {
  getLsdEthTokenContractAbi,
  getNetworkWithdrawContractAbi,
} from "config/contractAbi";
import { IpfsRewardItem, RewardJsonResponse } from "interfaces/common";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getEthWeb3 } from "utils/web3Utils";
import Web3 from "web3";
import { useAppSlice } from "./selector";
import { usePoolPubkeyData } from "./usePoolPubkeyData";
import { usePrice } from "./usePrice";
import { getEthereumChainId, getValidatorTotalDepositAmount } from "config/env";
import { formatScientificNumber, removeDecimals } from "utils/numberUtils";

export function usePoolData() {
  const { updateFlag } = useAppSlice();
  const [depositedEth, setDepositedEth] = useState<string>();
  const [depositedEthValue, setDepositedEthValue] = useState<string>();
  const [mintedLsdToken, setMintedLsdToken] = useState<string>();
  const [allEth, setAllEth] = useState<string>();
  const [allEthValue, setAllEthValue] = useState<string>();
  const [poolEth, setPoolEth] = useState<string>();
  const [poolEthValue, setPoolEthValue] = useState<string>();
  const [unmatchedEth, setUnmatchedEth] = useState<string>();
  const [stakeApr, setStakeApr] = useState<string>();
  const [validatorApr, setValidatorApr] = useState<string>();

  const [lsdTotalSupply, setLsdTotalSupply] = useState<string>();
  const [lsdRate, setLsdRate] = useState<string>();

  const { tokenPrice } = usePrice();

  const { matchedValidators } = usePoolPubkeyData();

  const stakedToken = useMemo(() => {
    if (!matchedValidators) {
      return undefined;
    }
    return Number(matchedValidators) * getValidatorTotalDepositAmount() + "";
  }, [matchedValidators]);

  const mintedLsdTokenValue = useMemo(() => {
    if (
      !tokenPrice ||
      isNaN(Number(tokenPrice)) ||
      !lsdTotalSupply ||
      isNaN(Number(lsdTotalSupply)) ||
      !lsdRate ||
      isNaN(Number(lsdRate))
    ) {
      return undefined;
    }
    return Number(lsdTotalSupply) * Number(lsdRate) * Number(tokenPrice);
  }, [lsdTotalSupply, lsdRate, tokenPrice]);

  const stakedTokenValue = useMemo(() => {
    if (
      !tokenPrice ||
      isNaN(Number(tokenPrice)) ||
      !stakedToken ||
      isNaN(Number(stakedToken))
    ) {
      return undefined;
    }
    return Number(stakedToken) * Number(tokenPrice);
  }, [stakedToken, tokenPrice]);

  const udpatePoolData = useCallback(async () => {
    try {
      const web3 = getEthWeb3();

      const userDepositBalance = await web3.eth.getBalance(
        getEthDepositContract()
      );

      const unmatchedEth = Web3.utils.fromWei(userDepositBalance);
      setUnmatchedEth(unmatchedEth);
    } catch {}
  }, [updateFlag]);

  useEffect(() => {
    udpatePoolData();
  }, [udpatePoolData]);

  const updatePoolTokenData = useCallback(async () => {
    try {
      const web3 = getEthWeb3();
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

      setLsdTotalSupply(Web3.utils.fromWei(lsdTotalSupply));
      setLsdRate(Web3.utils.fromWei(lsdRate));
      setMintedLsdToken(Web3.utils.fromWei(lsdTotalSupply));

      const nodeRewardsFileCid = await networkWithdrawContract.methods
        .nodeRewardsFileCid()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      const latestMerkleRootEpoch = await networkWithdrawContract.methods
        .latestMerkleRootEpoch()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      let poolEth =
        Number(lsdTotalSupply) * Number(Web3.utils.fromWei(lsdRate));

      const response = await fetch(
        `https://${nodeRewardsFileCid}.ipfs.dweb.link/${getLsdEthTokenContract().toLowerCase()}-rewards-${getEthereumChainId()}-${latestMerkleRootEpoch}.json`,
        {
          method: "GET",
          headers: {},
        }
      );

      // const resJson: RewardJsonResponse = await response.json();
      // const resJson = { List: [] };
      const resText = await response.text();
      var JSONbig = require("json-bigint");
      const resTextJson = JSONbig.parse(resText);

      const list: IpfsRewardItem[] = resTextJson.List?.map((item: any) => {
        return {
          ...item,
          totalRewardAmount: removeDecimals(item.totalRewardAmount.toFixed()),
          totalDepositAmount: removeDecimals(item.totalDepositAmount.toFixed()),
        };
      });

      const requests = list?.map((data) => {
        return (async () => {
          const totalClaimedRewardOfNode = await networkWithdrawContract.methods
            .totalClaimedRewardOfNode(data.address)
            .call()
            .catch((err: any) => {
              console.log({ err });
            });

          const totalClaimedDepositOfNode =
            await networkWithdrawContract.methods
              .totalClaimedDepositOfNode(data.address)
              .call()
              .catch((err: any) => {
                console.log({ err });
              });

          if (data.totalRewardAmount) {
            poolEth = poolEth + Number(data.totalRewardAmount);
          }
          if (data.totalDepositAmount) {
            poolEth = poolEth + Number(data.totalDepositAmount);
          }

          if (totalClaimedRewardOfNode) {
            poolEth = poolEth - Number(totalClaimedRewardOfNode);
          }
          if (totalClaimedDepositOfNode) {
            poolEth = poolEth - Number(totalClaimedDepositOfNode);
          }
        })();
      });

      await Promise.all(requests);

      // console.log({ poolEth });

      setPoolEth(Web3.utils.fromWei(formatScientificNumber(poolEth) + ""));
    } catch {
      setPoolEth("--");
    }
  }, [updateFlag]);

  useEffect(() => {
    updatePoolTokenData();
  }, [updatePoolTokenData]);

  return {
    depositedEth,
    depositedEthValue,
    mintedLsdToken,
    mintedLsdTokenValue,
    stakedToken,
    stakedTokenValue,
    allEth,
    allEthValue,
    poolEth,
    poolEthValue,
    unmatchedEth,
    stakeApr,
    validatorApr,
    matchedValidators,
  };
}
