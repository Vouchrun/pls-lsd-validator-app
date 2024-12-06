import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import { getEthWeb3 } from 'utils/web3Utils';
import { getBeaconHost } from 'config/env';

interface ValidatorNodeAddressData {
  address: string;
  balance: number;
  activeCount: number;
  status: 'active' | 'inactive';
}

interface ValidatorState {
  validatorNodeAddressData: ValidatorNodeAddressData[];
  validatorTrustedNodeAddressData: ValidatorNodeAddressData[];
  loading: boolean;
  error: string | null;
}

const initialState: ValidatorState = {
  validatorNodeAddressData: [],
  validatorTrustedNodeAddressData: [],
  loading: false,
  error: null,
};

const validatorNodeAddressSlice = createSlice({
  name: 'validatorNodeAddressState',
  initialState,
  reducers: {
    setValidatorData: (
      state,
      action: PayloadAction<ValidatorNodeAddressData[]>
    ) => {
      state.validatorNodeAddressData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setTrustedValidatorData: (
      state,
      action: PayloadAction<ValidatorNodeAddressData[]>
    ) => {
      state.validatorTrustedNodeAddressData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setValidatorData,
  setLoading,
  setError,
  setTrustedValidatorData,
} = validatorNodeAddressSlice.actions;

// Thunk action to fetch validator data
export const fetchValidatorData =
  (nodes: string[]): AppThunk =>
  async (dispatch) => {
    dispatch(setValidatorData([]));
    dispatch(setLoading(true));
    const web3 = getEthWeb3();
    const nodeDepositContract = new web3.eth.Contract(
      getNodeDepositContractAbi(),
      getNodeDepositContract()
    );

    try {
      const CHUNK_SIZE = 100;
      const MINIMUM_BALANCE = 32000000;

      const fetchNodePubkeys = async (nodeAddress: string) => {
        try {
          const pubkeys = await nodeDepositContract.methods
            .getPubkeysOfNode(nodeAddress)
            .call()
            .catch((error: any) => {
              console.log('error', error);
            });
          return pubkeys;
        } catch (error) {
          console.error('Error fetching pubkeys:', error);
          return [];
        }
      };

      const setNodesWithCheck = async (nodeAddress: any) => {
        const isTrusted = await nodeDepositContract.methods
          .nodeInfoOf(nodeAddress)
          .call()
          .catch((err: any) => {
            console.log({ err });
          });

        if (isTrusted[0] == 2) {
          return true;
        }
        return false;
      };

      const fetchValidatorData = async (pubkeys: string[]) => {
        const chunks = [];
        for (let i = 0; i < pubkeys.length; i += CHUNK_SIZE) {
          chunks.push(pubkeys.slice(i, i + CHUNK_SIZE));
        }

        const results = [];
        for (const chunk of chunks) {
          const pubkeysString = chunk.join(',');
          try {
            const response = await fetch(
              `${getBeaconHost()}/eth/v1/beacon/states/head/validators?id=` +
                pubkeysString
            );
            const data = await response.json();
            results.push(...data.data);
          } catch (error) {
            console.error('Error fetching validator data:', error);
          }
        }
        return results;
      };

      const validatorInfo: ValidatorNodeAddressData[] = [];
      const trustedvalidatorInfo: ValidatorNodeAddressData[] = [];

      for (const node of nodes) {
        const pubkeys = await fetchNodePubkeys(node);
        const validatorDetails = await fetchValidatorData(pubkeys);
        const isTrusted = await setNodesWithCheck(node);

        const activeValidators = validatorDetails.filter(
          (validator: any) => validator.status === 'active_ongoing'
        );

        const totalBalance = activeValidators.reduce(
          (sum: number, validator: any) => sum + parseInt(validator.balance),
          0
        );

        validatorInfo.push({
          address: node,
          balance: totalBalance,
          activeCount: activeValidators.length,
          status: totalBalance >= MINIMUM_BALANCE ? 'active' : 'inactive',
        });
        if (isTrusted) {
          trustedvalidatorInfo.push({
            address: node,
            balance: totalBalance,
            activeCount: activeValidators.length,
            status: totalBalance >= MINIMUM_BALANCE ? 'active' : 'inactive',
          });
        }
      }

      dispatch(setValidatorData(validatorInfo));
      dispatch(setTrustedValidatorData(trustedvalidatorInfo));
    } catch (error) {
      dispatch(
        setError(error instanceof Error ? error.message : 'An error occurred')
      );
    }
  };

export default validatorNodeAddressSlice.reducer;
