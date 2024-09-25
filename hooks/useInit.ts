import { metaMask } from 'connectors/metaMask';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import {
  setDarkMode,
  setUnreadNoticeFlag,
  setUpdateFlag,
} from 'redux/reducers/AppSlice';
import {
  updateEthBalance,
  updateEthLatestBlockTimestamp,
} from 'redux/reducers/EthSlice';
import { updateApr } from 'redux/reducers/LsdEthSlice';
import {
  updateNodePubkeys,
  updateValidatorWithdrawalCredentials,
} from 'redux/reducers/ValidatorSlice';
import {
  setMetaMaskAccount,
  setMetaMaskChainId,
  setMetaMaskDisconnected,
} from 'redux/reducers/WalletSlice';
import {
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_DISCONNECT_METAMASK,
  STORAGE_KEY_UNREAD_NOTICE,
  getStorage,
} from 'utils/storageUtils';
import { useAccount, useChainId } from 'wagmi';
import { useAppDispatch } from './common';
import { useAppSlice } from './selector';
import { useInterval } from './useInterval';
import { useWalletAccount } from './useWalletAccount';

declare const window: { ethereum: any };
declare const ethereum: any;

export function useInit() {
  const dispatch = useAppDispatch();
  const { updateFlag, darkMode } = useAppSlice();

  const { address: metaMaskAccount } = useAccount();
  const chainId = useChainId();

  const { metaMaskAccount: walletMetaMaskAccount, metaMaskChainId } =
    useWalletAccount();

  useEffect(() => {
    // Init local data.
    const unreadNotice = getStorage(STORAGE_KEY_UNREAD_NOTICE);
    dispatch(setUnreadNoticeFlag(!!unreadNotice));
    dispatch(
      setMetaMaskDisconnected(!!getStorage(STORAGE_KEY_DISCONNECT_METAMASK))
    );
    const darkMode = JSON.parse(getStorage(STORAGE_KEY_DARK_MODE) || 'true');
    dispatch(setDarkMode(darkMode));
  }, [dispatch]);

  useEffect(() => {
    if (dispatch && updateFlag) {
      // Query eth latest block timestamp
      dispatch(updateEthLatestBlockTimestamp());
      // query apr
      dispatch(updateApr());
      // Query validator withdrawCredentials
      dispatch(updateValidatorWithdrawalCredentials());
    }
  }, [updateFlag, dispatch]);

  useInterval(() => {
    dispatch(setUpdateFlag(dayjs().unix()));
  }, 6000); // 6s

  // useEffect(() => {
  //   if (!metaMaskAccount) {
  //     metaMask.connectEagerly();
  //   }
  //   // dispatch(setMetaMaskAccount("0x99F7C7c951dEF272ee5638eA7Cc731b1f09B12e0"));
  //   if (metaMaskAccount) {
  //     dispatch(setMetaMaskAccount(metaMaskAccount));
  //   }
  // }, [dispatch, metaMaskAccount]);

  useEffect(() => {
    dispatch(setMetaMaskChainId(chainId + ''));
  }, [dispatch, chainId]);

  // Update wallet balances.
  useEffect(() => {
    dispatch(updateEthBalance());
  }, [dispatch, walletMetaMaskAccount, metaMaskChainId, updateFlag]);

  // Query user node pubkeys
  useEffect(() => {
    if (dispatch && updateFlag) {
      dispatch(updateNodePubkeys());
    }
  }, [updateFlag, dispatch, walletMetaMaskAccount]);

  // Change body backgroundColor
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#1B1B1F' : '#E8EFFD';
  }, [darkMode]);
}
