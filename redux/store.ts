import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import appReducer from './reducers/AppSlice';
import walletReducer from './reducers/WalletSlice';
import ethReducer from './reducers/EthSlice';
import lsdEthReducer from './reducers/LsdEthSlice';
import validatorReducer from './reducers/ValidatorSlice';
import validatorNodeAddressStateReducer from './reducers/ValidatorNodeAddress';

export const store = configureStore({
  reducer: {
    app: appReducer,
    wallet: walletReducer,
    eth: ethReducer,
    lsdEth: lsdEthReducer,
    validator: validatorReducer,
    validatorNodeAddressState: validatorNodeAddressStateReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
