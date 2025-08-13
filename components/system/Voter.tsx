import React, { memo, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { CustomButton } from 'components/common/CustomButton';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useAppDispatch } from 'hooks/common';
import { addAddress, removeAddress } from 'redux/reducers/ValidatorSlice';
import { useWriteContract } from 'wagmi';
import Web3 from 'web3';
import { formatNumber } from 'utils/numberUtils';
import * as moment from 'moment';
import { useUnstakingPoolData } from 'hooks/useUnstakingPoolData';
import { getExplorerAPIURL } from 'config/env';
import { getNetworkProposalContract } from 'config/contract';
import { useRewardUpdateHour } from 'hooks/useRewardUpdateHour';

interface VoterData {
  balance: string | null;
  lastVoted: string | null;
  loading: boolean;
}

// Create a custom hook for fetching voter data
const useVoterData = (voter: string) => {
  const [data, setData] = React.useState<VoterData>({
    balance: null,
    lastVoted: null,
    loading: false,
  });

  const fetchData = useCallback(async () => {
    if (data.loading) return;

    try {
      setData((prev) => ({ ...prev, loading: true }));

      // Fetch both balance and transactions in parallel
      const [balanceResponse, txResponse] = await Promise.all([
        fetch(getExplorerAPIURL() + `api/v2/addresses/` + voter),
        fetch(
          getExplorerAPIURL() + `api/v2/addresses/` + voter + `/transactions`
        ),
      ]);

      const [balanceData, txData] = await Promise.all([
        balanceResponse.json(),
        txResponse.json(),
      ]);

      const newBalance = Web3.utils.fromWei(balanceData.coin_balance);

      const firstOccurrence = txData.items.find(
        (item: any) =>
          item.method === 'execProposal' &&
          item.to.hash === getNetworkProposalContract()
      );

      const timestamp = firstOccurrence ? firstOccurrence.timestamp : null;

      setData(() => ({
        balance: newBalance,
        lastVoted: timestamp,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching voter data:', error);
      setData((prev) => ({ ...prev, loading: false }));
    }
  }, [voter]);

  // Initial fetch and setup polling
  React.useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return data;
};

// Memoized VoterRow component
const VoterRow = memo(
  ({
    voter,
    darkMode,
    balance,
    lastVoted,
    withdrawCycleSeconds,
  }: {
    voter: string;
    darkMode: boolean;
    balance: string | null;
    lastVoted: string | null;
    withdrawCycleSeconds: string | undefined;
  }) => {
    const formattedBalance = useMemo(
      () => formatNumber(balance ?? 0, { hideDecimalsForZero: true }),
      [balance]
    );
    const { rewardUpdateHour } = useRewardUpdateHour();

    return (
      <tr
        className={
          darkMode
            ? 'border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1 last:border-0'
            : 'border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1 last:border-0'
        }
      >
        <td className='text-left text-[14px] md:text-[16px] truncate px-[30px] py-[15px]'>
          {voter}
        </td>
        <td className='text-center font-semibold px-[30px] py-[15px] text-[14px] md:text-[16px]'>
          {formattedBalance} PLS
        </td>
        <td className='text-center font-semibold px-[30px] py-[15px] text-[14px] md:text-[16px]'>
          {rewardUpdateHour &&
          withdrawCycleSeconds &&
          moment
            .utc(lastVoted)
            .add(+withdrawCycleSeconds + +rewardUpdateHour * 3600, 'seconds')
            .isBefore(moment.utc())
            ? '🔴'
            : '🟢'}
        </td>
        <td className='text-center px-[30px] py-[8px] text-[14px] md:text-[16px]'>
          {moment.utc(lastVoted).local().format('D MMM YYYY h:mm a')}
        </td>
      </tr>
    );
  }
);

// Memoized VoterList component
const VoterList = memo(
  ({
    voters,
    darkMode,
    withdrawCycleSeconds,
  }: {
    voters: string[];
    darkMode: boolean;
    withdrawCycleSeconds: string | undefined;
  }) => {
    // Use a Map to store voter data
    const voterDataMap = new Map(
      voters.map((voter) => [voter, useVoterData(voter)])
    );

    return (
      <>
        {voters.map((voter) => {
          const voterData = voterDataMap.get(voter);
          return (
            <VoterRow
              key={voter}
              voter={voter}
              darkMode={darkMode}
              withdrawCycleSeconds={withdrawCycleSeconds}
              balance={voterData?.balance ?? '0'}
              lastVoted={voterData?.lastVoted ?? '0'}
            />
          );
        })}
      </>
    );
  }
);

const Voter = memo(({ voters, voteManagerAddress }: any) => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [voterAddress, setVoterAddress] = React.useState('');
  const { writeContractAsync } = useWriteContract();
  const { withdrawCycleSeconds } = useUnstakingPoolData();

  const handleAddAddress = useCallback(() => {
    dispatch(addAddress(writeContractAsync, voterAddress));
  }, [dispatch, writeContractAsync, voterAddress]);

  const handleRemoveAddress = useCallback(() => {
    dispatch(removeAddress(writeContractAsync, voterAddress));
  }, [dispatch, writeContractAsync, voterAddress]);

  return (
    <>
      <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] overflow-hidden'>
        <div className='bg-bgPage/50 dark:bg-bgPageDark/50'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[800px]'>
              <thead>
                <tr>
                  <th className='bg-color-bg2 text-left font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]'>
                    Voter / Relays
                  </th>
                  <th className='bg-color-bg2 font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]'>
                    Balance
                  </th>
                  <th className='bg-color-bg2 font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]'>
                    Status
                  </th>
                  <th className='bg-color-bg2 font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]'>
                    Last Voted
                  </th>
                </tr>
              </thead>
              <tbody>
                <VoterList
                  voters={voters}
                  darkMode={darkMode}
                  withdrawCycleSeconds={withdrawCycleSeconds}
                />
              </tbody>
            </table>
          </div>
          <div className='text-[.14rem] text-color-text1 mt-5 text-center pb-[30px] max-w-[422px] mx-auto'>
            <input
              type='text'
              placeholder='Enter Voter Address'
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              className={
                darkMode
                  ? 'w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-[#6C86AD80] text-[14px]'
                  : 'w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-[#6C86AD80] text-[14px]'
              }
            />
            <div className='mt-[10px] max-w-[100%] mx-auto flex items-center gap-1 w-[100%] justify-center'>
              <CustomButton
                type='small'
                height='42px'
                width='130px'
                disabled={metaMaskAccount !== voteManagerAddress}
                onClick={handleAddAddress}
              >
                Add
              </CustomButton>
              <CustomButton
                type='small'
                height='42px'
                width='130px'
                disabled={metaMaskAccount !== voteManagerAddress}
                onClick={handleRemoveAddress}
              >
                Remove
              </CustomButton>
            </div>
          </div>
        </div>
      </div>

      {/* <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
      <div className='h-[.7rem] flex items-center justify-between font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px]'>
        <span>Voter / Relays</span>
        <span>Balance</span>
        <span>Status</span>
        <span>Last Voted</span>
      </div>
      <div
        className={classNames(
          'font-[500] min-h-[350px] py-[20px]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}
      >
        <VoterList
          voters={voters}
          darkMode={darkMode}
          withdrawCycleSeconds={withdrawCycleSeconds}
        />

        
      </div>
    </div> */}
    </>
  );
});

export default Voter;
