import React from 'react'
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { robotoSemiBold } from 'config/font';
import { CustomButton } from 'components/common/CustomButton';
import Image from 'next/image';

export default function VouchContracts() {
    const { darkMode } = useAppSlice();
  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div className='h-[.7rem] flex items-center justify-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2'>Vouch Contracts</div>
        <div className={classNames(
          'font-[500] min-h-[360px] px-[10px] py-[20px]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}>
            <div className='mb-[20px]'>
                <div className='text-color-text1 text-[14px] mb-[10px]'>vPLS Token Contract Address</div>
                <div className='text-color-text2 text-[14px] flex items-center justify-between'>
                    <div className='truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                    <a href='#'>
                        <Image src="/images/link.svg" height={15} width={15} alt='' />
                    </a>
                </div>
            </div>
            <div className='mb-[20px]'>
                <div className='text-color-text1 text-[14px] mb-[10px]'>vPLS User Deposit Contract Address</div>
                <div className='text-color-text2 text-[14px] flex items-center justify-between'>
                    <div className='truncate'>0x1B10731Ec91267e9Fd85c042a3a2961580837d1F</div>
                    <a href='#'>
                        <Image src="/images/link.svg" height={15} width={15} alt='' />
                    </a>
                </div>
            </div>
            <div className='mb-[20px]'>
                <div className='text-color-text1 text-[14px] mb-[10px]'>vPLS  Network Withdraw Contract Address</div>
                <div className='text-color-text2 text-[14px] flex items-center justify-between'>
                    <div className='truncate'>0x555E33C8782A0CeF14d2e9064598CE991f58Bc74</div>
                    <a href='#'>
                        <Image src="/images/link.svg" height={15} width={15} alt='' />
                    </a>
                </div>
            </div>
            <div className='mb-[20px]'>
                <div className='text-color-text1 text-[14px] mb-[10px]'>Node Deposit Contract Address</div>
                <div className='text-color-text2 text-[14px] flex items-center justify-between'>
                    <div className='truncate'>0x4C14073Fa77e3028cDdC60bC593A8381119e9921</div>
                    <a href='#'>
                        <Image src="/images/link.svg" height={15} width={15} alt='' />
                    </a>
                </div>
            </div>
            <div className='mb-[20px]'>
                <div className='text-color-text1 text-[14px] mb-[10px]'>Fee Pool Contract Address</div>
                <div className='text-color-text2 text-[14px] flex items-center justify-between'>
                    <div className='truncate'>0x4C14073Fa77e3028cDdC60bC593A8381119e9921</div>
                    <a href='#'>
                        <Image src="/images/link.svg" height={15} width={15} alt='' />
                    </a>
                </div>
            </div>
            <div className='mb-[20px]'>
                <div className='text-color-text1 text-[14px] mb-[10px]'>Network Balance Contract Address</div>
                <div className='text-color-text2 text-[14px] flex items-center justify-between'>
                    <div className='truncate'>0x47e97e7971D13936667EE0E0b44a4Fc1eBD871Ff</div>
                    <a href='#'>
                        <Image src="/images/link.svg" height={15} width={15} alt='' />
                    </a>
                </div>
            </div>


        </div>
    </div>
  )
}
