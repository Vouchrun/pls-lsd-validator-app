import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getNetworkBalanceContract,
  getNetworkBalanceContractAbi,
  getNetworkWithdrawContract,
  getNetworkWithdrawContractAbi,
  getNodeDepositContract,
  getNodeDepositContractAbi,
} from "config/contract";
import { getEtherScanTxUrl } from "config/explorer";
import {
  CANCELLED_MESSAGE,
  COMMON_ERROR_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  TRANSACTION_FAILED_MESSAGE,
} from "constants/common";
import { AppThunk } from "redux/store";
import { isEvmTxCancelError, uuid } from "utils/commonUtils";
import snackbarUtil from "utils/snackbarUtils";
import { getShortAddress } from "utils/stringUtils";
import { createWeb3, getEthWeb3 } from "utils/web3Utils";
import {
  addNotice,
  setDepositLoadingParams,
  setValidatorStakeLoadingParams,
  setWithdrawLoadingParams,
  updateDepositLoadingParams,
  updateValidatorStakeLoadingParams,
  updateWithdrawLoadingParams,
} from "./AppSlice";
import { setEthTxLoading, updateEthBalance } from "./EthSlice";
import {
  ClaimProof,
  IpfsRewardItem,
  TokenWithdrawInfo,
  ValidatorClaimType,
} from "interfaces/common";
import { formatNumber } from "utils/numberUtils";
import { getTokenName } from "utils/configUtils";
import Web3 from "web3";
import dayjs from "dayjs";

export interface ValidatorState {
  validatorWithdrawalCredentials: string;
  claimRewardsLoading: boolean;
  withdrawLoading: boolean;
}

const initialState: ValidatorState = {
  validatorWithdrawalCredentials: "--",
  claimRewardsLoading: false,
  withdrawLoading: false,
};

export const validatorSlice = createSlice({
  name: "eth",
  initialState,
  reducers: {
    setValidatorWithdrawalCredentials: (
      state: ValidatorState,
      action: PayloadAction<string>
    ) => {
      state.validatorWithdrawalCredentials = action.payload;
    },
    setClaimRewardsLoading: (
      state: ValidatorState,
      action: PayloadAction<boolean>
    ) => {
      state.claimRewardsLoading = action.payload;
    },
    setWithdrawLoading: (
      state: ValidatorState,
      action: PayloadAction<boolean>
    ) => {
      state.withdrawLoading = action.payload;
    },
  },
});

export const {
  setValidatorWithdrawalCredentials,
  setClaimRewardsLoading,
  setWithdrawLoading,
} = validatorSlice.actions;

export default validatorSlice.reducer;

export const updateValidatorWithdrawalCredentials =
  (): AppThunk => async (dispatch, getState) => {
    try {
      let web3 = getEthWeb3();
      let contract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {
          // from: account,
        }
      );

      const res = await contract.methods.withdrawCredentials().call();
      dispatch(setValidatorWithdrawalCredentials(res.slice(2)));
      // console.log("res", res);
    } catch (err: unknown) {
      console.log("err", err);
    }
  };

export const handleEthValidatorDeposit =
  (
    validatorKeys: any[],
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const address = getState().wallet.metaMaskAccount;
      if (!address) {
        return;
      }

      dispatch(setEthTxLoading(true));
      dispatch(
        setDepositLoadingParams({
          modalVisible: true,
          status: "loading",
        })
      );

      const web3 = createWeb3();
      let nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {
          from: address,
        }
      );

      const pubkeys: string[] = [];
      const signatures: string[] = [];
      const depositDataRoots: string[] = [];

      validatorKeys.forEach((validatorKey) => {
        pubkeys.push("0x" + validatorKey.pubkey);
        signatures.push("0x" + validatorKey.signature);
        depositDataRoots.push("0x" + validatorKey.deposit_data_root);
      });

      console.log("pubkeys", pubkeys);
      console.log("signatures", signatures);
      console.log("depositDataRoots", depositDataRoots);

      const sendParams = {};

      {
        // let nodeManagerContract = new web3.eth.Contract(
        //   getStafiNodeManagerAbi(),
        //   ethContractConfig.stafiNodeManager
        // );
        // const exist = await nodeManagerContract.methods
        //   .getSuperNodeExists(address)
        //   .call();
        // if (!exist) {
        //   throw Error("Invalid trusted node");
        // }

        const depositEnabled = await nodeDepositContract.methods
          .trustNodeDepositEnabled()
          .call();
        if (!depositEnabled) {
          throw Error("Trusted node deposits are currently disabled");
        }

        const statusRequests = pubkeys.map((pubkey) => {
          return (async () => {
            const pubkeyInfoOf = await nodeDepositContract.methods
              .pubkeyInfoOf(pubkey)
              .call();
            const status = pubkeyInfoOf._status;
            return status;
          })();
        });

        const statusList = await Promise.all(statusRequests);

        console.log({ statusList });

        statusList.forEach((status, index) => {
          if (Number(status) !== 0) {
            throw Error(
              `pubkey ${getShortAddress(pubkeys[index], 10)} already exists`
            );
          }
        });

        //TODO
        // const accountPubkeyCount = await nodeDepositContract.methods
        //   .getSuperNodePubkeyCount(address)
        //   .call();

        // const pubkeyLimit = await nodeDepositContract.methods
        //   .trustNodePubkeyNumberLimit()
        //   .call();
        // if (Number(accountPubkeyCount) + pubkeys.length > pubkeyLimit) {
        //   throw Error("Pubkey amount over limit");
        // }
      }

      const result = await nodeDepositContract.methods
        .deposit(pubkeys, signatures, depositDataRoots)
        .send(sendParams);
      // console.log("result", result);

      dispatch(setEthTxLoading(false));
      callback && callback(result?.status, result);

      if (result?.status) {
        dispatch(
          updateDepositLoadingParams({
            status: "success",
          })
        );
        dispatch(
          addNotice({
            id: result.transactionHash,
            type: "Validator Deposit",
            txDetail: {
              transactionHash: result.transactionHash,
              sender: address || "",
            },
            data: {
              type: "trusted",
              amount: "0",
              pubkeys,
            },
            scanUrl: getEtherScanTxUrl(result.transactionHash),
            status: "Confirmed",
          })
        );
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: unknown) {
      dispatch(setEthTxLoading(false));
      if (isEvmTxCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setDepositLoadingParams(undefined));
      } else {
        // snackbarUtil.error((err as any).message);
        dispatch(
          updateDepositLoadingParams({
            status: "error",
            customMsg: (err as any).message,
          })
        );
      }
    }
  };

export const handleEthValidatorStake =
  (
    validatorKeys: any[],
    type: "solo" | "trusted",
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const address = getState().wallet.metaMaskAccount;

      dispatch(setEthTxLoading(true));
      const web3 = createWeb3();
      let nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {
          from: address,
        }
      );

      const pubkeys: string[] = [];
      const signatures: string[] = [];
      const depositDataRoots: string[] = [];

      validatorKeys.forEach((validatorKey) => {
        pubkeys.push("0x" + validatorKey.pubkey);
        signatures.push("0x" + validatorKey.signature);
        depositDataRoots.push("0x" + validatorKey.deposit_data_root);
      });

      // console.log("pubkeys", pubkeys);
      // console.log("signatures", signatures);
      // console.log("depositDataRoots", depositDataRoots);

      // dispatch(
      //   setEthValidatorStakeParams({
      //     pubkeys,
      //     type,
      //     status: "staking",
      //     txHash: "",
      //   })
      // );
      // dispatch(setEthValiatorStakeModalVisible(true));

      dispatch(setEthTxLoading(true));
      dispatch(
        setValidatorStakeLoadingParams({
          modalVisible: true,
          status: "loading",
          stakeAmount: 32 * validatorKeys.length + "",
        })
      );

      const result = await nodeDepositContract.methods
        .stake(pubkeys, signatures, depositDataRoots)
        .send();

      // console.log("result", result);

      dispatch(setEthTxLoading(false));
      callback && callback(result?.status, result);

      if (result?.status) {
        dispatch(
          updateValidatorStakeLoadingParams({
            status: "success",
            scanUrl: getEtherScanTxUrl(result.transactionHash),
          })
        );
        dispatch(
          addNotice({
            id: result.transactionHash,
            type: "Validator Stake",
            txDetail: {
              transactionHash: result.transactionHash,
              sender: address || "",
            },
            data: {
              type,
              amount: 32 * pubkeys.length + "",
              pubkeys,
            },
            scanUrl: getEtherScanTxUrl(result.transactionHash),
            status: "Confirmed",
          })
        );
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: unknown) {
      dispatch(setEthTxLoading(false));
      if (isEvmTxCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        // dispatch(setEthValiatorStakeModalVisible(false));
        dispatch(setValidatorStakeLoadingParams(undefined));
      } else {
        dispatch(
          updateValidatorStakeLoadingParams({
            status: "error",
            customMsg: (err as any).message,
          })
        );
      }
    }
  };

export const claimValidatorRewards =
  (
    ipfsRewardItem: IpfsRewardItem | undefined,
    // claimProof: ClaimProof,
    myClaimableReward: string,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    if (!ipfsRewardItem) {
      return;
    }
    const noticeUuid = uuid();

    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error("Please connect MetaMask");
      }

      const web3 = createWeb3();
      const contract = new web3.eth.Contract(
        getNetworkWithdrawContractAbi(),
        getNetworkBalanceContract(),
        {
          from: metaMaskAccount,
        }
      );

      dispatch(setClaimRewardsLoading(true));

      const formatProofs = ["0x" + ipfsRewardItem.proof];
      // if (!ipfsRewardItem.proof) {
      //   ipfsRewardItem.proof.forEach((item) => {
      //     const format = "0x" + item;
      //     // const format = Web3.utils.hexToAscii("0x" + item);
      //     // const format = Web3.utils.hexToBytes("0x" + item);
      //     // const format = "0x" + Web3.utils.padLeft(item, 64);
      //     // const format = Web3.utils.padRight(Web3.utils.fromAscii(item), 34);
      //     console.log("format", format);
      //     formatProofs.push(format);
      //   });
      // }

      const claimParams = [
        ipfsRewardItem.index,
        ipfsRewardItem.address,
        ipfsRewardItem.totalRewardAmount,
        ipfsRewardItem.totalExitDepositAmount,
        formatProofs,
        ValidatorClaimType.ClaimReward,
      ];
      // console.log("111", claimParams);
      const result = await contract.methods.nodeClaim(...claimParams).send();
      // console.log("222");

      callback && callback(result.status, result);
      dispatch(updateEthBalance());
      dispatch(setClaimRewardsLoading(false));

      // console.log("result", result);
      if (result && result.status) {
        const txHash = result.transactionHash;
        dispatch(
          addNotice({
            id: noticeUuid || "",
            type: "Claim Rewards",
            data: {
              rewardAmount: formatNumber(myClaimableReward),
              rewardTokenName: getTokenName(),
            },
            status: "Confirmed",
            scanUrl: getEtherScanTxUrl(txHash),
          })
        );

        // const withdrawInfo: TokenWithdrawInfo = {
        //   depositAmount: "0",
        //   rewardAmount: Web3.utils.toWei(myClaimableReward),
        //   totalAmount: Web3.utils.toWei(myClaimableReward),
        //   txHash,
        //   receivedAddress: metaMaskAccount,
        //   operateTimestamp: dayjs().unix(),
        //   timeLeft: 0,
        //   explorerUrl: getEtherScanTxUrl(txHash),
        //   status: 3,
        // };
        // addEthValidatorWithdrawRecords(withdrawInfo);

        snackbarUtil.success("Claim rewards success");
        callback && callback(true, {});
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: any) {
      console.log("errrrr", err);
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = COMMON_ERROR_MESSAGE;
      } else if (isEvmTxCancelError(err)) {
        displayMsg = CANCELLED_MESSAGE;
      }
      snackbarUtil.error(displayMsg);
    } finally {
      dispatch(setClaimRewardsLoading(false));
      dispatch(updateEthBalance());
    }
  };

export const withdrawValidatorEth =
  (
    ipfsRewardItem: IpfsRewardItem | undefined,
    withdrawAmount: string,
    myClaimableReward: string,
    isReTry: boolean,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    if (!ipfsRewardItem) {
      return;
    }
    const noticeUuid = uuid();

    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error("Please connect MetaMask");
      }

      const web3 = createWeb3();
      const contract = new web3.eth.Contract(
        getNetworkWithdrawContractAbi(),
        getNetworkWithdrawContract(),
        {
          from: metaMaskAccount,
        }
      );

      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: "loading",
          tokenAmount: withdrawAmount,
          customMsg: `Withdraw processing, please wait for a moment`,
        })
      );

      dispatch(
        updateWithdrawLoadingParams({
          customMsg: `Please confirm the ${formatNumber(
            withdrawAmount
          )} ${getTokenName()} withdraw transaction in your MetaMask wallet`,
        })
      );

      // const formatProofs = claimProof.proof.map((item) => {
      //   const format = "0x" + item;
      //   // const format = Web3.utils.hexToAscii("0x" + item);
      //   // const format = Web3.utils.hexToBytes("0x" + item);
      //   // const format = "0x" + Web3.utils.padLeft(item, 64);
      //   // const format = Web3.utils.padRight(Web3.utils.fromAscii(item), 34);
      //   // console.log("format", format);
      //   return format;
      // });

      const claimParams = [
        ipfsRewardItem.index,
        ipfsRewardItem.address,
        ipfsRewardItem.totalRewardAmount,
        ipfsRewardItem.totalExitDepositAmount,
        ["0x" + ipfsRewardItem.proof],
        ValidatorClaimType.ClaimAll,
      ];
      // console.log("111", claimParams);
      const result = await contract.methods.nodeClaim(...claimParams).send();

      callback && callback(result.status, result);
      dispatch(updateEthBalance());
      if (result && result.status) {
        const txHash = result.transactionHash;
        dispatch(
          updateWithdrawLoadingParams(
            {
              status: "success",
              txHash: txHash,
              scanUrl: getEtherScanTxUrl(txHash),
              customMsg: undefined,
            },
            (newParams) => {
              dispatch(
                addNotice({
                  id: noticeUuid || "",
                  type: "Withdraw",
                  data: {
                    tokenAmount: withdrawAmount,
                  },
                  status: "Confirmed",
                  scanUrl: getEtherScanTxUrl(txHash),
                })
              );
            }
          )
        );

        const withdrawInfo: TokenWithdrawInfo = {
          depositAmount: Web3.utils.toWei(
            Math.max(0, Number(withdrawAmount) - Number(myClaimableReward)) + ""
          ),
          rewardAmount: Web3.utils.toWei(myClaimableReward),
          totalAmount: Web3.utils.toWei(withdrawAmount),
          txHash,
          receivedAddress: metaMaskAccount,
          operateTimestamp: dayjs().unix(),
          timeLeft: 0,
          explorerUrl: getEtherScanTxUrl(txHash),
          status: 4,
        };
        // addEthValidatorWithdrawRecords(withdrawInfo);
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: any) {
      {
        console.log("errrrr", err);
        let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
        if (err.code === -32603) {
          displayMsg = CONNECTION_ERROR_MESSAGE;
        } else if (err.code === 4001) {
          snackbarUtil.error(CANCELLED_MESSAGE);
          dispatch(setWithdrawLoadingParams(undefined));
          return;
        }
        dispatch(
          updateWithdrawLoadingParams({
            status: "error",
            customMsg: displayMsg || "Unstake failed",
          })
        );
      }
    } finally {
      dispatch(setWithdrawLoading(false));
      dispatch(updateEthBalance());
    }
  };
