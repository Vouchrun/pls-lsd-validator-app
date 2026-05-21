import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import {
  decodeBalancesUpdatedLog,
  getErc20AssetBalance,
  getEthWeb3,
} from 'utils/web3Utils';
import {
  getLsdEthTokenContract,
  getNetworkBalanceContract,
} from 'config/contract';
import { getDefaultApr } from 'utils/configUtils';
import {
  getLsdEthTokenContractAbi,
  getNetworkBalanceContractAbi,
} from 'config/contractAbi';
import {
  getBlockSeconds,
  getNetworkBalanceContractDeploymentBlock,
} from 'config/env';

/**
 * High-precision division for 18-decimal token amounts.
 * Avoids JavaScript floating-point loss when dividing large BigInt numerators
 * by large BigInt denominators (e.g. totalEth / lsdTokenSupply).
 * Matches the pls-lsd-app implementation exactly.
 */
export function bigIntDivide(numerator: string, denominator: string): number {
  if (!denominator || denominator === '0') return NaN;
  const PRECISION = 10n ** 18n;
  const scaled = (BigInt(numerator) * PRECISION) / BigInt(denominator);
  return Number(scaled) / 1e18;
}

export interface LsdEthState {
  balance: string | undefined; // balance of lsdETH
  rate: string | undefined; // rate of lsdETH to ETH
  apr: number | undefined; // lsdETH apr
  price: string | undefined; // price of lsdETH
  yearlyApr: number | undefined; // yearly apr of lsdETH
}

const initialState: LsdEthState = {
  balance: undefined,
  rate: undefined,
  apr: undefined,
  price: undefined,
  yearlyApr: undefined,
};

export const lsdEthSlice = createSlice({
  name: 'lsdEth',
  initialState,
  reducers: {
    setBalance: (
      state: LsdEthState,
      action: PayloadAction<string | undefined>
    ) => {
      state.balance = action.payload;
    },
    setRate: (state: LsdEthState, action: PayloadAction<string>) => {
      state.rate = action.payload;
    },
    setPrice: (state: LsdEthState, action: PayloadAction<string>) => {
      state.price = action.payload;
    },
    setApr: (state: LsdEthState, action: PayloadAction<number>) => {
      state.apr = action.payload;
    },
    setYearlyApr: (state: LsdEthState, action: PayloadAction<number>) => {
      state.yearlyApr = action.payload;
    },
  },
});

export const { setBalance, setRate, setPrice, setApr, setYearlyApr } =
  lsdEthSlice.actions;

export default lsdEthSlice.reducer;

export const clearLsdEthBalance =
  (): AppThunk => async (dispatch, getState) => {
    dispatch(setBalance(undefined));
  };

/**
 * update lsdEth balance
 */
export const updateLsdEthBalance =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskDisconnected
        ? undefined
        : getState().wallet.metaMaskAccount;

      const tokenAbi = getLsdEthTokenContractAbi();
      const tokenAddress = getLsdEthTokenContract();
      const newBalance = await getErc20AssetBalance(
        metaMaskAccount,
        tokenAbi,
        tokenAddress
      );
      dispatch(setBalance(newBalance));
    } catch (err: unknown) {}
  };

/**
 * query lsdETH to ETH's rate
 */
export const updateLsdEthRate = (): AppThunk => async (dispatch, getState) => {
  try {
    let newRate = '--';

    const web3 = getEthWeb3();
    let contract = new web3.eth.Contract(
      getLsdEthTokenContractAbi(),
      getLsdEthTokenContract()
    );
    const result = await contract.methods.getRate().call();
    newRate = web3.utils.fromWei(result + '', 'ether');

    dispatch(setRate(newRate));
  } catch (err: unknown) {}
};

/**
 * query apr of lsd ETH (7-day annualized, using actual timestamps)
 * Matches the pls-lsd-app calculation: bigIntDivide for precision,
 * event timestamps for elapsed days (not hardcoded /7).
 */
export const updateApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    console.log('updateApr');
    const web3 = getEthWeb3();
    const currentBlock = await web3.eth.getBlockNumber();
    const contract = new web3.eth.Contract(
      getNetworkBalanceContractAbi(),
      getNetworkBalanceContract()
    );
    const topics = web3.utils.sha3(
      'BalancesUpdated(uint256,uint256,uint256,uint256)'
    );
    const events = await contract.getPastEvents('allEvents', {
      fromBlock:
        currentBlock - Math.floor((1 / getBlockSeconds()) * 60 * 60 * 24 * 7),
      toBlock: currentBlock,
    });
    let apr = getDefaultApr();
    const balancesUpdatedEvents = events
      .filter((e) => e.raw.topics.length === 1 && e.raw.topics[0] === topics)
      .sort((a, b) => a.blockNumber - b.blockNumber);
    if (balancesUpdatedEvents.length > 1) {
      const beginEvent = balancesUpdatedEvents[0];
      const endEvent = balancesUpdatedEvents[balancesUpdatedEvents.length - 1];
      const beginValues: any = decodeBalancesUpdatedLog(
        beginEvent.raw.data,
        beginEvent.raw.topics
      );
      const endValues: any = decodeBalancesUpdatedLog(
        endEvent.raw.data,
        endEvent.raw.topics
      );
      const beginRate = bigIntDivide(beginValues.totalEth, beginValues.lsdTokenSupply);
      const endRate = bigIntDivide(endValues.totalEth, endValues.lsdTokenSupply);
      // Use actual event timestamps instead of hardcoded /7
      const beginTimestamp = Number(beginValues.time);
      const endTimestamp = Number(endValues.time);
      const daysBetween = (endTimestamp - beginTimestamp) / (60 * 60 * 24);
      if (
        !isNaN(beginRate) &&
        !isNaN(endRate) &&
        endRate !== 1 &&
        beginRate !== 1 &&
        daysBetween > 0
      ) {
        apr = ((endRate - beginRate) / daysBetween) * 365.25 * 100;
      }
    }
    dispatch(setApr(apr));
  } catch (err: any) {
    dispatch(setApr(apr));
  }
};

export const updateYearlyApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    const web3 = getEthWeb3();
    const currentBlock = await web3.eth.getBlockNumber();
    const contract = new web3.eth.Contract(
      getNetworkBalanceContractAbi(),
      getNetworkBalanceContract()
    );

    // Calculate blocks for 365 days (Pulsechain: 10-second slots)
    const blocksFor365Days = Math.floor(
      (1 / getBlockSeconds()) * 60 * 60 * 24 * 365
    );

    // Get deployment block
    const deploymentBlock = getNetworkBalanceContractDeploymentBlock();

    // Determine start block based on deployment time
    const startBlock =
      currentBlock - deploymentBlock < blocksFor365Days
        ? deploymentBlock
        : currentBlock - blocksFor365Days;

    const topics = web3.utils.sha3(
      'BalancesUpdated(uint256,uint256,uint256,uint256)'
    );

    const events = await contract.getPastEvents('allEvents', {
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    const balancesUpdatedEvents = events
      .filter((e) => e.raw.topics.length === 1 && e.raw.topics[0] === topics)
      .sort((a, b) => a.blockNumber - b.blockNumber);

    if (balancesUpdatedEvents.length > 1) {
      const beginEvent = balancesUpdatedEvents[0];
      const endEvent = balancesUpdatedEvents[balancesUpdatedEvents.length - 1];

      const beginValues: any = decodeBalancesUpdatedLog(
        beginEvent.raw.data,
        beginEvent.raw.topics
      );
      const endValues: any = decodeBalancesUpdatedLog(
        endEvent.raw.data,
        endEvent.raw.topics
      );

      const beginRate = bigIntDivide(beginValues.totalEth, beginValues.lsdTokenSupply);
      const endRate = bigIntDivide(endValues.totalEth, endValues.lsdTokenSupply);

      // Use actual event timestamps instead of fetching block headers
      const beginTimestamp = Number(beginValues.time);
      const endTimestamp = Number(endValues.time);
      const daysBetween = (endTimestamp - beginTimestamp) / (60 * 60 * 24);

      if (
        !isNaN(beginRate) &&
        !isNaN(endRate) &&
        endRate !== 1 &&
        beginRate !== 1 &&
        daysBetween > 0
      ) {
        // Use 365.25 for leap-year accuracy (matches pls-lsd-app)
        apr =
          ((endRate - beginRate) / daysBetween) * 365.25 * 100;
      }
    }
    dispatch(setYearlyApr(apr));
  } catch (err: any) {
    dispatch(setYearlyApr(apr));
  }
};
