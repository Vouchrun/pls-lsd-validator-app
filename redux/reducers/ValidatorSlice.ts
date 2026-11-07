import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getMultiSendContract,
  getNetworkProposalContract,
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';
import {
  getMultiSendContractAbi,
  getNetworkProposalContractAbi,
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
  getSafeMultiContractAbi,
} from 'config/contractAbi';
import {
  getEthereumChainId,
  getTrustValidatorDepositAmount,
  getValidatorTotalDepositAmount,
} from 'config/env';
import { getEtherScanTxUrl } from 'config/explorer';
import {
  CANCELLED_MESSAGE,
  COMMON_ERROR_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  TRANSACTION_FAILED_MESSAGE,
} from 'constants/common';
import dayjs from 'dayjs';
import { getNodeRewardItemsForAddresses } from 'hooks/useNodeUnclaimedRewards';
import {
  IpfsRewardItem,
  NodePubkeyInfo,
  TokenWithdrawInfo,
  ValidatorClaimType,
} from 'interfaces/common';
import { SweepItem, SweepProgress, SweepRunResult } from 'interfaces/sweep';
import { AppThunk } from 'redux/store';
import { fetchBeaconStatusInChunks } from 'utils/apiUtils';
import { isEvmTxCancelError, uuid } from 'utils/commonUtils';
import { getTokenName } from 'utils/configUtils';
import { formatNumber, formatScientificNumber } from 'utils/numberUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { getShortAddress } from 'utils/stringUtils';
import {
  clearSweepSession,
  loadSweepSession,
  saveSweepSession,
  StoredSweepItem,
  StoredSweepSession,
} from 'utils/sweepSession';
import { createWeb3, getEthWeb3, executeWithRpcFallback } from 'utils/web3Utils';
import { parseEther } from 'viem';
import Web3 from 'web3';
import {
  addNotice,
  setDepositLoadingParams,
  setUpdateFlag,
  setValidatorStakeLoadingParams,
  setWithdrawLoadingParams,
  updateDepositLoadingParams,
  updateValidatorStakeLoadingParams,
  updateWithdrawLoadingParams,
} from './AppSlice';
import { setEthTxLoading, updateEthBalance } from './EthSlice';
import { waitForTransactionReceipt } from 'utils/web3receipt';

export interface ValidatorState {
  validatorWithdrawalCredentials: string;
  claimRewardsLoading: boolean;
  withdrawLoading: boolean;
  nodePubkeys: NodePubkeyInfo[] | undefined;
  sweepProgress: SweepProgress;
}

const initialState: ValidatorState = {
  validatorWithdrawalCredentials: '--',
  claimRewardsLoading: false,
  withdrawLoading: false,
  nodePubkeys: undefined,
  sweepProgress: { phase: 'idle', signed: 0, total: 0 },
};

export const validatorSlice = createSlice({
  name: 'eth',
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
    setNodePubkeys: (
      state: ValidatorState,
      action: PayloadAction<NodePubkeyInfo[]>
    ) => {
      state.nodePubkeys = action.payload;
    },
    setSweepProgress: (
      state: ValidatorState,
      action: PayloadAction<SweepProgress>
    ) => {
      state.sweepProgress = action.payload;
    },
    updateSweepProgress: (
      state: ValidatorState,
      action: PayloadAction<Partial<SweepProgress>>
    ) => {
      state.sweepProgress = {
        ...state.sweepProgress,
        ...action.payload,
      };
    },
  },
});

export const {
  setValidatorWithdrawalCredentials,
  setClaimRewardsLoading,
  setWithdrawLoading,
  setNodePubkeys,
  setSweepProgress,
  updateSweepProgress,
} = validatorSlice.actions;

export default validatorSlice.reducer;

export const updateValidatorWithdrawalCredentials =
  (): AppThunk => async (dispatch, getState) => {
    try {
      await executeWithRpcFallback(async (web3) => {
        let contract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {
            // from: account,
          }
        );

        const res = await contract.methods.withdrawCredentials().call();
        dispatch(setValidatorWithdrawalCredentials(res.slice(2)));
      });
    } catch (err: unknown) {}
  };

export const updateNodePubkeys = (): AppThunk => async (dispatch, getState) => {
  try {
    const nodeAddress = getState().wallet.metaMaskAccount;

    if (!nodeAddress) {
      dispatch(setNodePubkeys([]));
      return;
    }

    await executeWithRpcFallback(async (web3) => {
      const nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {
          from: nodeAddress,
        }
      );

      const pubkeysOfNode = await nodeDepositContract.methods
        .getPubkeysOfNode(nodeAddress)
        .call();

      if (pubkeysOfNode.length === 0) {
        dispatch(setNodePubkeys([]));
        return;
      }

      const [pubkeyInfos, beaconStatusResponses] = await Promise.all([
        Promise.all(
          pubkeysOfNode.map((pubkeyAddress: string) =>
            nodeDepositContract.methods.pubkeyInfoOf(pubkeyAddress).call()
          )
        ),
        fetchBeaconStatusInChunks(pubkeysOfNode),
      ]);

      const beaconStatusResJson = beaconStatusResponses.flatMap(
        (response) => response.data
      );

      const nodePubkeyInfos: NodePubkeyInfo[] = pubkeyInfos.map((item: any, index: number) => {
        const matchedBeaconData = beaconStatusResJson?.find(
          (item: any) => item.validator?.pubkey === pubkeysOfNode[index]
        );
        const type = item._nodeDepositAmount === 0 ? 'solo' : 'trusted';

        return {
          pubkeyAddress: pubkeysOfNode[index],
          beaconApiStatus: matchedBeaconData?.status?.toUpperCase() || undefined,
          type,
          ...item,
        };
      });

      dispatch(setNodePubkeys(nodePubkeyInfos));
    });
  } catch (err: any) {
    console.log({ err });
  }
};

export const handleEthValidatorDeposit =
  (
    writeContractAsync: Function,
    type: 'solo' | 'trusted',
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
          status: 'loading',
        })
      );

      const pubkeys: string[] = [];
      const signatures: string[] = [];
      const depositDataRoots: string[] = [];

      validatorKeys.forEach((validatorKey) => {
        pubkeys.push('0x' + validatorKey.pubkey);
        signatures.push('0x' + validatorKey.signature);
        depositDataRoots.push('0x' + validatorKey.deposit_data_root);
      });

      let sendParams: any = {};
      let solodepositAmount: any;

      await executeWithRpcFallback(async (web3) => {
        let nodeDepositContract = new web3.eth.Contract(
          getNodeDepositContractAbi(),
          getNodeDepositContract(),
          {
            from: address,
          }
        );

        if (type === 'solo') {
          const depositEnabled = await nodeDepositContract.methods
            .soloNodeDepositEnabled()
            .call();
          if (!depositEnabled) {
            throw Error('Solo node deposits are currently disabled');
          }
        } else {
          const nodeInfoOf = await nodeDepositContract.methods
            .nodeInfoOf(address)
            .call();

          if (nodeInfoOf._removed) {
            throw Error('Node already removed');
          }

          const trustNodePubkeyNumberLimit = await nodeDepositContract.methods
            .trustNodePubkeyNumberLimit()
            .call();

          const pubkeysOfNode = await nodeDepositContract.methods
            .getPubkeysOfNode(address)
            .call();

          if (
            Number(trustNodePubkeyNumberLimit) <
            pubkeysOfNode.length + validatorKeys.length
          ) {
            throw Error('Pubkey amount over limit');
          }

          const depositEnabled = await nodeDepositContract.methods
            .trustNodeDepositEnabled()
            .call();
          if (!depositEnabled) {
            throw Error('Trusted node deposits are currently disabled');
          }
        }

        if (type === 'solo') {
          const res = await nodeDepositContract.methods
            .soloNodeDepositAmount()
            .call();
          solodepositAmount = res;
          // value: formatScientificNumber(res * validatorKeys.length),
          sendParams = {
            value: web3.utils.toWei(
              (+web3.utils.fromWei(res) * validatorKeys.length).toString()
            ),
          };
        }

        {
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
        }
      });
      await writeContractAsync(
        {
          abi: getNodeDepositContractAbi(),
          address: getNodeDepositContract() as `0x${string}`,
          functionName: 'deposit',
          args: [pubkeys, signatures, depositDataRoots],
          value: sendParams.value,
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              await executeWithRpcFallback(async (web3) => {
                const result = await waitForTransactionReceipt(web3, data);
                dispatch(setEthTxLoading(false));
                callback && callback(result?.status, result);

                if (result?.status) {
                  dispatch(
                    updateDepositLoadingParams({
                      status: 'success',
                    })
                  );
                  dispatch(
                    addNotice({
                      id: result.transactionHash,
                      type: 'Validator Deposit',
                      txDetail: {
                        transactionHash: result.transactionHash,
                        sender: address || '',
                      },
                      data: {
                        type: type === 'solo' ? 'solo' : 'trusted',
                        amount:
                          type === 'solo'
                            ? Web3.utils.fromWei(solodepositAmount)
                            : '0',
                        pubkeys,
                      },
                      scanUrl: getEtherScanTxUrl(result.transactionHash),
                      status: 'Confirmed',
                    })
                  );
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              });
            }
          },
          onError: (error: any) => {
            console.log(error);
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: unknown) {
      dispatch(setEthTxLoading(false));
      if (isEvmTxCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setDepositLoadingParams(undefined));
      } else {
        // snackbarUtil.error((err as any).message);
        dispatch(
          updateDepositLoadingParams({
            status: 'error',
            customMsg: (err as any).message,
          })
        );
      }
    }
  };

export const handleEthValidatorStake =
  (
    writeContractAsync: Function,
    validatorKeys: any[],
    type: 'solo' | 'trusted',
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const address = getState().wallet.metaMaskAccount;

      dispatch(setEthTxLoading(true));
      const web3 = getEthWeb3();

      const pubkeys: string[] = [];
      const signatures: string[] = [];
      const depositDataRoots: string[] = [];

      validatorKeys.forEach((validatorKey) => {
        pubkeys.push('0x' + validatorKey.pubkey);
        signatures.push('0x' + validatorKey.signature);
        depositDataRoots.push('0x' + validatorKey.deposit_data_root);
      });

      dispatch(setEthTxLoading(true));
      dispatch(
        setValidatorStakeLoadingParams({
          modalVisible: true,
          status: 'loading',
          stakeAmount:
            getValidatorTotalDepositAmount() * validatorKeys.length + '',
        })
      );

      await writeContractAsync(
        {
          abi: getNodeDepositContractAbi(),
          address: getNodeDepositContract() as `0x${string}`,
          functionName: 'stake',
          args: [pubkeys, signatures, depositDataRoots],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              await executeWithRpcFallback(async (web3) => {
                const result = await waitForTransactionReceipt(web3, data);
                dispatch(setEthTxLoading(false));
                callback && callback(result?.status, result);

                if (result?.status) {
                  dispatch(
                    updateValidatorStakeLoadingParams({
                      status: 'success',
                      scanUrl: getEtherScanTxUrl(result.transactionHash),
                    })
                  );
                  dispatch(
                    addNotice({
                      id: result.transactionHash,
                      type: 'Validator Stake',
                      txDetail: {
                        transactionHash: result.transactionHash,
                        sender: address || '',
                      },
                      data: {
                        type,
                        amount:
                          getValidatorTotalDepositAmount() * pubkeys.length + '',
                        pubkeys,
                      },
                      scanUrl: getEtherScanTxUrl(result.transactionHash),
                      status: 'Confirmed',
                    })
                  );
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              });
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: unknown) {
      dispatch(setEthTxLoading(false));
      if (isEvmTxCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setValidatorStakeLoadingParams(undefined));
      } else {
        dispatch(
          updateValidatorStakeLoadingParams({
            status: 'error',
            customMsg: (err as any).message,
          })
        );
      }
    }
  };

export const claimValidatorRewards =
  (
    writeContractAsync: Function,
    ipfsRewardItem: IpfsRewardItem | undefined,
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
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      dispatch(setClaimRewardsLoading(true));

      const formatProofs = ipfsRewardItem.proof
        .split(':')
        .map((item) => '0x' + item);

      const claimParams = [
        ipfsRewardItem.index,
        ipfsRewardItem.address,
        ipfsRewardItem.totalRewardAmount,
        ipfsRewardItem.totalExitDepositAmount,
        formatProofs,
        ValidatorClaimType.ClaimReward,
      ];

      await writeContractAsync(
        {
          abi: getNetworkWithdrawContractAbi(),
          address: getNetworkWithdrawContract() as `0x${string}`,
          functionName: 'nodeClaim',
          args: [...claimParams],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              await executeWithRpcFallback(async (web3) => {
                const result = await waitForTransactionReceipt(web3, data);
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                dispatch(setClaimRewardsLoading(false));

                if (result && result.status) {
                  const txHash = result.transactionHash;
                  dispatch(
                    addNotice({
                      id: noticeUuid || '',
                      type: 'Claim Rewards',
                      data: {
                        rewardAmount: formatNumber(myClaimableReward),
                        rewardTokenName: getTokenName(),
                      },
                      status: 'Confirmed',
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

                  snackbarUtil.success('Claim rewards success');
                  callback && callback(true, {});
                  dispatch(setUpdateFlag(dayjs().unix()));
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              });
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
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

export const batchClaimValidatorRewards =
  (
    writeContractAsync: Function,
    nodeAddresses: string[],
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    if (!nodeAddresses || nodeAddresses.length === 0) {
      return;
    }

    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      dispatch(setClaimRewardsLoading(true));

      const items = await getNodeRewardItemsForAddresses(nodeAddresses, web3);
      if (items.length === 0) {
        throw new Error('No claimable rewards for selected nodes');
      }

      const networkWithdrawContract = new web3.eth.Contract(
        getNetworkWithdrawContractAbi(),
        getNetworkWithdrawContract(),
        {}
      );

      const claimableItemsFromRewards: IpfsRewardItem[] = [];
      for (const item of items) {
        const totalClaimedRewardOfNode = await networkWithdrawContract.methods
          .totalClaimedRewardOfNode(item.address)
          .call();
        if (
          BigInt(item.totalRewardAmount) - BigInt(totalClaimedRewardOfNode) >
          0n
        ) {
          claimableItemsFromRewards.push(item);
        }
      }

      if (claimableItemsFromRewards.length === 0) {
        throw new Error('No claimable rewards for selected nodes');
      }

      let transactions = '0x';
      for (const item of claimableItemsFromRewards) {
        const formatProofs = item.proof.split(':').map((p) => '0x' + p);
        const calldata = networkWithdrawContract.methods
          .nodeClaim(
            item.index,
            item.address,
            item.totalRewardAmount,
            item.totalExitDepositAmount,
            formatProofs,
            ValidatorClaimType.ClaimReward
          )
          .encodeABI();
        const to = getNetworkWithdrawContract().toLowerCase().replace(/^0x/, '');
        const value = '0'.repeat(64);
        const dataLength = ((calldata.length - 2) / 2)
          .toString(16)
          .padStart(64, '0');
        const operation = '00';
        transactions +=
          operation + to + value + dataLength + calldata.replace(/^0x/, '');
      }

      await writeContractAsync(
        {
          abi: getMultiSendContractAbi(),
          address: getMultiSendContract() as `0x${string}`,
          functionName: 'multiSend',
          args: [transactions],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              await executeWithRpcFallback(async (web3) => {
                const result = await waitForTransactionReceipt(web3, data);
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                dispatch(setClaimRewardsLoading(false));

                if (result && result.status) {
                  snackbarUtil.success('Batch claim rewards success');
                  callback && callback(true, {});
                  dispatch(setUpdateFlag(dayjs().unix()));
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              });
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
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

const SAFE_TX_TYPES = {
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Some providers return v as 0/1; Safe 1.3.0 only accepts 27/28. */
function normalizeSafeSignature(rawSignature: string): string {
  const vValue = parseInt(rawSignature.slice(-2), 16);
  if (Number.isNaN(vValue) || vValue >= 27) {
    return rawSignature;
  }
  return (
    rawSignature.slice(0, -2) + (vValue + 27).toString(16).padStart(2, '0')
  );
}

/** Turn a Safe / EVM revert into something an operator can act on. */
function describeSweepError(error: any): string {
  const revertData = error?.data;
  if (typeof revertData === 'string' && revertData.startsWith('0x08c379a0')) {
    const hex = revertData.slice(2);
    const length = parseInt(hex.slice(72, 136), 16);
    let reason = '';
    for (let i = 136; i < 136 + length * 2; i += 2) {
      reason += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    if (reason) {
      return reason;
    }
  }
  if (typeof revertData === 'string' && revertData.length >= 10) {
    return `revert ${revertData.slice(0, 10)}`;
  }
  return error?.shortMessage || error?.message || 'unknown error';
}

function isSignatureRejection(error: any): boolean {
  const message = `${error?.message || ''} ${
    error?.shortMessage || ''
  }`.toLowerCase();
  return (
    error?.code === 4001 ||
    error?.code === 'ACTION_REJECTED' ||
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('rejected the request')
  );
}

interface SafeNonceAndBalance {
  nonce: string;
  balance: string;
}

async function readSafeNonceAndBalance(
  web3: Web3,
  address: string
): Promise<SafeNonceAndBalance> {
  const safe = new web3.eth.Contract(getSafeMultiContractAbi(), address, {});
  const [nonce, balance] = await Promise.all([
    safe.methods.nonce().call(),
    web3.eth.getBalance(address),
  ]);
  return { nonce: nonce.toString(), balance: balance.toString() };
}

function isContractCallRevert(error: any): boolean {
  const message = `${error?.message || ''} ${
    error?.shortMessage || ''
  }`.toLowerCase();
  return (
    !!error?.data ||
    message.includes('revert') ||
    message.includes('call exception')
  );
}

/**
 * Validate a candidate without producing a signature.
 *
 * Ownership is checked on-chain (`getOwners`) rather than inferred from the
 * page gate. That is the difference between "I signed fourteen times and
 * everything reverted" and "this wallet is not an owner of that Safe".
 */
async function preflightSweepItem(
  web3: Web3,
  address: string,
  signer: string
): Promise<SweepItem> {
  const base: SweepItem = {
    address,
    balance: '0',
    nonce: '0',
    owners: [],
    status: 'ok',
  };

  // Transport errors propagate so executeWithRpcFallback can retry on the
  // next RPC; only semantic failures are classified here.
  const code = await web3.eth.getCode(address);
  if (!code || code === '0x') {
    return { ...base, status: 'not_a_safe', reason: 'Not a contract (EOA)' };
  }

  const safe = new web3.eth.Contract(getSafeMultiContractAbi(), address, {});

  let owners: string[];
  try {
    owners = await safe.methods.getOwners().call();
  } catch (error) {
    if (isContractCallRevert(error)) {
      return {
        ...base,
        status: 'not_a_safe',
        reason: 'Contract does not expose Safe getOwners()',
      };
    }
    throw error;
  }

  const normalizedOwners = owners.map((owner) => owner.toLowerCase());
  base.owners = normalizedOwners;

  if (!normalizedOwners.includes(signer.toLowerCase())) {
    return {
      ...base,
      status: 'not_owner',
      reason: 'Connected wallet is not an owner of this Safe',
    };
  }

  const threshold = await safe.methods.getThreshold().call();
  if (Number(threshold) !== 1) {
    return {
      ...base,
      status: 'threshold_unsupported',
      reason: `Safe threshold is ${threshold}; only 1-of-N Safes are supported`,
    };
  }

  const { nonce, balance } = await readSafeNonceAndBalance(web3, address);
  base.nonce = nonce;
  base.balance = balance;

  if (BigInt(balance) === 0n) {
    return {
      ...base,
      status: 'zero_balance',
      reason: 'No PLS balance to sweep',
    };
  }

  return base;
}

/**
 * Sign one Safe transaction and pre-flight the exact `execTransaction` call.
 * Throws on rejection or simulation failure; the caller decides whether that
 * excludes the Safe or stops the run.
 */
async function signAndSimulateSweepItem(
  web3: Web3,
  item: SweepItem,
  destination: string,
  chainId: number,
  signTypedDataAsync: Function
): Promise<string> {
  const safe = new web3.eth.Contract(getSafeMultiContractAbi(), item.address, {});

  const rawSignature = await signTypedDataAsync({
    domain: {
      chainId,
      verifyingContract: item.address,
    },
    types: SAFE_TX_TYPES,
    primaryType: 'SafeTx',
    message: {
      to: destination,
      value: item.balance,
      data: '0x',
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ZERO_ADDRESS,
      refundReceiver: ZERO_ADDRESS,
      nonce: item.nonce,
    },
  });

  const signature = normalizeSafeSignature(rawSignature);

  const calldata = safe.methods
    .execTransaction(
      destination,
      item.balance,
      '0x',
      0,
      '0',
      '0',
      '0',
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      signature
    )
    .encodeABI();

  await executeWithRpcFallback(async (rpcWeb3) =>
    rpcWeb3.eth.call({
      to: item.address,
      data: calldata,
      from: getMultiSendContract(),
    })
  );

  return signature;
}

function packMultiSendEntry(to: string, calldata: string): string {
  const address = to.toLowerCase().replace(/^0x/, '');
  const value = '0'.repeat(64);
  const dataLength = ((calldata.length - 2) / 2)
    .toString(16)
    .padStart(64, '0');
  return '00' + address + value + dataLength + calldata.replace(/^0x/, '');
}

/**
 * Sweep TVA Safe balances to a destination EOA in one MultiSend transaction.
 *
 * Flow: pre-flight (no prompts) -> sign + simulate each Safe (one prompt per
 * Safe) -> re-validate nonce/balance -> one `multiSend`. A failing Safe is
 * excluded instead of reverting the whole batch, signatures are persisted so
 * a refresh can resume, and an unconfirmed earlier submission blocks a retry.
 */
export const batchSweepValidatorRewards =
  (
    writeContractAsync: Function,
    signTypedDataAsync: Function,
    nodeAddresses: string[],
    destination: string,
    options?: {
      dryRun?: boolean;
      preflightOnly?: boolean;
      onResult?: (result: SweepRunResult) => void;
    }
  ): AppThunk =>
  async (dispatch, getState) => {
    const dryRun = options?.dryRun === true;
    const preflightOnly = options?.preflightOnly === true;
    const report = (result: SweepRunResult) => options?.onResult?.(result);

    if (!nodeAddresses || nodeAddresses.length === 0) {
      return;
    }

    const wallet = getState().wallet;
    const signer = wallet.metaMaskDisconnected
      ? undefined
      : wallet.metaMaskAccount;

    if (!signer) {
      snackbarUtil.error('Please connect MetaMask');
      return;
    }

    const web3 = getEthWeb3();
    const trimmedDestination = (destination || '').trim();

    if (!trimmedDestination || !web3.utils.isAddress(trimmedDestination)) {
      const message = 'Invalid sweep destination address';
      snackbarUtil.error(message);
      report({ items: [], signer, dryRun, error: message });
      return;
    }

    const destinationAddress = web3.utils.toChecksumAddress(trimmedDestination);
    const chainId = Number(getEthereumChainId());
    const signerLower = signer.toLowerCase();
    const items: SweepItem[] = [];

    dispatch(setClaimRewardsLoading(true));
    dispatch(
      setSweepProgress({
        phase: 'preflight',
        signed: 0,
        total: nodeAddresses.length,
      })
    );

    try {
      // Never stack a second sweep on top of an unconfirmed first one.
      const previous = loadSweepSession();
      const reusable = new Map<string, StoredSweepItem>();

      if (
        previous &&
        previous.chainId === chainId &&
        previous.signer.toLowerCase() === signerLower
      ) {
        if (previous.submittedTxHash) {
          const receipt = await executeWithRpcFallback(
            async (rpcWeb3) =>
              rpcWeb3.eth.getTransactionReceipt(
                previous.submittedTxHash as string
              ),
            1
          ).catch(() => null);

          if (!receipt) {
            throw new Error(
              `A previous sweep is still pending (${previous.submittedTxHash}). ` +
                'Wait for it to confirm before starting another.'
            );
          }
          clearSweepSession();
        } else if (previous.submitting) {
          throw new Error(
            'A previous sweep submission is unconfirmed. Check your wallet or ' +
              'explorer before retrying.'
          );
        } else if (
          previous.destination &&
          previous.destination.toLowerCase() ===
            destinationAddress.toLowerCase()
        ) {
          previous.items.forEach((stored) =>
            reusable.set(stored.address.toLowerCase(), stored)
          );
        }
      } else if (previous) {
        clearSweepSession();
      }

      // 1. Pre-flight. No wallet prompts happen before every Safe is checked.
      for (const address of nodeAddresses) {
        dispatch(updateSweepProgress({ phase: 'preflight', address }));
        let item: SweepItem;
        try {
          item = await executeWithRpcFallback((rpcWeb3) =>
            preflightSweepItem(rpcWeb3, address, signerLower)
          );
        } catch (error) {
          item = {
            address,
            balance: '0',
            nonce: '0',
            owners: [],
            status: 'rpc_error',
            reason: describeSweepError(error),
          };
        }
        items.push(item);
      }

      const candidates = items.filter((item) => item.status === 'ok');

      if (candidates.length === 0) {
        report({ items, destination: destinationAddress, signer, dryRun });
        snackbarUtil.error('No sweepable Safe balances for the selected nodes');
        return;
      }

      if (preflightOnly) {
        report({ items, destination: destinationAddress, signer, dryRun });
        return;
      }

      // 2. Sign + simulate. A failing Safe is excluded; a rejected prompt
      //    stops the run but leaves the collected signatures resumable.
      const session: StoredSweepSession = {
        version: 1,
        destination: destinationAddress,
        signer,
        chainId,
        createdAt: Date.now(),
        items: [],
      };
      // Sliding TTL: only an idle session expires, not one that is mid-signing.
      const persist = () => {
        session.createdAt = Date.now();
        saveSweepSession(session);
      };

      let signedCount = 0;
      dispatch(
        setSweepProgress({
          phase: 'signing',
          signed: 0,
          total: candidates.length,
        })
      );

      for (const item of candidates) {
        dispatch(
          updateSweepProgress({
            phase: 'signing',
            address: item.address,
            signed: signedCount,
          })
        );

        try {
          const fresh = await executeWithRpcFallback((rpcWeb3) =>
            readSafeNonceAndBalance(rpcWeb3, item.address)
          );

          if (
            fresh.nonce !== item.nonce ||
            BigInt(fresh.balance) < BigInt(item.balance)
          ) {
            item.status = 'stale';
            item.reason = 'Nonce or balance changed during sign-up';
            continue;
          }

          item.nonce = fresh.nonce;
          item.balance = fresh.balance;

          // Reuse a signature collected before a refresh when it still matches.
          const stored = reusable.get(item.address.toLowerCase());
          if (
            stored &&
            stored.nonce === item.nonce &&
            stored.balance === item.balance
          ) {
            try {
              const safe = new web3.eth.Contract(
                getSafeMultiContractAbi(),
                item.address,
                {}
              );
              const calldata = safe.methods
                .execTransaction(
                  destinationAddress,
                  item.balance,
                  '0x',
                  0,
                  '0',
                  '0',
                  '0',
                  ZERO_ADDRESS,
                  ZERO_ADDRESS,
                  stored.signature
                )
                .encodeABI();
              await executeWithRpcFallback(async (rpcWeb3) =>
                rpcWeb3.eth.call({
                  to: item.address,
                  data: calldata,
                  from: getMultiSendContract(),
                })
              );

              item.signature = stored.signature;
              item.status = 'signed';
              signedCount += 1;
              session.items.push(stored);
              persist();
              dispatch(updateSweepProgress({ signed: signedCount }));
              continue;
            } catch {
              // Signature went stale: ask for a new one below.
            }
          }

          item.signature = await signAndSimulateSweepItem(
            web3,
            item,
            destinationAddress,
            chainId,
            signTypedDataAsync
          );
          item.status = 'signed';
          signedCount += 1;

          session.items.push({
            address: item.address,
            balance: item.balance,
            nonce: item.nonce,
            signature: item.signature,
          });
          persist();
          dispatch(updateSweepProgress({ signed: signedCount }));
        } catch (error: any) {
          if (isSignatureRejection(error)) {
            report({
              items,
              destination: destinationAddress,
              signer,
              dryRun,
              error: 'Signature cancelled',
            });
            snackbarUtil.error(CANCELLED_MESSAGE);
            return;
          }
          item.status = 'simulation_failed';
          item.reason = describeSweepError(error);
        }
      }

      const signedItems = items.filter((item) => item.status === 'signed');

      if (signedItems.length === 0) {
        report({ items, destination: destinationAddress, signer, dryRun });
        snackbarUtil.error('No Safe passed signing and simulation');
        return;
      }

      if (dryRun) {
        report({ items, destination: destinationAddress, signer, dryRun });
        snackbarUtil.success(
          `Dry run OK: ${signedItems.length} Safe${
            signedItems.length === 1 ? '' : 's'
          } signed and simulated`
        );
        return;
      }

      // 3. Re-validate the signed payloads immediately before broadcasting.
      dispatch(
        setSweepProgress({
          phase: 'executing',
          signed: signedItems.length,
          total: signedItems.length,
        })
      );

      const executable: SweepItem[] = [];
      for (const item of signedItems) {
        const fresh = await executeWithRpcFallback((rpcWeb3) =>
          readSafeNonceAndBalance(rpcWeb3, item.address)
        ).catch(() => null);

        if (
          !fresh ||
          fresh.nonce !== item.nonce ||
          BigInt(fresh.balance) < BigInt(item.balance)
        ) {
          item.status = 'stale';
          item.reason = 'Nonce or balance changed after signing';
          continue;
        }
        executable.push(item);
      }

      if (executable.length === 0) {
        report({ items, destination: destinationAddress, signer, dryRun });
        snackbarUtil.error('All signatures became stale; nothing was sent');
        return;
      }

      let transactions = '0x';
      for (const item of executable) {
        const safe = new web3.eth.Contract(
          getSafeMultiContractAbi(),
          item.address,
          {}
        );
        const calldata = safe.methods
          .execTransaction(
            destinationAddress,
            item.balance,
            '0x',
            0,
            '0',
            '0',
            '0',
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            item.signature as string
          )
          .encodeABI();
        transactions += packMultiSendEntry(item.address, calldata);
      }

      session.items = executable.map((item) => ({
        address: item.address,
        balance: item.balance,
        nonce: item.nonce,
        signature: item.signature as string,
      }));
      session.submitting = true;
      persist();

      const hash = (await writeContractAsync({
        abi: getMultiSendContractAbi(),
        address: getMultiSendContract() as `0x${string}`,
        functionName: 'multiSend',
        args: [transactions],
      })) as string | undefined;

      if (!hash) {
        throw new Error('Wallet did not return a transaction hash');
      }

      session.submitting = false;
      session.submittedTxHash = hash;
      persist();

      const receipt = await waitForTransactionReceipt(web3, hash, {
        timeoutMs: 180_000,
      });

      if (!receipt || !receipt.status) {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }

      clearSweepSession();
      dispatch(setUpdateFlag(dayjs().unix()));
      report({
        items,
        destination: destinationAddress,
        signer,
        dryRun,
        txHash: hash,
      });
      snackbarUtil.success(
        `Batch sweep submitted: ${executable.length} Safe${
          executable.length === 1 ? '' : 's'
        }`
      );
    } catch (err: any) {
      let displayMsg = err?.message || TRANSACTION_FAILED_MESSAGE;
      if (err?.code === -32603) {
        displayMsg = COMMON_ERROR_MESSAGE;
      } else if (isSignatureRejection(err)) {
        displayMsg = CANCELLED_MESSAGE;
      }
      snackbarUtil.error(displayMsg);
      report({
        items,
        destination: destinationAddress,
        signer,
        dryRun,
        error: displayMsg,
      });
    } finally {
      dispatch(setClaimRewardsLoading(false));
      dispatch(updateSweepProgress({ phase: 'done' }));
      dispatch(updateEthBalance());
    }
  };

export const withdrawValidatorEth =
  (
    writeContractAsync: Function,
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
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: 'loading',
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

      const formatProofs = ipfsRewardItem.proof
        .split(':')
        .map((item) => '0x' + item);

      const claimParams = [
        ipfsRewardItem.index,
        ipfsRewardItem.address,
        ipfsRewardItem.totalRewardAmount,
        ipfsRewardItem.totalExitDepositAmount,
        formatProofs,
        ValidatorClaimType.ClaimAll,
      ];

      await writeContractAsync(
        {
          abi: getNetworkWithdrawContractAbi(),
          address: getNetworkWithdrawContract() as `0x${string}`,
          functionName: 'nodeClaim',
          args: [...claimParams],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              await executeWithRpcFallback(async (web3) => {
                const result = await waitForTransactionReceipt(web3, data);
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                if (result && result.status) {
                  const txHash = result.transactionHash;
                  dispatch(
                    updateWithdrawLoadingParams(
                      {
                        status: 'success',
                        txHash: txHash,
                        scanUrl: getEtherScanTxUrl(txHash),
                        customMsg: undefined,
                      },
                      (newParams) => {
                        dispatch(
                          addNotice({
                            id: noticeUuid || '',
                            type: 'Withdraw',
                            data: {
                              tokenAmount: withdrawAmount,
                            },
                            status: 'Confirmed',
                            scanUrl: getEtherScanTxUrl(txHash),
                          })
                        );
                      }
                    )
                  );

                  const withdrawInfo: TokenWithdrawInfo = {
                    depositAmount: Web3.utils.toWei(
                      Math.max(
                        0,
                        Number(withdrawAmount) - Number(myClaimableReward)
                      ) + ''
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
              });
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
      {
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
            status: 'error',
            customMsg: displayMsg || 'Unstake failed',
          })
        );
      }
    } finally {
      dispatch(setWithdrawLoading(false));
      dispatch(updateEthBalance());
    }
  };

export const addTrustNode =
  (
    writeContractAsync: Function,
    trustNodeAddress: string,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      await writeContractAsync(
        {
          abi: getNodeDepositContractAbi(),
          address: getNodeDepositContract() as `0x${string}`,
          functionName: 'addTrustNode',
          args: [trustNodeAddress],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              await executeWithRpcFallback(async (web3) => {
                const result = await waitForTransactionReceipt(web3, data);
                if (result.status) {
                  callback && callback(result.status, result);
                  dispatch(updateEthBalance());
                  if (result && result.status) {
                    const txHash = result.transactionHash;
                    console.log(txHash);
                  } else {
                    throw new Error(TRANSACTION_FAILED_MESSAGE);
                  }
                }
              });
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
      {
        let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
        if (err.code === -32603) {
          displayMsg = CONNECTION_ERROR_MESSAGE;
        } else if (err.code === 4001) {
          snackbarUtil.error(CANCELLED_MESSAGE);

          return;
        }
      }
    } finally {
      dispatch(updateEthBalance());
    }
  };

export const removeTrustNode =
  (
    writeContractAsync: Function,
    trustNodeAddress: string,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      await writeContractAsync(
        {
          abi: getNodeDepositContractAbi(),
          address: getNodeDepositContract() as `0x${string}`,
          functionName: 'removeTrustNode',
          args: [trustNodeAddress],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              const result = await waitForTransactionReceipt(web3, data);
              if (result.status) {
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                if (result && result.status) {
                  const txHash = result.transactionHash;
                  console.log(txHash);
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              }
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
      {
        let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
        if (err.code === -32603) {
          displayMsg = CONNECTION_ERROR_MESSAGE;
        } else if (err.code === 4001) {
          snackbarUtil.error(CANCELLED_MESSAGE);
          return;
        }
      }
    } finally {
      dispatch(updateEthBalance());
    }
  };

export const removeAddress =
  (
    writeContractAsync: Function,
    voterAddress: string,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      await writeContractAsync(
        {
          abi: getNetworkProposalContractAbi(),
          address: getNetworkProposalContract() as `0x${string}`,
          functionName: 'removeAddress',
          args: [voterAddress],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              const result = await waitForTransactionReceipt(web3, data);
              if (result.status) {
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                if (result && result.status) {
                  const txHash = result.transactionHash;
                  console.log(txHash);
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              }
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
      {
        let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
        if (err.code === -32603) {
          displayMsg = CONNECTION_ERROR_MESSAGE;
        } else if (err.code === 4001) {
          snackbarUtil.error(CANCELLED_MESSAGE);
          return;
        }
      }
    } finally {
      dispatch(updateEthBalance());
    }
  };

export const addAddress =
  (
    writeContractAsync: Function,
    voterAddress: string,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error('Please connect MetaMask');
      }

      const web3 = getEthWeb3();

      await writeContractAsync(
        {
          abi: getNetworkProposalContractAbi(),
          address: getNetworkProposalContract() as `0x${string}`,
          functionName: 'addAddress',
          args: [voterAddress],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              const result = await waitForTransactionReceipt(web3, data);
              if (result.status) {
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                if (result && result.status) {
                  const txHash = result.transactionHash;
                  console.log(txHash);
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              }
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (err.code === 4001) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        return;
      }
    } finally {
      dispatch(updateEthBalance());
    }
  };

export const withDrawAdmin =
  (
    writeContractAsync: Function,
    distributionAddress: string,
    callback?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error('Please connect MetaMask');
      }

      const web3 = createWeb3();

      await writeContractAsync(
        {
          abi: getNetworkWithdrawContractAbi(),
          address: getNetworkWithdrawContract() as `0x${string}`,
          functionName: 'platformClaim',
          args: [distributionAddress],
        },
        {
          onSuccess: (data: any) => {
            if (data.Message == 'deny')
              throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
          onSettled: async (data: any, error: any) => {
            if (error) {
              console.error('Transaction settled with error:', error);
            } else {
              const result = await waitForTransactionReceipt(web3, data);
              if (result.status) {
                callback && callback(result.status, result);
                dispatch(updateEthBalance());
                if (result && result.status) {
                  const txHash = result.transactionHash;
                  console.log(txHash);
                } else {
                  throw new Error(TRANSACTION_FAILED_MESSAGE);
                }
              }
            }
          },
          onError: (error: any) => {
            throw new Error(TRANSACTION_FAILED_MESSAGE);
          },
        }
      );
    } catch (err: any) {
      {
        let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
        if (err.code === -32603) {
          displayMsg = CONNECTION_ERROR_MESSAGE;
        } else if (err.code === 4001) {
          snackbarUtil.error(CANCELLED_MESSAGE);
          return;
        }
      }
    } finally {
      dispatch(updateEthBalance());
    }
  };
