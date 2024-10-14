import LinearProgress, {
  linearProgressClasses,
} from '@mui/material/LinearProgress';
import { styled } from '@mui/styles';
import classNames from 'classnames';
import { BackNavigation } from 'components/common/BackNavigation';
import { CardContainer } from 'components/common/CardContainer';
import { CustomButton } from 'components/common/CustomButton';
import { DataLoading } from 'components/common/DataLoading';
import { PrimaryLoading } from 'components/common/PrimaryLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { ConfirmModal } from 'components/modal/ConfirmModal';
import { DepositGuide } from 'components/tokenStake/DepositGuide';
import { ValidatorKeyUpload } from 'components/tokenStake/ValidatorKeyUpload';
import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import {
  getEthereumChainId,
  getNetworkName,
  getTrustValidatorDepositAmount,
} from 'config/env';
import { robotoBold } from 'config/font';
import { FILE_NETWORK_NAME_KEY } from 'constants/common';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useAppSlice } from 'hooks/selector';
import { useIsTrustedValidator } from 'hooks/useIsTrustedValidator';
import { useUnmatchedToken } from 'hooks/useUnmatchedToken';
import { useWalletAccount } from 'hooks/useWalletAccount';
import Image from 'next/image';
import { useRouter } from 'next/router';
import fileIcon from 'public/images/file.svg';
import refreshIcon from 'public/images/refresh_icon.svg';
import errorIcon from 'public/images/tx_error.png';
import uploadIcon from 'public/images/upload.svg';
import { useMemo, useState } from 'react';
import { updateEthBalance } from 'redux/reducers/EthSlice';
import { handleEthValidatorDeposit } from 'redux/reducers/ValidatorSlice';
import { setMetaMaskDisconnected } from 'redux/reducers/WalletSlice';
import { RootState } from 'redux/store';
import { openLink } from 'utils/commonUtils';
import { getTokenName } from 'utils/configUtils';
import { formatNumber } from 'utils/numberUtils';
import { getEthWeb3 } from 'utils/web3Utils';
import { parseEther } from 'viem';
import { useConnect, useSwitchChain, useWriteContract } from 'wagmi';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 4,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: 'white',
  },
  [`&.${linearProgressClasses.bar}`]: {
    borderRadius: 4,
    backgroundColor: '#80CAFF',
  },
}));

const TrustDepositPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const [validatorKeys, setValidatorKeys] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [uploadingStatus, setUploadingStatus] = useState<
    'normal' | 'loading' | 'error'
  >('normal');
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] =
    useState(false);

  const { unmatchedEth } = useUnmatchedToken();

  const { metaMaskAccount, metaMaskChainId } = useWalletAccount();
  const { switchChain } = useSwitchChain();
  const { connectAsync, connectors } = useConnect();
  const { writeContractAsync } = useWriteContract();
  const { validatorWithdrawalCredentials, ethTxLoading } = useAppSelector(
    (state: RootState) => {
      return {
        metaMaskAccount: state.wallet.metaMaskAccount,
        validatorWithdrawalCredentials:
          state.validator.validatorWithdrawalCredentials,
        ethTxLoading: state.eth.txLoading,
      };
    }
  );

  const { isTrust } = useIsTrustedValidator();

  const isWrongMetaMaskNetwork = useMemo(() => {
    return Number(metaMaskChainId) !== getEthereumChainId();
  }, [metaMaskChainId]);

  const checkFileKeyFormat = (validatorKey: any) => {
    if (
      !validatorKey.deposit_data_root ||
      !validatorKey.signature ||
      !validatorKey.pubkey
    ) {
      throw new Error('Miss deposit_data_root or signature or pubkey');
    }
    if (
      BigInt(validatorKey.amount) !==
      parseEther((getTrustValidatorDepositAmount() + '') as `${number}`, 'gwei')
    ) {
      throw new Error(
        'Please use deposit_data file of trusted validator to deposit'
      );
    }
    if (
      validatorKey.withdrawal_credentials !== validatorWithdrawalCredentials
    ) {
      throw new Error(`Incorrect withdrawal_credentials value`);
    }
    const networkName = getNetworkName();
    if (validatorKey[FILE_NETWORK_NAME_KEY] !== networkName) {
      throw new Error(`Please use ${networkName} validator file to deposit`);
    }
  };

  const checkKeys = async (validatorKeys: any[]) => {
    try {
      setUploadingStatus('loading');

      const pubkeys: string[] = [];

      validatorKeys.forEach((validatorKey) => {
        pubkeys.push('0x' + validatorKey.pubkey);
      });

      const web3 = getEthWeb3();
      let nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {}
      );

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

      let hasRepeat = false;
      statusList.forEach((status, index) => {
        if (Number(status) !== 0) {
          hasRepeat = true;
        }
      });

      if (hasRepeat) {
        setUploadingStatus('error');
        setValidatorKeys([]);
      } else {
        setUploadingStatus('normal');
        setValidatorKeys(validatorKeys);
      }
    } catch (err: any) {
      setUploadingStatus('error');
      setValidatorKeys([]);
    }
  };

  return (
    <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto'>
      <BackNavigation
        onClick={() => {
          router.replace('/tokenStake/chooseType');
        }}
      />

      <div className='flex mt-[.24rem] items-start'>
        <CardContainer width='6.2rem' title='Trusted Validator Deposit'>
          <div className='flex flex-col items-center pb-[.24rem]'>
            <div className='mt-[.32rem] flex items-center text-[.14rem]'>
              <div
                className={classNames(
                  robotoBold.className,
                  'text-color-text1 flex items-center'
                )}
              >
                <div className='mr-[.04rem]'>
                  {unmatchedEth === undefined ? (
                    <DataLoading height='.14rem' />
                  ) : (
                    formatNumber(unmatchedEth, { hideDecimalsForZero: true })
                  )}
                </div>

                {getTokenName()}
              </div>

              <div className='ml-[.06rem] text-color-text2'>
                is waiting to be staked
              </div>

              <div
                className='ml-[.12rem] flex items-center text-[.14rem] text-color-text2 cursor-pointer'
                onClick={() => {
                  router.push('/poolData');
                }}
              >
                <div className='mr-[.06rem]'>Pool Status</div>
                <Icomoon
                  icon='arrow-right'
                  size='.13rem'
                  color={darkMode ? '#ffffff80' : '#6C86AD'}
                />
              </div>
            </div>

            <div className='mt-[.46rem]'>
              {!fileName ? (
                <ValidatorKeyUpload
                  checkValidatorKey={checkFileKeyFormat}
                  onSuccess={(validatorKeys, fileName) => {
                    setFileName(fileName);
                    checkKeys(validatorKeys);
                  }}
                >
                  <div>
                    <div className='flex flex-col items-center'>
                      <div className='w-[.5rem] h-[.6rem] relative'>
                        <Image src={uploadIcon} alt='upload' layout='fill' />
                      </div>

                      <div className='text-color-text2 text-[.14rem] mt-[.15rem]'>
                        Drag and drop file
                      </div>
                    </div>
                  </div>
                </ValidatorKeyUpload>
              ) : (
                <div className='max-h-[3rem] overflow-auto'>
                  <div
                    className={classNames(
                      'rounded-[.16rem] h-[.66rem] w-[4.5rem] flex items-center relative',
                      uploadingStatus === 'error'
                        ? 'bg-[#FF52C41A] border-dashed border-[0.01rem] border-[#FF52C4]'
                        : 'bg-color-bgPage'
                    )}
                  >
                    {uploadingStatus === 'normal' ? (
                      <div className='ml-[.2rem] w-[.22rem] h-[.27rem] relative'>
                        <Image src={fileIcon} layout='fill' alt='file' />
                      </div>
                    ) : uploadingStatus === 'loading' ? (
                      <div className='ml-[.2rem] w-[.22rem] h-[.22rem] relative'>
                        <PrimaryLoading size='.22rem' />
                      </div>
                    ) : (
                      <div className='ml-[.2rem] w-[.22rem] h-[.22rem] relative'>
                        <Image src={errorIcon} alt='error' layout='fill' />
                      </div>
                    )}

                    <div className='ml-[.2rem]'>
                      <div
                        className='text-color-text2 text-[.12rem] mr-[.4rem] leading-normal'
                        style={{
                          maxLines: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 2,
                          lineClamp: 2,
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        File{' '}
                        <span
                          className={classNames(
                            'text-color-text1',
                            robotoBold.className
                          )}
                        >
                          {fileName}
                        </span>{' '}
                        {uploadingStatus === 'normal'
                          ? ' uploaded successfully!'
                          : uploadingStatus === 'loading'
                          ? 'is uploading'
                          : 'already exist'}
                      </div>

                      {uploadingStatus === 'loading' && (
                        <div className='mt-[.08rem]'>
                          <LinearProgress
                            sx={{
                              color: '#80CAFF',
                              borderRadius: '.04rem',
                              backgroundColor: 'white',
                              // "& .MuiLinearProgress-barColorPrimary": {
                              //   backgroundColor: "white",
                              // },
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#80CAFF',
                              },
                            }}
                          />

                          {/* <BorderLinearProgress /> */}
                        </div>
                      )}
                    </div>

                    {uploadingStatus !== 'loading' && (
                      <div
                        className='absolute right-[.06rem] top-[.06rem] cursor-pointer'
                        onClick={() => {
                          // setFileName("");
                          // setValidatorKeys([]);
                          setDeleteConfirmModalVisible(true);
                        }}
                      >
                        <Icomoon
                          icon='close1'
                          size='.11rem'
                          color={darkMode ? '#ffffff80' : '#6C86AD'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {uploadingStatus === 'error' && (
              <div className='mt-[.2rem] flex items-center'>
                <ValidatorKeyUpload
                  checkValidatorKey={checkFileKeyFormat}
                  onSuccess={(validatorKeys, fileName) => {
                    setFileName(fileName);
                    checkKeys(validatorKeys);
                  }}
                >
                  <div className='w-[.14rem] h-[.14rem] relative'>
                    <Image src={refreshIcon} alt='refresh' layout='fill' />
                  </div>
                </ValidatorKeyUpload>

                <div
                  className='ml-[.28rem] cursor-pointer'
                  onClick={() => {
                    setDeleteConfirmModalVisible(true);
                  }}
                >
                  <Icomoon icon='delete' size='.14rem' color='#FF52C4' />
                </div>
              </div>
            )}

            <div className='self-stretch mx-[.24rem] mt-[.46rem]'>
              <CustomButton
                height='.56rem'
                loading={ethTxLoading}
                disabled={
                  !!metaMaskAccount &&
                  !isWrongMetaMaskNetwork &&
                  isTrust &&
                  (validatorKeys.length === 0 ||
                    isNaN(Number(unmatchedEth)) ||
                    Number(unmatchedEth) < validatorKeys.length)
                }
                type={
                  !metaMaskAccount || isWrongMetaMaskNetwork || !isTrust
                    ? 'secondary'
                    : 'primary'
                }
                onClick={async () => {
                  if (isWrongMetaMaskNetwork) {
                    await switchChain({ chainId: getEthereumChainId() });
                    return;
                  } else if (!metaMaskAccount) {
                    const metamaskConnector = connectors.find(
                      (c) => c.name === 'MetaMask'
                    );
                    if (!metamaskConnector) {
                      return;
                    }
                    try {
                      dispatch(setMetaMaskDisconnected(false));
                      await connectAsync({
                        chainId: getEthereumChainId(),
                        connector: metamaskConnector,
                      });
                    } catch (err: any) {
                      if (err.code === 4001) {
                      } else {
                        console.error(err);
                      }
                    }
                    return;
                  }

                  if (!isTrust) {
                    openLink('https://forms.gle/RtFK7qo9GzabQTCfA');
                    return;
                  }
                  dispatch(
                    handleEthValidatorDeposit(
                      writeContractAsync,
                      'trusted',
                      validatorKeys,
                      (success, result) => {
                        dispatch(updateEthBalance());
                        if (success) {
                          const pubkeys: string[] = [];

                          validatorKeys.forEach((validatorKey) => {
                            pubkeys.push('0x' + validatorKey.pubkey);
                          });

                          setValidatorKeys([]);
                          setFileName('');

                          // router.push(
                          //   {
                          //     pathname: "/eth/validator/check-deposit-file",
                          //     query: {
                          //       pubkeys,
                          //       type: "trusted",
                          //       txHash: result?.transactionHash,
                          //     },
                          //   },
                          //   "/eth/validator/check-deposit-file"
                          // );
                        }
                      }
                    )
                  );
                }}
              >
                {!metaMaskAccount
                  ? 'Connect Wallet'
                  : isWrongMetaMaskNetwork
                  ? 'Switch Network'
                  : !isTrust
                  ? 'Apply Trusted Validator'
                  : validatorKeys.length === 0
                  ? 'Please Upload 1 json file'
                  : ethTxLoading
                  ? 'Depositing, please wait for a moment...'
                  : !isNaN(Number(unmatchedEth)) &&
                    Number(unmatchedEth) < validatorKeys.length
                  ? `Insufficient ${getTokenName()} in pool`
                  : 'Deposit'}
              </CustomButton>
            </div>

            {validatorKeys.length > 0 && (
              <div className='mt-[.24rem] text-color-text2 text-[.14rem]'>
                <span className={classNames('text-color-text1')}>
                  {validatorKeys.length} Node Number
                </span>{' '}
                according to the file uploaded
              </div>
            )}
          </div>
        </CardContainer>

        <div className='ml-[.85rem]'>
          <DepositGuide />
        </div>
      </div>

      <ConfirmModal
        visible={deleteConfirmModalVisible}
        onClose={() => {
          setDeleteConfirmModalVisible(false);
        }}
        onConfirm={() => {
          setValidatorKeys([]);
          setFileName('');
          setDeleteConfirmModalVisible(false);
          setUploadingStatus('normal');
        }}
        title='Sure Delete?'
        content='Sure you want to delete this file?'
        confirmText='Yes, Delete'
      />
    </div>
  );
};

export default TrustDepositPage;
