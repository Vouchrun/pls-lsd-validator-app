import React, { memo, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { CustomButton } from 'components/common/CustomButton';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useAppDispatch } from 'hooks/common';
import { addAddress, removeAddress } from 'redux/reducers/ValidatorSlice';
import { useWriteContract } from 'wagmi';
import { robotoSemiBold } from 'config/font';
import Web3 from 'web3';
import { formatNumber } from 'utils/numberUtils';
import * as moment from 'moment';
import { useUnstakingPoolData } from 'hooks/useUnstakingPoolData';

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
        fetch(
          `https://api.scan.pulsechain.com/api/v2/addresses/0x73E3116809Ef7Df249f276ED7ceAaDaA44Acad97`
        ),
        fetch(
          `https://api.scan.pulsechain.com/api/v2/addresses/0x73E3116809Ef7Df249f276ED7ceAaDaA44Acad97/transactions`
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
          item.to.hash === '0x7783D7040423f75aeF82a3Ec32ed366ca460Fa6c'
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

    return (
      <div
        className={
          darkMode
            ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1'
            : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'
        }
      >
        <div className='text-[13px] truncate'>{voter}</div>
        <div className={robotoSemiBold.className}>{formattedBalance} PLS</div>
        <div className={robotoSemiBold.className}>
          {withdrawCycleSeconds &&
          moment
            .utc(lastVoted)
            .add(+withdrawCycleSeconds + 3600, 'seconds')
            .isBefore(moment.utc())
            ? '🔴'
            : '🟢'}
        </div>
        <div className={robotoSemiBold.className}>
          {moment.utc(lastVoted).local().format('D MMM YYYY h:mm a')}
        </div>
      </div>
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
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
      <div className='h-[.7rem] flex items-center justify-between font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2 px-[30px]'>
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

        <div className='text-[.14rem] text-color-text1 mt-5 text-center mb-[10px] max-w-[422px] mx-auto'>
          <input
            type='text'
            placeholder='Enter Voter Address'
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            className={
              darkMode
                ? 'w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-[#6C86AD80]'
                : 'w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-[#6C86AD80]'
            }
          />
          <div className='mt-[10px] max-w-[100%] mx-auto flex items-center gap-1 w-[100%] justify-center'>
            <CustomButton
              type='small'
              height='.42rem'
              width='130px'
              disabled={metaMaskAccount !== voteManagerAddress}
              onClick={handleAddAddress}
            >
              Add
            </CustomButton>
            <CustomButton
              type='small'
              height='.42rem'
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
  );
});

export default Voter;
