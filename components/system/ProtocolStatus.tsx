import React from 'react'
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { robotoSemiBold } from 'config/font';

export default function ProtocolStatus() {
    const { darkMode } = useAppSlice();
  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div className='h-[.7rem] flex items-center justify-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2'>Protocol Status</div>
        <div className={classNames(
          'font-[500] min-h-[415px] px-[10px] py-[20px]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>PLS : vPLS Ratio</div>
                <div className={robotoSemiBold.className}>1</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Waiting PLS Withdrawal</div>
                <div className={robotoSemiBold.className}>34.678 Mil</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Node Commission Fee</div>
                <div className={robotoSemiBold.className}>5%</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Platform Commission Fee</div>
                <div className={robotoSemiBold.className}>5%</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Stack Commission Fee (of Platform Fee)</div>
                <div className={robotoSemiBold.className}>10%</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Time Lock Setting</div>
                <div className={robotoSemiBold.className}>3 Days</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Voter / Relay Threshold</div>
                <div className={robotoSemiBold.className}>13 of 20</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[20px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-color-text2'>Max Trust Validators (per Node)</div>
                <div className={robotoSemiBold.className}>100</div>
            </div>
            
        </div>
    </div>
  )
}
