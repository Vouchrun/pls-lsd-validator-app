import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import {
  addNoticeInternal,
  LocalNotice,
  updateNoticeInternal,
} from 'utils/noticeUtils';
import {
  getStorage,
  removeStorage,
  saveStorage,
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_UNREAD_NOTICE,
} from 'utils/storageUtils';

export interface DepositLoadingParams {
  modalVisible?: boolean;
  status?: 'loading' | 'success' | 'error';
  customMsg?: string;
}

export interface ValidatorStakeLoadingParams {
  modalVisible?: boolean;
  status?: 'loading' | 'success' | 'error';
  customMsg?: string;
  stakeAmount?: string;
  scanUrl?: string;
}

export interface WithdrawLoadingParams {
  modalVisible?: boolean;
  status?: 'loading' | 'success' | 'error';
  tokenAmount?: string;
  scanUrl?: string;
  txHash?: string;
  customMsg?: string;
}

export interface AppState {
  darkMode: boolean;
  collapseOpenId: string | undefined;
  updateFlag: number;
  unreadNoticeFlag: boolean;
  stakeLoading: boolean;
  unstakeLoading: boolean;
  withdrawLoading: boolean;
  depositLoadingParams: DepositLoadingParams | undefined;
  validatorStakeLoadingParams: ValidatorStakeLoadingParams | undefined;
  withdrawLoadingParams: WithdrawLoadingParams | undefined;
  noticeDrawerOpen: boolean;
  settingsDrawerOpen: boolean;
}

const initialState: AppState = {
  darkMode: true,
  collapseOpenId: undefined,
  updateFlag: 0,
  unreadNoticeFlag: false,
  stakeLoading: false,
  unstakeLoading: false,
  withdrawLoading: false,
  depositLoadingParams: undefined,
  validatorStakeLoadingParams: undefined,
  // withdrawLoadingParams: {
  //   modalVisible: true,
  //   status: "loading",
  //   scanUrl: "xxx",
  //   tokenAmount: "32",
  // },
  withdrawLoadingParams: undefined,
  noticeDrawerOpen: false,
  settingsDrawerOpen: false,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setDarkMode: (state: AppState, action: PayloadAction<boolean>) => {
      saveStorage(STORAGE_KEY_DARK_MODE, JSON.stringify(action.payload));
      const darkMode = JSON.parse(getStorage(STORAGE_KEY_DARK_MODE) || 'false');
      state.darkMode = action.payload ?? darkMode;
    },
    setCollapseOpenId: (
      state: AppState,
      action: PayloadAction<string | undefined>
    ) => {
      state.collapseOpenId = action.payload;
    },
    setUpdateFlag: (state: AppState, action: PayloadAction<number>) => {
      state.updateFlag = action.payload;
    },
    setUnreadNoticeFlag: (state: AppState, action: PayloadAction<boolean>) => {
      if (action.payload) {
        saveStorage(STORAGE_KEY_UNREAD_NOTICE, '1');
      } else {
        removeStorage(STORAGE_KEY_UNREAD_NOTICE);
      }
      state.unreadNoticeFlag = action.payload;
    },
    setStakeLoading: (state: AppState, action: PayloadAction<boolean>) => {
      state.stakeLoading = action.payload;
    },
    setUnstakeLoading: (state: AppState, action: PayloadAction<boolean>) => {
      state.unstakeLoading = action.payload;
    },
    setWithdrawLoading: (state: AppState, action: PayloadAction<boolean>) => {
      state.withdrawLoading = action.payload;
    },
    setDepositLoadingParams: (
      state: AppState,
      action: PayloadAction<DepositLoadingParams | undefined>
    ) => {
      state.depositLoadingParams = action.payload;
    },
    setValidatorStakeLoadingParams: (
      state: AppState,
      action: PayloadAction<ValidatorStakeLoadingParams | undefined>
    ) => {
      state.validatorStakeLoadingParams = action.payload;
    },
    setWithdrawLoadingParams: (
      state: AppState,
      action: PayloadAction<WithdrawLoadingParams | undefined>
    ) => {
      state.withdrawLoadingParams = action.payload;
    },
    setNoticeDrawerOpen: (state: AppState, action: PayloadAction<boolean>) => {
      state.noticeDrawerOpen = action.payload;
    },
    setSettingsDrawerOpen: (
      state: AppState,
      action: PayloadAction<boolean>
    ) => {
      state.settingsDrawerOpen = action.payload;
    },
  },
});

export const {
  setDarkMode,
  setCollapseOpenId,
  setUpdateFlag,
  setUnreadNoticeFlag,
  setStakeLoading,
  setUnstakeLoading,
  setWithdrawLoading,
  setDepositLoadingParams,
  setValidatorStakeLoadingParams,
  setWithdrawLoadingParams,
  setNoticeDrawerOpen,
  setSettingsDrawerOpen,
} = appSlice.actions;

export default appSlice.reducer;

export const updateDepositLoadingParams =
  (
    depositLoadingParams: DepositLoadingParams,
    cb?: (newParams: DepositLoadingParams | undefined) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    let newParams;
    if (!depositLoadingParams) {
      newParams = undefined;
    } else {
      newParams = {
        ...getState().app.depositLoadingParams,
        ...depositLoadingParams,
      };
    }

    dispatch(setDepositLoadingParams(newParams));
    cb && cb(newParams);
  };

export const updateValidatorStakeLoadingParams =
  (
    validatorStakeLoadingParams: ValidatorStakeLoadingParams,
    cb?: (newParams: ValidatorStakeLoadingParams | undefined) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    let newParams;
    if (!validatorStakeLoadingParams) {
      newParams = undefined;
    } else {
      newParams = {
        ...getState().app.validatorStakeLoadingParams,
        ...validatorStakeLoadingParams,
      };
    }

    dispatch(setValidatorStakeLoadingParams(newParams));
    cb && cb(newParams);
  };

export const updateWithdrawLoadingParams =
  (
    withdrawLoadingParams: WithdrawLoadingParams,
    cb?: (newParams: WithdrawLoadingParams | undefined) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    let newParams;
    if (!withdrawLoadingParams) {
      newParams = undefined;
    } else {
      newParams = {
        ...getState().app.withdrawLoadingParams,
        ...withdrawLoadingParams,
      };
    }

    dispatch(setWithdrawLoadingParams(newParams));
    cb && cb(newParams);
  };

/**
 * add notice record
 */
export const addNotice =
  (notice: LocalNotice): AppThunk =>
  async (dispatch, getState) => {
    addNoticeInternal(notice);
    dispatch(setUnreadNoticeFlag(true));
  };

/**
 * update notice status
 */
export const updateNotice =
  (id: string | undefined, newNotice: Partial<LocalNotice>): AppThunk =>
  async (dispatch, getState) => {
    if (!id) {
      return;
    }
    updateNoticeInternal(id, newNotice);
    dispatch(setUnreadNoticeFlag(true));
  };
