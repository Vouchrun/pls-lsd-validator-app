import React from 'react';
import classNames from 'classnames';
import Image from 'next/image';
import {
  getEthDepositContract,
  getFeePoolContract,
  getLsdEthTokenContract,
  getNetworkBalanceContract,
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';

export default function VouchContracts() {
  const networkBalanceAddress = getNetworkBalanceContract();
  const nodeDepositAddress = getNodeDepositContract();
  const networkwithdrawAddress = getNetworkWithdrawContract();
  const vPLSTokenAddress = getLsdEthTokenContract();
  const vPLSUserDepositAddress = getEthDepositContract();
  const feePoolAddress = getFeePoolContract();
  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
      <div className='h-[.7rem] flex items-center justify-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2'>
        Vouch Contracts
      </div>
      <div
        className={classNames(
          'font-[500] min-h-[360px] px-[10px] py-[20px]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}
      >
        <div className='mb-[20px]'>
          <div className='text-color-text1 text-[14px] mb-[10px]'>
            vPLS Token Contract Address
          </div>
          <div className='text-color-text2 text-[14px] flex items-center justify-between'>
            <div className='truncate'>{vPLSTokenAddress}</div>
            <a href='#'>
              <Image src='/images/link.svg' height={15} width={15} alt='' />
            </a>
          </div>
        </div>
        <div className='mb-[20px]'>
          <div className='text-color-text1 text-[14px] mb-[10px]'>
            vPLS User Deposit Contract Address
          </div>
          <div className='text-color-text2 text-[14px] flex items-center justify-between'>
            <div className='truncate'>{vPLSUserDepositAddress}</div>
            <a href='#'>
              <Image src='/images/link.svg' height={15} width={15} alt='' />
            </a>
          </div>
        </div>
        <div className='mb-[20px]'>
          <div className='text-color-text1 text-[14px] mb-[10px]'>
            vPLS Network Withdraw Contract Address
          </div>
          <div className='text-color-text2 text-[14px] flex items-center justify-between'>
            <div className='truncate'>{networkwithdrawAddress}</div>
            <a href='#'>
              <Image src='/images/link.svg' height={15} width={15} alt='' />
            </a>
          </div>
        </div>
        <div className='mb-[20px]'>
          <div className='text-color-text1 text-[14px] mb-[10px]'>
            Node Deposit Contract Address
          </div>
          <div className='text-color-text2 text-[14px] flex items-center justify-between'>
            <div className='truncate'>{nodeDepositAddress}</div>
            <a href='#'>
              <Image src='/images/link.svg' height={15} width={15} alt='' />
            </a>
          </div>
        </div>
        <div className='mb-[20px]'>
          <div className='text-color-text1 text-[14px] mb-[10px]'>
            Fee Pool Contract Address
          </div>
          <div className='text-color-text2 text-[14px] flex items-center justify-between'>
            <div className='truncate'>{feePoolAddress}</div>
            <a href='#'>
              <Image src='/images/link.svg' height={15} width={15} alt='' />
            </a>
          </div>
        </div>
        <div className='mb-[20px]'>
          <div className='text-color-text1 text-[14px] mb-[10px]'>
            Network Balance Contract Address
          </div>
          <div className='text-color-text2 text-[14px] flex items-center justify-between'>
            <div className='truncate'>{networkBalanceAddress}</div>
            <a href='#'>
              <Image src='/images/link.svg' height={15} width={15} alt='' />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
