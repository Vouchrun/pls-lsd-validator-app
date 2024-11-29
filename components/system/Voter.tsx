import React from 'react';
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { useNetworkProposalData } from 'hooks/useNetworkProposalData';
import { CustomButton } from 'components/common/CustomButton';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useAppDispatch } from 'hooks/common';
import { addAddress, removeAddress } from 'redux/reducers/ValidatorSlice';
import { useWriteContract } from 'wagmi';
import { robotoSemiBold } from 'config/font';
import Web3 from 'web3';
import { formatNumber } from 'utils/numberUtils';

const Voter = React.memo(({ voters, voteManagerAddress }: any) => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [voterAddress, setVoterAddress] = React.useState('');
  const { writeContractAsync } = useWriteContract();

  const VoterBalance = ({ voter }: any) => {
    const [balance, setBalance] = React.useState<string | null>(null); // Initialize with null to differentiate between uninitialized and 0 balance.
    const [loading, setLoading] = React.useState(false);

    const fetchBalance = React.useCallback(async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://api.scan.pulsechain.com/api/v2/addresses/0x73E3116809Ef7Df249f276ED7ceAaDaA44Acad97'
        ); // Replace with actual function to get balance
        const resJson = await response.json();
        const newBalance = Web3.utils.fromWei(resJson.coin_balance);
        // Update balance only if the new balance is different
        setBalance((prev) => (prev !== newBalance ? newBalance : prev));
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    }, []);

    React.useEffect(() => {
      fetchBalance();
    }, [fetchBalance]);

    return <>{formatNumber(balance || 0, { hideDecimalsForZero: true })} PLS</>;
  };

  const LastVoted = ({ voter }: any) => {
    const [lastVoted, setLastVoted] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const fetchBalance = async () => {
      try {
        setLoading(true);
        const txResponse = await fetch(
          'https://api.scan.pulsechain.com/api/v2/addresses/0x73E3116809Ef7Df249f276ED7ceAaDaA44Acad97/transactions'
        );
        const data = await txResponse.json();
        const firstOccurrence = data.items.find(
          (item: any) =>
            item.method === 'execProposal' &&
            item.to.hash === '0x7783D7040423f75aeF82a3Ec32ed366ca460Fa6c'
        );

        const timestamp = firstOccurrence ? firstOccurrence.timestamp : null;
        // Update balance only if the new balance is different
        setLastVoted((prev) => (prev !== timestamp ? timestamp : prev));
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      fetchBalance();
    }, []);

    return <>{lastVoted}</>;
  };
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
        {voters &&
          voters.map((voter: any, index: number) => (
            <div
              key={index}
              className={
                darkMode
                  ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1'
                  : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'
              }
            >
              <div className='text-[13px] truncate'>{voter}</div>
              <div className={robotoSemiBold.className}>
                <VoterBalance voter={voter} />
              </div>
              <div className={robotoSemiBold.className}>10 Aug 2024 7:45pm</div>
              <div className={robotoSemiBold.className}>
                <LastVoted voter={voter} />
              </div>
            </div>
          ))}
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
              onClick={() => {
                dispatch(addAddress(writeContractAsync, voterAddress));
              }}
            >
              Add
            </CustomButton>
            <CustomButton
              type='small'
              height='.42rem'
              width='130px'
              disabled={metaMaskAccount !== voteManagerAddress}
              onClick={() => {
                dispatch(removeAddress(writeContractAsync, voterAddress));
              }}
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
