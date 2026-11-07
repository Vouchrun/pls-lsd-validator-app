import { getNetworkWithdrawContract } from "config/contract";
import { useCallback, useEffect, useState } from "react";
import { executeWithRpcFallback, getPastEventsPaginated } from "utils/web3Utils";
import Web3 from "web3";
import { useAppSlice } from "./selector";
import { getNetworkWithdrawContractAbi } from "config/contractAbi";
import { getBlockSeconds } from "config/env";

// Paint the metric instantly from cache on page load - the live fetch is a
// small log query that can queue behind heavier concurrent RPC queries
// (browser connection limits), so cache-first keeps it instantaneous.
const CACHE_KEY = "unstakedTokenOfDay";
const CACHE_TTL = 5 * 60 * 1000;

const storage = {
  get: (key: string) => {
    if (typeof window !== "undefined") {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  set: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {}
    }
  },
};

export function useUnstakedTokenOfDay() {
  const { updateFlag } = useAppSlice();

  const [unstakedTokenOfDay, setUnstakedTokenOfDay] = useState<string>();

  const updateData = useCallback(async () => {
    const cached = storage.get(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setUnstakedTokenOfDay(parsed.value);
          // Fresh cache: don't re-scan the log range.
          return;
        }
      } catch (e) {}
    }

    try {
      const currentBlock = await executeWithRpcFallback(
        async (web3) => web3.eth.getBlockNumber()
      );

      // 1 day is ~8.6k blocks (a single page), but go through the paginated
      // helper so the range guard and per-page timeout apply everywhere.
      const events = await getPastEventsPaginated(
        (web3) =>
          new web3.eth.Contract(
            getNetworkWithdrawContractAbi(),
            getNetworkWithdrawContract(),
            {}
          ),
        "Unstake",
        currentBlock - Math.floor((1 / getBlockSeconds()) * 60 * 60 * 24),
        currentBlock
      );

      const unstakeEvents = events.sort(
        (a, b) => a.blockNumber - b.blockNumber
      );

      let totalUnstakedAmount = 0;

      unstakeEvents.forEach((event) => {
        const unstakeEventLog = event.returnValues;
        totalUnstakedAmount += Number(unstakeEventLog.ethAmount);
      });

      const value = Web3.utils.fromWei(totalUnstakedAmount + "");
      storage.set(CACHE_KEY, JSON.stringify({ value, timestamp: Date.now() }));
      setUnstakedTokenOfDay(value);
    } catch (err: any) {
      console.log({ err });
    }
  }, [updateFlag]);

  useEffect(() => {
    updateData();
  }, [updateData]);

  return { unstakedTokenOfDay };
}
