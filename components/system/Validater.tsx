import React from 'react'
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { robotoSemiBold } from 'config/font';

export default function Validater() {
    const { darkMode } = useAppSlice();
  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div className='h-[.7rem] flex items-center justify-between font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2 px-[30px]'>
            <span>Trusted Validator Node Address</span>
            <span>Active Validators</span>
        </div>
        <div className={classNames(
          'font-[500] min-h-[350px] py-[20px]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}>
            <div className={darkMode ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-[13px] truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                <div className={robotoSemiBold.className}>57</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-[13px] truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                <div className={robotoSemiBold.className}>57</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-[13px] truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                <div className={robotoSemiBold.className}>57</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-[13px] truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                <div className={robotoSemiBold.className}>57</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-[13px] truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                <div className={robotoSemiBold.className}>57</div>
            </div>
            <div className={darkMode ? 'flex items-center justify-between px-[30px] py-[8px] border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1' : 'flex items-center justify-between px-[20px] py-[5px] border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1'}>
                <div className='text-[13px] truncate'>0x61135C59A4Eb452b89963188eD6B6a7487049764</div>
                <div className={robotoSemiBold.className}>57</div>
            </div>
            
            
            
        </div>
    </div>
  )
}
