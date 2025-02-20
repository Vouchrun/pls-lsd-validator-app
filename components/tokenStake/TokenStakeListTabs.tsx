import classNames from 'classnames';
import { useState } from 'react';

interface TokenStakeListTabsProps {
  selectedTab: string;
  onChange: (tab: string) => void;
  totalCount: number | undefined;
  unmatchedCount: number | undefined;
  stakedCount: number | undefined;
  matchedCount: number | undefined;
  othersCount: number | undefined;
}

export const TokenStakeListTabs = (props: TokenStakeListTabsProps) => {
  const {
    totalCount,
    unmatchedCount,
    stakedCount,
    matchedCount,
    othersCount,
    selectedTab,
    onChange,
  } = props;

  return (
    <div className='h-[.42rem] flex items-stretch p-[.04rem] bg-color-bg2 rounded-[.4rem]'>
      <div
        className={classNames(
          'px-[.24rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'All'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          onChange('All');
        }}
      >
        <div>All</div>

        <div
          className={classNames(
            'absolute right-0 top-0 w-[.20rem] h-[.20rem] items-center justify-center rounded-full',
            selectedTab === 'All'
              ? 'bg-[#6C86AD] text-white'
              : 'bg-[#E8EFFD] text-text2',
            totalCount === undefined ? 'hidden' : 'flex'
          )}
        >
          <div className='scale-[.6] origin-center'>{totalCount}</div>
        </div>
      </div>

      <div
        className={classNames(
          'ml-[.1rem] px-[.20rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'Unmatched'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          onChange('Unmatched');
        }}
      >
        <div>Unmatched</div>

        <div
          className={classNames(
            'absolute right-0 top-0 w-[.20rem] h-[.20rem] items-center justify-center rounded-full',
            selectedTab === 'Unmatched'
              ? 'bg-[#6C86AD] text-white'
              : 'bg-[#E8EFFD] text-text2',
            unmatchedCount === undefined ? 'hidden' : 'flex'
          )}
        >
          <div className='scale-[.6] origin-center'>{unmatchedCount}</div>
        </div>
      </div>

      <div
        className={classNames(
          'ml-[.1rem] px-[.24rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'Staked'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          onChange('Staked');
        }}
      >
        <div>Staked</div>

        <div
          className={classNames(
            'absolute right-0 top-0 w-[.20rem] h-[.20rem] items-center justify-center rounded-full',
            selectedTab === 'Staked'
              ? 'bg-[#6C86AD] text-white'
              : 'bg-[#E8EFFD] text-text2',
            stakedCount === undefined ? 'hidden' : 'flex'
          )}
        >
          <div className='scale-[.6] origin-center'>{stakedCount}</div>
        </div>
      </div>

      <div
        className={classNames(
          'ml-[.1rem] px-[.24rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'Matched'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          onChange('Matched');
        }}
      >
        <div>Matched</div>

        <div
          className={classNames(
            'absolute right-0 top-0 w-[.20rem] h-[.20rem] items-center justify-center rounded-full',
            selectedTab === 'Staked'
              ? 'bg-[#6C86AD] text-white'
              : 'bg-[#E8EFFD] text-text2',
            matchedCount === undefined ? 'hidden' : 'flex'
          )}
        >
          <div className='scale-[.6] origin-center'>{matchedCount}</div>
        </div>
      </div>

      <div
        className={classNames(
          'ml-[.1rem] px-[.24rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'Others'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          onChange('Others');
        }}
      >
        <div>Others</div>

        <div
          className={classNames(
            'absolute right-0 top-0 w-[.20rem] h-[.20rem] items-center justify-center rounded-full',
            selectedTab === 'Others'
              ? 'bg-[#6C86AD] text-white'
              : 'bg-[#E8EFFD] text-text2',
            othersCount === undefined ? 'hidden' : 'flex'
          )}
        >
          <div className='scale-[.6] origin-center'>{othersCount}</div>
        </div>
      </div>
    </div>
  );
};
