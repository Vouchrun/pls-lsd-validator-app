import React from 'react';
import classNames from 'classnames';
import { useAppSlice } from 'hooks/selector';
import { robotoSemiBold } from 'config/font';
import { useNetworkProposalData } from 'hooks/useNetworkProposalData';

export default function Voter() {
  const { darkMode } = useAppSlice();
  const { voters } = useNetworkProposalData();
  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
      <div className='h-[.7rem] flex items-center justify-between font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2 px-[30px]'>
        <span>Voter / Relays</span>
        {/* <span>Last Voted</span> */}
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
              {/* <div className={robotoSemiBold.className}>10 Aug 2024 7:45pm</div> */}
            </div>
          ))}
      </div>
    </div>
  );
}
