import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import {
  decodeBalancesUpdatedLog,
  getErc20AssetBalance,
  executeWithRpcFallback,
  getPastEventsPaginated,
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
    await executeWithRpcFallback(async (web3) => {
      let newRate = '--';
      let contract = new web3.eth.Contract(
        getLsdEthTokenContractAbi(),
        getLsdEthTokenContract()
      );
      const result = await contract.methods.getRate().call();
      newRate = web3.utils.fromWei(result + '', 'ether');

      dispatch(setRate(newRate));
    });
  } catch (err: unknown) {}
};

const APR_CACHE_KEY = 'eth_lsd_apr_cache_v1';
const YEARLY_APR_CACHE_KEY = 'eth_lsd_yearly_apr_cache_v1';
const APR_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const YEARLY_APR_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function readAprCache(key: string, ttlMs: number): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { apr: number; timestamp: number };
    if (!parsed || typeof parsed.apr !== 'number') {
      return null;
    }
    if (Date.now() - parsed.timestamp > ttlMs) {
      return null;
    }
    return parsed.apr;
  } catch {
    return null;
  }
}

function writeAprCache(key: string, apr: number) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ apr, timestamp: Date.now() })
    );
  } catch {
    // ignore quota / disabled storage
  }
}

/**
 * query apr of lsd ETH (7 day window)
 */
export const updateApr = (): AppThunk => async (dispatch) => {
  const cached = readAprCache(APR_CACHE_KEY, APR_CACHE_TTL_MS);
  if (cached !== null) {
    dispatch(setApr(cached));
    return;
  }

  let apr = getDefaultApr();
  let computed = false;

  try {
    console.log('updateApr');
    const currentBlock = await executeWithRpcFallback(
      async (web3) => web3.eth.getBlockNumber()
    );
    const fromBlock =
      currentBlock - Math.floor((1 / getBlockSeconds()) * 60 * 60 * 24 * 7);

    const events = await getPastEventsPaginated(
      (web3) =>
        new web3.eth.Contract(
          getNetworkBalanceContractAbi(),
          getNetworkBalanceContract()
        ),
      'BalancesUpdated',
      fromBlock,
      currentBlock
    );

    const balancesUpdatedEvents = events.sort(
      (a, b) => a.blockNumber - b.blockNumber
    );

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
      const beginRate = bigIntDivide(
        beginValues.totalEth,
        beginValues.lsdTokenSupply
      );
      const endRate = bigIntDivide(
        endValues.totalEth,
        endValues.lsdTokenSupply
      );
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
        computed = true;
      }
    }

    dispatch(setApr(apr));
    if (computed) {
      writeAprCache(APR_CACHE_KEY, apr);
    }
  } catch (err: any) {
    dispatch(setApr(apr));
  }
};

/**
 * query yearly apr of lsd ETH (365 day window)
 */
export const updateYearlyApr = (): AppThunk => async (dispatch) => {
  const cached = readAprCache(
    YEARLY_APR_CACHE_KEY,
    YEARLY_APR_CACHE_TTL_MS
  );
  if (cached !== null) {
    dispatch(setYearlyApr(cached));
    return;
  }

  let apr = getDefaultApr();
  let computed = false;

  try {
    const currentBlock = await executeWithRpcFallback(
      async (web3) => web3.eth.getBlockNumber()
    );

    // Calculate blocks for 365 days
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

    // 365 days is ~3.15M blocks. A single eth_getLogs over that span can
    // never finish inside geth's 30 s request ceiling, so the helper pages it
    // (25k blocks per request, ~1.25 s each) and times out per page.
    const events = await getPastEventsPaginated(
      (web3) =>
        new web3.eth.Contract(
          getNetworkBalanceContractAbi(),
          getNetworkBalanceContract()
        ),
      'BalancesUpdated',
      startBlock,
      currentBlock
    );

    const balancesUpdatedEvents = events.sort(
      (a, b) => a.blockNumber - b.blockNumber
    );

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

      const beginRate = bigIntDivide(
        beginValues.totalEth,
        beginValues.lsdTokenSupply
      );
      const endRate = bigIntDivide(
        endValues.totalEth,
        endValues.lsdTokenSupply
      );

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
        apr = ((endRate - beginRate) / daysBetween) * 365.25 * 100;
        computed = true;
      }
    }

    dispatch(setYearlyApr(apr));
    if (computed) {
      writeAprCache(YEARLY_APR_CACHE_KEY, apr);
    }
  } catch (err: any) {
    dispatch(setYearlyApr(apr));
  }
};
