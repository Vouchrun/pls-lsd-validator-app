import classNames from 'classnames';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

interface MyDataTabsProps {}

export const MyDataTabs = (props: MyDataTabsProps) => {
  const router = useRouter();

  const selectedTab = useMemo(() => {
    const tabParam = router.query.tab;
    if (tabParam) {
      switch (tabParam) {
        case 'assets':
        case 'pubkeys':
        case 'history':
          return tabParam;
        default:
          return 'assets';
      }
    }
    return 'assets';
  }, [router.query]);

  const updateTab = (tab: string) => {
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          tab,
        },
      },
      undefined,
      {
        scroll: false,
      }
    );
  };

  return (
    <div className='h-[.42rem] flex items-stretch p-[.04rem] bg-color-bg2 rounded-[.4rem]'>
      <div
        className={classNames(
          'px-[.24rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'assets'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          updateTab('assets');
        }}
      >
        <div>Assets</div>
      </div>

      <div
        className={classNames(
          'ml-[.1rem] px-[.16rem] flex items-center justify-center relative cursor-pointer',
          selectedTab === 'pubkeys'
            ? 'bg-color-highlight text-white dark:text-text1 rounded-[.4rem]'
            : 'text-text1 dark:text-white'
        )}
        onClick={() => {
          updateTab('pubkeys');
        }}
      >
        <div>Pubkeys</div>
      </div>

      {/* <div
        className={classNames(
          "ml-[.1rem] px-[.24rem] flex items-center justify-center relative cursor-pointer",
          selectedTab === "history"
            ? "bg-color-highlight text-white dark:text-text1 rounded-[.4rem]"
            : "text-text1 dark:text-white"
        )}
        onClick={() => {
          updateTab("history");
        }}
      >
        <div>History</div>
      </div> */}
    </div>
  );
};
