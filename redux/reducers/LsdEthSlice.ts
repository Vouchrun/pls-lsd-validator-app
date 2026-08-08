import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import {
  decodeBalancesUpdatedLog,
  getErc20AssetBalance,
  getEthWeb3,
  executeWithRpcFallback,
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

/**
 * query apr of lsd ETH
 */
export const updateApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    console.log('updateApr');
    await executeWithRpcFallback(async (web3) => {
      const currentBlock = await web3.eth.getBlockNumber();
      const contract = new web3.eth.Contract(
        getNetworkBalanceContractAbi(),
        getNetworkBalanceContract()
      );
      const events = await contract.getPastEvents('BalancesUpdated', {
        fromBlock:
          currentBlock - Math.floor((1 / getBlockSeconds()) * 60 * 60 * 24 * 7),
        toBlock: currentBlock,
      });
      let apr = getDefaultApr();
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
        const beginRate = beginValues.totalEth / beginValues.lsdTokenSupply;
        const endRate = endValues.totalEth / endValues.lsdTokenSupply;
        if (
          !isNaN(beginRate) &&
          !isNaN(endRate) &&
          endRate !== 1 &&
          beginRate !== 1
        ) {
          apr = ((endRate - beginRate) / 7) * 365.25 * 100;
        }
      }
      dispatch(setApr(apr));
    });
  } catch (err: any) {
    dispatch(setApr(apr));
  }
};

export const updateYearlyApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    await executeWithRpcFallback(async (web3) => {
      const currentBlock = await web3.eth.getBlockNumber();
      const contract = new web3.eth.Contract(
        getNetworkBalanceContractAbi(),
        getNetworkBalanceContract()
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

      // Chunk the range into parallel sub-queries to stay under Geth's
      // hardcoded ~30s eth_getLogs timeout for large spans
      const CHUNK_BLOCKS = 600000;
      const ranges: { fromBlock: number; toBlock: number }[] = [];
      for (let from = startBlock; from <= currentBlock; from += CHUNK_BLOCKS) {
        ranges.push({
          fromBlock: from,
          toBlock: Math.min(from + CHUNK_BLOCKS - 1, currentBlock),
        });
      }

      // Run chunks with bounded concurrency so lightweight queries (balances,
      // unstaked-today, etc.) aren't starved of browser connections while the
      // large scans are in flight
      const CHUNK_CONCURRENCY = 4;
      const chunkResults: any[][] = new Array(ranges.length);
      let rangeIndex = 0;
      const chunkWorkers = Array.from(
        { length: Math.min(CHUNK_CONCURRENCY, ranges.length) },
        async () => {
          while (rangeIndex < ranges.length) {
            const i = rangeIndex++;
            chunkResults[i] = await contract.getPastEvents('BalancesUpdated', {
              fromBlock: ranges[i].fromBlock,
              toBlock: ranges[i].toBlock,
            });
          }
        }
      );
      await Promise.all(chunkWorkers);

      const balancesUpdatedEvents = chunkResults
        .flat()
        .sort((a, b) => a.blockNumber - b.blockNumber);

      if (balancesUpdatedEvents.length > 1) {
        const beginEvent = balancesUpdatedEvents[0];
        const endEvent = balancesUpdatedEvents[balancesUpdatedEvents.length - 1];

        // Get block timestamps to calculate actual days
        const beginBlock = await web3.eth.getBlock(beginEvent.blockNumber);
        const endBlock = await web3.eth.getBlock(endEvent.blockNumber);
        const daysBetweenBlocks =
          (Number(endBlock.timestamp) - Number(beginBlock.timestamp)) /
          (60 * 60 * 24);

        const beginValues: any = decodeBalancesUpdatedLog(
          beginEvent.raw.data,
          beginEvent.raw.topics
        );
        const endValues: any = decodeBalancesUpdatedLog(
          endEvent.raw.data,
          endEvent.raw.topics
        );

        const beginRate = beginValues.totalEth / beginValues.lsdTokenSupply;
        const endRate = endValues.totalEth / endValues.lsdTokenSupply;

        if (!isNaN(beginRate) && !isNaN(endRate) && endRate !== 1) {
          // Calculate APR using actual days between blocks
          apr =
            ((endRate - beginRate) / Math.floor(daysBetweenBlocks)) * 365 * 100;
        }
      }
      dispatch(setYearlyApr(apr));
    });
  } catch (err: any) {
    dispatch(setYearlyApr(apr));
  }
};
