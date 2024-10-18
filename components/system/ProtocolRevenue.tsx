import React from 'react';
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { robotoSemiBold } from 'config/font';
import { CustomButton } from 'components/common/CustomButton';
import { useUnstakingPoolData } from 'hooks/useUnstakingPoolData';
import { useNetworkProposalData } from 'hooks/useNetworkProposalData';
import { useWalletAccount } from 'hooks/useWalletAccount';
import millify from 'millify';
import { useAppDispatch } from 'hooks/common';
import { withDrawAdmin } from 'redux/reducers/ValidatorSlice';
import { useWriteContract } from 'wagmi';

export default function ProtocolRevenue() {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const {
    totalPlatformClaimedAmount,
    totalPlatformCommission,
    stackCommissionRate,
  } = useUnstakingPoolData();
  const { treasuryBalance, admin } = useNetworkProposalData();
  const [distributionAddress, setDistributionAddress] = React.useState('');
  const { writeContractAsync } = useWriteContract();
  const { metaMaskAccount } = useWalletAccount();

  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
      <div className='h-[.7rem] flex items-center justify-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2'>
        Protocol Revenue
      </div>
      <div
        className={classNames(
          'font-[500] min-h-[415px] px-[10px] py-[20px]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}
      >
        <div
          className={
            darkMode
              ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1'
              : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'
          }
        >
          <div className='text-color-text2'>Total Platform Commissions</div>
          <div className={robotoSemiBold.className}>
            {millify(totalPlatformCommission, {
              precision: 2,
              space: true,
            })}
          </div>
        </div>
        <div
          className={
            darkMode
              ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1'
              : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'
          }
        >
          <div className='text-color-text2'>Platform Commissions Withdrawn</div>
          <div className={robotoSemiBold.className}>
            {millify(totalPlatformClaimedAmount, {
              precision: 2,
              space: true,
            })}
          </div>
        </div>
        <div
          className={
            darkMode
              ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1'
              : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'
          }
        >
          <div className='text-color-text2'>Total Stack Commissions</div>
          <div className={robotoSemiBold.className}>
            {millify(+(stackCommissionRate / 100) * +totalPlatformCommission, {
              precision: 2,
              space: true,
            })}
          </div>
        </div>
        <div
          className={
            darkMode
              ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1'
              : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'
          }
        >
          <div className='text-color-text2'>Treasury Balance</div>
          <div className={robotoSemiBold.className}>
            {millify(treasuryBalance, {
              precision: 2,
              space: true,
            })}
          </div>
        </div>
        <div className='text-[.14rem] text-color-text1 mt-5 text-center mb-[10px]'>
          <span className='text-color-text2'>Withdrawable Balance:</span>{' '}
          <span className={robotoSemiBold.className}>
            {millify(totalPlatformCommission - totalPlatformClaimedAmount, {
              precision: 2,
              space: true,
            })}{' '}
            PLS
          </span>
        </div>
        <input
          type='text'
          placeholder='Enter Distribution Address'
          onChange={(e) => setDistributionAddress(e.target.value)}
          value={distributionAddress}
          className={
            darkMode
              ? 'w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-[#6C86AD80] text-white'
              : 'w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-[#6C86AD80] text-black'
          }
        />
        <div className='mt-[10px] max-w-[250px] mx-auto'>
          <CustomButton
            type='small'
            height='.42rem'
            disabled={admin !== metaMaskAccount}
            onClick={() => {
              dispatch(withDrawAdmin(writeContractAsync, distributionAddress));
            }}
          >
            Distribute Commissions
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
