import classNames from 'classnames';
import { BackNavigation } from 'components/common/BackNavigation';
import { CardContainer } from 'components/common/CardContainer';
import { CustomButton } from 'components/common/CustomButton';
import { Icomoon } from 'components/icon/Icomoon';
import { ConfirmModal } from 'components/modal/ConfirmModal';
import { StakeGuide } from 'components/tokenStake/StakeGuide';
import { ValidatorKeyUpload } from 'components/tokenStake/ValidatorKeyUpload';
import { ValidatorStakeLoading } from 'components/tokenStake/ValidatorStakeLoading';
import {
  getEthereumChainId,
  getNetworkName,
  getTrustValidatorDepositAmount,
  getValidatorTotalDepositAmount,
} from 'config/env';
import { robotoSemiBold } from 'config/font';
import { FILE_NETWORK_NAME_KEY } from 'constants/common';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useAppSlice } from 'hooks/selector';
import { useIsTrustedValidator } from 'hooks/useIsTrustedValidator';
import { useSoloDepositAmount } from 'hooks/useSoloDepositAmount';
import { useUnmatchedToken } from 'hooks/useUnmatchedToken';
import { useWalletAccount } from 'hooks/useWalletAccount';
import _ from 'lodash';
import Image from 'next/image';
import { useRouter } from 'next/router';
import checkedIcon from 'public/images/checked_circle.svg';
import uploadIcon from 'public/images/upload.svg';
import { useEffect, useMemo, useState } from 'react';
import { updateEthBalance } from 'redux/reducers/EthSlice';
import { handleEthValidatorStake } from 'redux/reducers/ValidatorSlice';
import { setMetaMaskDisconnected } from 'redux/reducers/WalletSlice';
import { RootState } from 'redux/store';
import { openLink } from 'utils/commonUtils';
import { getTokenName } from 'utils/configUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { getShortAddress } from 'utils/stringUtils';
import { parseEther } from 'viem';
import { useConnect, useSwitchChain, useWriteContract } from 'wagmi';

const StakePage = () => {
  const router = useRouter();
  const { type } = router.query;
  console.log({ type });
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const [validatorKeys, setValidatorKeys] = useState<any[]>([]);

  const { metaMaskAccount, metaMaskChainId } = useWalletAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const { connectAsync, connectors } = useConnect();
  const { soloDepositAmountInWei, soloDepositAmount } = useSoloDepositAmount();
  const { unmatchedEth } = useUnmatchedToken();

  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] =
    useState(false);
  const [waitDeletePubkeys, setWaitDeletePubkeys] = useState<string[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [editSelectedPubkeys, setEditSelectedPubkeys] = useState<string[]>([]);

  const isWrongMetaMaskNetwork = useMemo(() => {
    return Number(metaMaskChainId) !== getEthereumChainId();
  }, [metaMaskChainId]);

  const { isTrust } = useIsTrustedValidator();

  const {
    validatorWithdrawalCredentials,
    ethTxLoading,
    validatorStakeLoadingParams,
  } = useAppSelector((state: RootState) => {
    return {
      validatorWithdrawalCredentials:
        state.validator.validatorWithdrawalCredentials,
      ethTxLoading: state.eth.txLoading,
      validatorStakeLoadingParams: state.app.validatorStakeLoadingParams,
    };
  });

  useEffect(() => {
    const { pubkeyAddressList } = router.query;
    if (
      !pubkeyAddressList ||
      (Array.isArray(pubkeyAddressList) && pubkeyAddressList.length === 0)
    ) {
      router.push('/tokenStake/list');
    }
  }, [router]);

  const stakePubkeyAddressList = useMemo(() => {
    // return [
    //   "0xa781f3c716e0cca12b736c610ac5b39d6bf082772fc4952248884f6cdc1cc2184a9a116ed8a38e61582b6706eee6630a",
    // ];
    const { pubkeyAddressList } = router.query;
    if (!Array.isArray(pubkeyAddressList)) {
      return [pubkeyAddressList];
    }
    return pubkeyAddressList;
  }, [router]);

  const checkUploadPubkey = (validatorKey: any) => {
    if (
      !validatorKey.deposit_data_root ||
      !validatorKey.signature ||
      !validatorKey.pubkey
    ) {
      throw new Error('Miss deposit_data_root or signature or pubkey');
    }
    if (type === 'solo') {
      if (
        parseEther(
          (getValidatorTotalDepositAmount() + '') as `${number}`,
          'wei'
        ) -
          parseEther((validatorKey.amount + '') as `${number}`, 'gwei') !==
        BigInt(soloDepositAmountInWei || '0')
      ) {
        throw new Error(
          'Please use stake_data file of solo validator to stake'
        );
      }
    } else {
      if (
        BigInt(validatorKey.amount) !==
        parseEther(
          (getValidatorTotalDepositAmount() -
            getTrustValidatorDepositAmount() +
            '') as `${number}`,
          'gwei'
        )
      ) {
        throw new Error(
          'Please use stake_data file of trusted validator to stake'
        );
      }
    }

    if (
      validatorKey.withdrawal_credentials !== validatorWithdrawalCredentials
    ) {
      throw new Error(`Incorrect withdrawal_credentials value`);
    }
    const networkName = getNetworkName();
    if (validatorKey[FILE_NETWORK_NAME_KEY] !== networkName) {
      throw new Error(`Please use ${networkName} validator file to stake`);
    }
  };

  const handleNewValidaorKeys = (newValidatorKeys: any[]) => {
    const oldValidatorKeys = [...validatorKeys];
    let hasUnmatched = false;
    newValidatorKeys.forEach((validatorKey) => {
      if (stakePubkeyAddressList.indexOf('0x' + validatorKey.pubkey) < 0) {
        hasUnmatched = true;
        return;
      }
      const exist = oldValidatorKeys.find(
        (item) => item.pubkey === validatorKey.pubkey
      );
      if (!exist) {
        oldValidatorKeys.push(validatorKey);
      }
    });

    setValidatorKeys([...oldValidatorKeys]);
    if (hasUnmatched) {
      // snackbarUtil.error("Unmatched Pubkey");
    }
  };

  return (
    <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto'>
      <BackNavigation
        onClick={() => {
          router.replace('/tokenStake/list');
        }}
      />

      <div className='flex mt-[.24rem] items-start'>
        {validatorStakeLoadingParams?.modalVisible ? (
          <ValidatorStakeLoading />
        ) : (
          <CardContainer width='6.2rem' title='Stake'>
            <div className='flex flex-col items-center'>
              <div className='mt-[.56rem]'>
                <ValidatorKeyUpload
                  // disabled={
                  //   stakePubkeyAddressList.length === validatorKeys.length
                  // }
                  disabled={!soloDepositAmountInWei}
                  checkValidatorKey={checkUploadPubkey}
                  onSuccess={handleNewValidaorKeys}
                >
                  <div className='flex flex-col items-center'>
                    <div className='w-[.5rem] h-[.6rem] relative'>
                      <Image src={uploadIcon} alt='upload' layout='fill' />
                    </div>

                    <div className='text-color-text2 text-[.14rem] mt-[.15rem]'>
                      Please follow the instruction and upload{' '}
                      {stakePubkeyAddressList.length}{' '}
                      {stakePubkeyAddressList.length <= 1
                        ? 'Pubkey'
                        : 'Pubkeys'}
                    </div>
                  </div>
                </ValidatorKeyUpload>
              </div>

              <div
                className={classNames(
                  'mt-[.32rem] w-[5.7rem] max-h-[3rem] overflow-auto bg-color-bgPage rounded-[.1rem]',
                  validatorKeys.length > 0 ? '' : 'hidden'
                )}
              >
                <div className='bg-color-bg3 rounded-t-[.1rem] h-[.42rem] flex items-center justify-between px-[.32rem]'>
                  <div
                    className={classNames(
                      'text-color-text1 text-[.14rem]',
                      robotoSemiBold.className
                    )}
                  >
                    {validatorKeys.length}{' '}
                    {validatorKeys.length > 1 ? 'files' : 'file'} Uploaded
                  </div>

                  {editMode ? (
                    <div className='flex items-center'>
                      <CustomButton
                        disabled={editSelectedPubkeys.length === 0}
                        fontSize='.14rem'
                        height='.26rem'
                        className='px-[.12rem]'
                        onClick={() => {
                          setWaitDeletePubkeys([...editSelectedPubkeys]);
                          setDeleteConfirmModalVisible(true);
                        }}
                      >
                        Delete Selection
                        {editSelectedPubkeys.length > 0
                          ? ` (${editSelectedPubkeys.length})`
                          : ''}
                      </CustomButton>

                      <div
                        className='ml-[.16rem] px-[.16rem] flex items-center h-[.26rem] rounded-[.2rem] border-[.01rem] border-solid border-[#6C86AD4D]'
                        onClick={() => {
                          setEditMode(false);
                        }}
                      >
                        <div className='cursor-pointer' onClick={() => {}}>
                          <Icomoon
                            size='.15rem'
                            color={darkMode ? '#ffffff80' : '#6C86AD'}
                            icon='edit'
                          />
                        </div>

                        <div className='ml-[.24rem] cursor-pointer'>
                          <Icomoon
                            icon='complete-outline'
                            color={darkMode ? '#ffffff80' : '#6C86AD'}
                            size='.12rem'
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center'>
                      <ValidatorKeyUpload
                        // disabled={
                        //   stakePubkeyAddressList.length === validatorKeys.length
                        // }
                        disabled={!soloDepositAmountInWei}
                        checkValidatorKey={checkUploadPubkey}
                        onSuccess={handleNewValidaorKeys}
                      >
                        <div className=''>
                          <Icomoon
                            size='.16rem'
                            color={darkMode ? '#E8EFFD' : '#1B1B1F'}
                            icon='file_add'
                          />
                        </div>
                      </ValidatorKeyUpload>

                      <div
                        className='ml-[.16rem] cursor-pointer'
                        onClick={() => {
                          setEditSelectedPubkeys([]);
                          setEditMode(true);
                        }}
                      >
                        <Icomoon
                          size='.16rem'
                          color={darkMode ? '#E8EFFD' : '#1B1B1F'}
                          icon='edit'
                        />
                      </div>

                      <div
                        className='ml-[.16rem] cursor-pointer'
                        onClick={() => {
                          setWaitDeletePubkeys(
                            validatorKeys.map((item) => item.pubkey)
                          );
                          setDeleteConfirmModalVisible(true);
                        }}
                      >
                        <Icomoon
                          size='.16rem'
                          color={darkMode ? '#E8EFFD' : '#1B1B1F'}
                          icon='delete'
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className='pt-[.06rem] pb-[.18rem] flex flex-col items-center'>
                  {validatorKeys.map((item, index) => (
                    <div
                      key={index}
                      className={classNames(
                        'mt-[.12rem] rounded-[.1rem] h-[.42rem] w-[5.2rem] flex items-center justify-between px-[.16rem]',
                        editMode ? 'cursor-pointer' : ''
                      )}
                      style={{
                        background:
                          editMode &&
                          editSelectedPubkeys.indexOf(item.pubkey) >= 0
                            ? 'linear-gradient(0deg, rgba(0, 243, 171, 0.1), rgba(0, 243, 171, 0.1)), linear-gradient(0deg, rgba(0, 243, 171, 0.1), rgba(0, 243, 171, 0.1))'
                            : darkMode
                            ? '#6C86AD80'
                            : '#DEE6F7',
                        border:
                          editMode &&
                          editSelectedPubkeys.indexOf(item.pubkey) >= 0
                            ? '1px solid #00F3AB80'
                            : 'none',
                      }}
                      onClick={() => {
                        if (editMode) {
                          if (editSelectedPubkeys.indexOf(item.pubkey) >= 0) {
                            setEditSelectedPubkeys(
                              _.without(editSelectedPubkeys, item.pubkey)
                            );
                          } else {
                            setEditSelectedPubkeys([
                              ...editSelectedPubkeys,
                              item.pubkey,
                            ]);
                          }
                        }
                      }}
                    >
                      {editMode && (
                        <div className='mr-[.12rem]'>
                          {editSelectedPubkeys.indexOf(item.pubkey) >= 0 ? (
                            <div className='w-[.16rem] h-[.16rem] relative'>
                              <Image
                                src={checkedIcon}
                                layout='fill'
                                alt='checked'
                              />
                            </div>
                          ) : (
                            <div className='w-[.16rem] h-[.16rem] rounded-full border-solid border-[1px] border-[#9DAFBE]' />
                          )}
                        </div>
                      )}

                      <div
                        className='flex-1 text-color-text2 text-[.12rem] mr-[.4rem] leading-normal'
                        style={{
                          maxLines: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 1,
                          lineClamp: 1,
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {getShortAddress(item.pubkey, 20)}
                      </div>

                      <div
                        className={classNames(
                          'cursor-pointer w-[.16rem] min-w-[.16rem]',
                          editMode ? 'hidden' : ''
                        )}
                        onClick={() => {
                          setWaitDeletePubkeys([item.pubkey]);
                          setDeleteConfirmModalVisible(true);
                        }}
                      >
                        <Icomoon
                          icon='delete'
                          size='.16rem'
                          color={darkMode ? '#ffffff80' : '#6C86AD'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='self-stretch mx-[.24rem] mt-[.46rem] mb-[.32rem]'>
                <CustomButton
                  height='.56rem'
                  loading={ethTxLoading}
                  type={
                    !metaMaskAccount ||
                    isWrongMetaMaskNetwork ||
                    (!isTrust && type === 'trusted')
                      ? 'secondary'
                      : 'primary'
                  }
                  disabled={
                    !!metaMaskAccount &&
                    !isWrongMetaMaskNetwork &&
                    (isTrust || type !== 'trusted') &&
                    validatorKeys.length < stakePubkeyAddressList.length
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

                    if (type === 'trusted' && !isTrust) {
                      openLink('https://forms.gle/RtFK7qo9GzabQTCfA');
                      return;
                    }

                    if (
                      type === 'solo' &&
                      Number(unmatchedEth) <
                        validatorKeys.length *
                          (getValidatorTotalDepositAmount() -
                            Number(soloDepositAmount))
                    ) {
                      snackbarUtil.error(
                        `Insufficient ${getTokenName()} in pool`
                      );
                      return;
                    }

                    if (
                      type === 'trusted' &&
                      Number(unmatchedEth) <
                        validatorKeys.length *
                          (getValidatorTotalDepositAmount() -
                            getTrustValidatorDepositAmount())
                    ) {
                      snackbarUtil.error(
                        `Insufficient ${getTokenName()} in pool`
                      );
                      return;
                    }

                    dispatch(
                      handleEthValidatorStake(
                        writeContractAsync,
                        validatorKeys,
                        type as 'solo' | 'trusted',
                        (success, result) => {
                          dispatch(updateEthBalance());
                          if (success) {
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
                    : !isTrust && type === 'trusted'
                    ? 'Apply Trusted Validator'
                    : validatorKeys.length < stakePubkeyAddressList.length
                    ? `Please Upload ${stakePubkeyAddressList.length} ${
                        stakePubkeyAddressList.length <= 1
                          ? 'Pubkey'
                          : 'Pubkeys'
                      }`
                    : `Stake (${validatorKeys.length} Uploaded)`}
                </CustomButton>
              </div>
            </div>
          </CardContainer>
        )}

        <div className='ml-[.85rem]'>
          <StakeGuide />
        </div>
      </div>

      <ConfirmModal
        visible={deleteConfirmModalVisible}
        onClose={() => {
          setDeleteConfirmModalVisible(false);
        }}
        onConfirm={() => {
          setDeleteConfirmModalVisible(false);
          const newValidatorKeys = validatorKeys.filter(
            (item) => waitDeletePubkeys.indexOf(item.pubkey) < 0
          );
          setValidatorKeys(newValidatorKeys);
          if (newValidatorKeys.length === 0) {
            setEditMode(false);
          }
        }}
        title='Sure Delete?'
        content={
          waitDeletePubkeys.length > 1
            ? `Sure you want to delete all of those ${validatorKeys.length} pubkeys?`
            : 'Sure you want to delete this pubkey?'
        }
        confirmText='Yes, Delete'
      />
    </div>
  );
};

export default StakePage;
