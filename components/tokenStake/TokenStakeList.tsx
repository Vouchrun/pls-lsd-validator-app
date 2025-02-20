import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { EmptyContent } from 'components/common/EmptyContent';
import { LoadingContent } from 'components/common/LoadingContent';
import { Icomoon } from 'components/icon/Icomoon';
import { getValidatorProfileUrl } from 'config/explorer';
import { robotoSemiBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useIsTrustedValidator } from 'hooks/useIsTrustedValidator';
import { usePubkeysHome } from 'hooks/usePubkeysHome';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { PubkeyStatus } from 'interfaces/common';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { isPubkeyStakeable } from 'utils/commonUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { getShortAddress } from 'utils/stringUtils';
import { TokenStakeListTabs } from './TokenStakeListTabs';
import { updateValidatorStakeLoadingParams } from 'redux/reducers/AppSlice';
import { useAppDispatch } from 'hooks/common';
import { getValidatorInfoURL } from 'config/env';
import Image from 'next/image';
import leftIcon from 'public/images/arrow-left.svg';
import doubleLeftIcon from 'public/images/double-left.svg';
import doubleRightIcon from 'public/images/double-right.svg';
import rightIcon from 'public/images/arrow-right.svg';

export const TokenStakeList = () => {
  const router = useRouter();
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [page, setPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('All');
  const [allSelected, setAllSelected] = useState(false);
  const { isTrust } = useIsTrustedValidator();
  const dispatch = useAppDispatch();
  const selectedStatus = useMemo(() => {
    switch (selectedTab) {
      case 'All':
        return undefined;
      case 'Unmatched':
        return PubkeyStatus.Unmatched;
      case 'Staked':
        return PubkeyStatus.Staked;
      case 'Others':
        return PubkeyStatus.Others;
    }
  }, [selectedTab]);

  const {
    showLoading,
    showEmptyContent,
    displayPubkeyInfos,
    totalCount,
    unmatchedCount,
    stakedCount,
    othersCount,
  } = usePubkeysHome(metaMaskAccount, page, selectedStatus);
  // } = useNodePubkeys(
  //   "0x99C6a3B0d131C996D9f65275fB5a196a8B57B583",
  //   page,
  //   statusList
  // );

  const displaySoloPubkeyInfos = displayPubkeyInfos.filter(
    (item) => item.type === 'solo'
  );

  const displayTrustPubkeyInfos = displayPubkeyInfos.filter(
    (item) => item.type === 'trusted'
  );

  const showGroupStakeButton =
    displayTrustPubkeyInfos.filter(
      (item) => item.canStake && isPubkeyStakeable(item._status)
    ).length > 1 ||
    displaySoloPubkeyInfos.filter(
      (item) => item.canStake && isPubkeyStakeable(item._status)
    ).length > 1;

  // State to track checked items
  const [checkedItems, setCheckedItems] = useState<any>([]);

  // Handler to toggle checkbox values
  const handleCheckboxChange = (item: string) => (event: any) => {
    if (event.target.checked) {
      // Add item to the checkedItems array
      setCheckedItems((prev: string[]) => [...prev, item]);
    } else {
      // Remove item from the checkedItems array
      setCheckedItems((prev: string[]) =>
        prev.filter((checkedItem) => checkedItem !== item)
      );
    }
  };

  const handleAllSelected = (event: any) => {
    if (event.target.checked) {
      setAllSelected(true);
      // Add item to the checkedItems array
      paginatedItems.map((pubkeyInfo) => {
        setCheckedItems((prev: string[]) => [
          ...prev,
          pubkeyInfo.pubkeyAddress,
        ]);
      });
    } else {
      // Remove item from the checkedItems array
      setCheckedItems([]);
      setAllSelected(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);

  const totalItems = displayPubkeyInfos.length;
  const totalPages = Math.ceil(totalItems / resultsPerPage);

  const handleChangeResultsPerPage = (e: any) => {
    setResultsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page on results per page change
  };

  const handleFirstPage = () => {
    setAllSelected(false);
    setCheckedItems([]);
    setCurrentPage(1);
  };
  const handleLastPage = () => {
    setAllSelected(false);
    setCheckedItems([]);
    setCurrentPage(totalPages);
  };
  const handlePreviousPage = () =>
    setCurrentPage((prev) => {
      setAllSelected(false);
      setCheckedItems([]);
      return Math.max(prev - 1, 1);
    });
  const handleNextPage = () =>
    setCurrentPage((prev) => {
      setAllSelected(false);
      setCheckedItems([]);
      return Math.min(prev + 1, totalPages);
    });

  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, totalItems);
  const paginatedItems = displayPubkeyInfos.slice(startIndex, endIndex);

  return (
    <div>
      <div className='pt-[.24rem] flex items-center justify-between'>
        <div className='flex items-center'>
          <TokenStakeListTabs
            selectedTab={selectedTab}
            onChange={setSelectedTab}
            totalCount={totalCount}
            unmatchedCount={unmatchedCount}
            stakedCount={stakedCount}
            othersCount={othersCount}
          />

          <div className='ml-[.24rem]'>
            <CustomButton
              type='stroke'
              height='.42rem'
              className='px-[.16rem]'
              onClick={() => {
                router.push('/tokenStake/chooseType');
              }}
            >
              <div className='flex items-center'>
                <div>New Deposit</div>

                <div className='ml-[.06rem] rotate-[-90deg]'>
                  <Icomoon icon='arrow-down' size='.1rem' color='#848B97' />
                </div>
              </div>
            </CustomButton>
          </div>
        </div>

        {showGroupStakeButton && (
          <div className='mr-[.24rem]'>
            <CustomButton
              type='stroke'
              className='px-[.16rem]'
              height='.42rem'
              disabled={checkedItems.length === 0}
              onClick={() => {
                const stakeablePubkeyInfos = (
                  displaySoloPubkeyInfos.length > 1
                    ? displaySoloPubkeyInfos
                    : displayTrustPubkeyInfos
                ).filter((item) => isPubkeyStakeable(item._status));

                if (stakeablePubkeyInfos.length === 0) {
                  return;
                }

                const pubkeyAddressList = stakeablePubkeyInfos.map(
                  (item) => item.pubkeyAddress
                );

                dispatch(
                  updateValidatorStakeLoadingParams({
                    modalVisible: false,
                  })
                );
                router.push(
                  {
                    pathname: '/tokenStake/stake',
                    query: {
                      pubkeyAddressList: checkedItems,
                      type: isTrust ? 'trusted' : 'solo',
                    },
                  },
                  '/tokenStake/stake'
                );
              }}
            >
              <div className='flex items-center'>
                <div>Stake Selected Nodes</div>

                <div className='ml-[.06rem] rotate-[-90deg]'>
                  <Icomoon icon='arrow-down' size='.1rem' color='#848B97' />
                </div>
              </div>
            </CustomButton>
          </div>
        )}
      </div>

      <div className='mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div
          className={classNames(
            'h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]',
            robotoSemiBold.className
          )}
          style={{
            gridTemplateColumns: '20% 20% 20% 40%',
          }}
        >
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Pool Addr
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Node Addr
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Status
          </div>

          {selectedTab !== 'Unmatched' && selectedTab !== 'Staked' && (
            <div className='flex items-right justify-end text-[.16rem] text-color-text2 pr-[.60rem]'>
              Select Displayed
              <input
                type='checkbox'
                className='ml-[.24rem]'
                checked={allSelected}
                onChange={(e) => handleAllSelected(e)}
              />
            </div>
          )}
        </div>

        {showEmptyContent && (
          <div className='h-[2rem] flex items-center justify-center'>
            <EmptyContent />
          </div>
        )}

        {showLoading && (
          <div className='h-[2rem] flex items-center justify-center relative'>
            <LoadingContent />
          </div>
        )}

        {paginatedItems.map((pubkeyInfo, index) => (
          <div
            key={index}
            className={classNames(
              'h-[.74rem] grid items-center font-[500]',
              index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
            )}
            style={{
              gridTemplateColumns: '20% 20% 20% 40%',
            }}
          >
            <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
              <Icomoon
                icon='copy'
                size='.133rem'
                color={darkMode ? '#ffffff80' : '#6C86AD'}
                onClick={() => {
                  navigator.clipboard
                    .writeText(pubkeyInfo.pubkeyAddress)
                    .then(() => {
                      snackbarUtil.success('Copy success');
                    });
                }}
              />

              <div
                className='flex items-center'
                onClick={() => {
                  router.push(`/pubkey/${pubkeyInfo.pubkeyAddress}`);
                }}
              >
                <div className='mx-[.06rem]'>
                  {getShortAddress(pubkeyInfo.pubkeyAddress, 4)}
                </div>

                <Icomoon
                  icon='right1'
                  size='.12rem'
                  color={darkMode ? '#ffffff80' : '#6C86AD'}
                />
              </div>
            </div>

            <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
              <Icomoon
                icon='copy'
                size='.133rem'
                color={darkMode ? '#ffffff80' : '#6C86AD'}
                onClick={() => {
                  navigator.clipboard
                    .writeText(metaMaskAccount || '')
                    .then(() => {
                      snackbarUtil.success('Copy success');
                    });
                }}
              />

              <a
                className='flex items-center'
                href={
                  getValidatorInfoURL() +
                  'validator/' +
                  pubkeyInfo.pubkeyAddress
                }
                target='_blank'
              >
                <div className='mx-[.06rem]'>
                  {getShortAddress(metaMaskAccount, 4)}
                </div>

                <Icomoon
                  icon='right1'
                  size='.12rem'
                  color={darkMode ? '#ffffff80' : '#6C86AD'}
                />
              </a>
            </div>

            <div
              className={classNames(
                'flex items-center justify-center text-[.16rem] ',
                pubkeyInfo.displayStatus === 'Exited'
                  ? 'text-error'
                  : pubkeyInfo.displayStatus === 'Active'
                  ? 'text-color-text1'
                  : 'text-color-text2'
              )}
            >
              {!pubkeyInfo.canStake && pubkeyInfo.displayStatus === 'Matched'
                ? 'Unmatch'
                : pubkeyInfo.displayStatus}
            </div>

            <div className='flex items-center justify-end pr-[.56rem] text-[.16rem] text-color-text2'>
              {pubkeyInfo.canStake && isPubkeyStakeable(pubkeyInfo._status) && (
                <>
                  <CustomButton
                    height='.42rem'
                    className='px-[.5rem]'
                    onClick={() => {
                      dispatch(
                        updateValidatorStakeLoadingParams({
                          modalVisible: false,
                        })
                      );
                      router.push(
                        {
                          pathname: '/tokenStake/stake',
                          query: {
                            pubkeyAddressList: [pubkeyInfo.pubkeyAddress],
                            type: isTrust ? 'trusted' : 'solo',
                          },
                        },
                        '/tokenStake/stake'
                      );
                    }}
                  >
                    Stake
                  </CustomButton>
                  <input
                    type='checkbox'
                    key={index}
                    className='ml-[.24rem]'
                    checked={checkedItems.includes(pubkeyInfo.pubkeyAddress)}
                    onChange={handleCheckboxChange(pubkeyInfo.pubkeyAddress)}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className='flex items-center justify-center mt-1 md:flex-row flex-col'>
        <div className='flex items-center'>
          <div className='text-[#FE8A3C] text-[14px] mr-[10px]'>
            Result per page
          </div>
          <select
            value={resultsPerPage}
            onChange={handleChangeResultsPerPage}
            className='cursor-pointer px-[.16rem] h-[.42rem] inline-flex items-center justify-between rounded-[4px] border-[0.01rem] border-[#6C86AD80] bg-transparent shadow-none outline-none'
            style={{ color: '#6C86AD' }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={80}>80</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className='text-[#FE8A3C] text-[14px] mx-[40px] md:my-0 my-[15px] flex'>
          {startIndex + 1}-{endIndex} of {totalItems}
        </div>
        <div className='flex items-center'>
          <button
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            className='cursor-pointer h-[.42rem] w-[40px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C]'
          >
            <Image
              src={doubleLeftIcon}
              alt='First Page'
              height={12}
              width={16}
            />
          </button>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className='cursor-pointer h-[.42rem] w-[40px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C]'
          >
            <Image src={leftIcon} alt='Previous Page' height={5} width={9} />
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className='cursor-pointer h-[.42rem] w-[40px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C]'
          >
            <Image src={rightIcon} alt='Next Page' height={5} width={9} />
          </button>
          <button
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            className='cursor-pointer h-[.42rem] w-[40px] rounded-[4px] border-none mx-[3px] flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C]'
          >
            <Image
              src={doubleRightIcon}
              alt='Last Page'
              height={12}
              width={16}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
