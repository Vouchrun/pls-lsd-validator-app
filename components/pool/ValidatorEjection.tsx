import { Popover } from '@mui/material';
import classNames from 'classnames';
import { EmptyContent } from 'components/common/EmptyContent';
import { Icomoon } from 'components/icon/Icomoon';

import { getValidatorInfoURL } from 'config/env';
import { robotoBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import * as moment from 'moment';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useMemo, useState, useEffect } from 'react';
import { getValidatorEjectionTypeText, openLink } from 'utils/commonUtils';
import { getDocLinks } from 'utils/configUtils';
import { getShortAddress } from 'utils/stringUtils';
import checkedIcon from 'public/images/checked.svg';
import doubleLeftIcon from 'public/images/double-left.svg';
import doubleRightIcon from 'public/images/double-right.svg';
import leftIcon from 'public/images/arrow-left.svg';
import rightIcon from 'public/images/arrow-right.svg';
import { bindTrigger } from 'material-ui-popup-state';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { ValidatorEjectionStatusType } from 'interfaces/common';
import _ from 'lodash';
import { useValidatorEjectionData } from 'hooks/useValidatorEjectionData';
import { LoadingContent } from 'components/common/LoadingContent';

export const ValidatorEjection = () => {
  const { darkMode } = useAppSlice();
  const router = useRouter();

  const [types, setTypes] = useState<ValidatorEjectionStatusType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);

  const displayTypesText = useMemo(() => {
    if (types.length === 0) {
      return 'All Types';
    } else if (types.length === 1) {
      return getValidatorEjectionTypeText(types[0]);
    } else {
      return types
        .map((status) => getValidatorEjectionTypeText(status))
        .join(',');
    }
  }, [types]);

  const {
    totalCount,
    validatorElectionData,
    showLoading,
    showEmptyContent,
    delayedCount,
    pendingCount,
    exitedCount,
    othersCount,
    isLoadingMore,
  } = useValidatorEjectionData(types);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [types]);

  const typePopupState = usePopupState({
    variant: 'popover',
    popupId: 'type',
  });

  // Pagination calculations
  const totalPages = Math.ceil(
    (validatorElectionData?.length || 0) / resultsPerPage
  );
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(
    startIndex + resultsPerPage,
    validatorElectionData?.length || 0
  );
  const paginatedData = validatorElectionData.slice(startIndex, endIndex);

  const handleChangeResultsPerPage = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newResultsPerPage = parseInt(event.target.value);
    setResultsPerPage(newResultsPerPage);
    setCurrentPage(1);
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const handleChangeTypes = (newTypes: ValidatorEjectionStatusType[]) => {
    setTypes(newTypes);
  };

  return (
    <div>
      <div className='mt-[48px] flex items-center justify-between'>
        <div className='flex items-center flex-col md:flex-row'>
          <div
            className={classNames(
              robotoBold.className,
              'text-[20px] md:text-[24px] text-color-text1'
            )}
          >
            Validator Election
          </div>

          <div
            className={classNames(
              'md:ml-[16px] items-center cursor-pointer mt-[10px] md:mt-0',
              getDocLinks().ejectionMechanism ? 'flex' : 'hidden'
            )}
            onClick={() => {
              openLink(getDocLinks().ejectionMechanism);
            }}
          >
            <div className='text-color-text2 text-[16px]'>
              Ejection Mechanism
            </div>

            <div className='ml-[.06rem] flex items-center'>
              <Icomoon
                icon='right'
                size='10px'
                color={darkMode ? '#ffffff80' : '#6C86AD'}
              />
            </div>
          </div>
        </div>
        <div>
          <div
            className={classNames(
              'mr-[24px] cursor-pointer px-[16px] h-[42px] inline-flex items-center justify-between rounded-[.3rem] border-[0.01rem]',
              typePopupState.isOpen
                ? 'border-[#ffffff00] bg-color-selected'
                : 'border-[#6C86AD80]'
            )}
            {...bindTrigger(typePopupState)}
          >
            <div
              className={classNames(
                'flex-1 text-[16px]  flex items-center justify-center',
                typePopupState.isOpen ? 'text-text1' : 'text-color-text2'
              )}
              style={{
                maxLines: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 1,
                lineClamp: 1,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-all',
              }}
            >
              {displayTypesText}
            </div>

            <div className='ml-[.2rem]'>
              <Icomoon icon='arrow-down' size='10px' color='#848B97' />
            </div>
          </div>
        </div>
      </div>
      <div className='overflow-x-auto'>
        <div className='mt-[24px] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] min-w-[800px]'>
          <div
            className='py-[15px] md:py-[20px] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]'
            style={{
              gridTemplateColumns: '20% 20% 20% 20% 20%',
            }}
          >
            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Node Address
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Pool Address
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Exited
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Election Time (UTC)
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Status
            </div>
          </div>

          <div className='max-h-[4.2rem] overflow-auto'>
            {!showLoading &&
              !showEmptyContent &&
              paginatedData.map((item: any, index: number) => (
                <div
                  key={index}
                  className={classNames(
                    'py-[15px] md:py-[20px] grid items-center font-[500]',
                    index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
                  )}
                  style={{
                    gridTemplateColumns: '20% 20% 20% 20% 20%',
                  }}
                >
                  <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2 cursor-pointer'>
                    <div className='flex items-center'>
                      <div
                        className='mx-[.06rem]'
                        onClick={() => {
                          router.push(`/pubkey/${item.nodeAddress}`);
                        }}
                      >
                        {getShortAddress(item.nodeAddress, 4)}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2 cursor-pointer'>
                    <div className='mx-[.06rem]'>
                      <a
                        href={
                          getValidatorInfoURL() + 'validator/' + item.poolAddress
                        }
                        target='_blank'
                      >
                        {getShortAddress(item.poolAddress, 4)}
                      </a>
                    </div>
                  </div>

                  <div className='flex items-center justify-center text-[14px] md:text-[16px] cursor-pointer'>
                    <div className='mx-[.06rem]'>{item.statusSymbol}</div>
                  </div>

                  <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2 cursor-pointer'>
                    <div className='mx-[.06rem]'>
                      {moment.utc(item.timeStamp).format('D MMM YYYY h:mm a')}
                    </div>
                  </div>

                  <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2 cursor-pointer'>
                    <div className='mx-[.06rem]'>{item.status}</div>
                  </div>
                </div>
              ))}

            {isLoadingMore && (
              <div className='h-[.74rem] flex items-center justify-center'>
                <div className='text-[16px] text-color-text2'>
                  Loading more data...
                </div>
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



          {/* <NodeElectionItem index={0} /> */}

          {/* <div className="my-[.32rem] flex items-center justify-center">
          <CustomPagination page={page} onChange={setPage} totalCount={1} />
        </div> */}
        </div>

        <ChooseTypePopover
          totalCount={totalCount}
          activeCount={delayedCount}
          pendingCount={pendingCount}
          exitedCount={exitedCount}
          othersCount={othersCount}
          popupState={typePopupState}
          data={validatorElectionData}
          types={types}
          onChangeTypes={handleChangeTypes}
        />
      </div>
      {!showEmptyContent &&
        !showLoading &&
        validatorElectionData.length > 0 && (
          <div className='flex items-center justify-center mt-1 md:flex-row flex-col p-[16px]'>
            <div className='flex items-center'>
              <div className='text-[#FE8A3C] text-[14px] mr-[10px]'>
                Result per page
              </div>
              <select
                value={resultsPerPage}
                onChange={handleChangeResultsPerPage}
                className='cursor-pointer px-[16px] h-[35px] inline-flex items-center justify-between rounded-[4px] border-[0.01rem] border-[#6C86AD80] bg-transparent shadow-none outline-none text-[14px]'
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
              {startIndex + 1}-{endIndex} of {validatorElectionData.length}
            </div>
            <div className='flex items-center'>
              <button
                onClick={handleFirstPage}
                disabled={currentPage === 1}
                className='cursor-pointer h-[35px] w-[35px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50'
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
                className='cursor-pointer h-[35px] w-[35px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50'
              >
                <Image
                  src={leftIcon}
                  alt='Previous Page'
                  height={5}
                  width={9}
                />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className='cursor-pointer h-[35px] w-[35px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50'
              >
                <Image src={rightIcon} alt='Next Page' height={5} width={9} />
              </button>
              <button
                onClick={handleLastPage}
                disabled={currentPage === totalPages}
                className='cursor-pointer h-[35px] w-[35px] rounded-[4px] border-none mx-[3px] flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50'
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
        )}
    </div>
  );
};

const ChooseTypePopover = (props: any) => {
  const {
    popupState,
    types,
    onChangeTypes,
    totalCount,
    activeCount,
    pendingCount,
    exitedCount,
    othersCount,
    onClose,
  } = props;

  const { darkMode } = useAppSlice();

  const onClickType = (type: ValidatorEjectionStatusType) => {
    if (types.indexOf(type) >= 0) {
      onChangeTypes(_.without(types, type));
    } else {
      onChangeTypes(_.concat(types, type));
    }
    // Don't close the popover to allow multiple selections
  };

  return (
    <Popover
      {...bindPopover(popupState)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      elevation={0}
      sx={{
        marginTop: '.15rem',
        '& .MuiPopover-paper': {
          background: darkMode ? '#6C86AD4D' : '#ffffff80',
          border: darkMode
            ? '0.01rem solid #6C86AD80'
            : '0.01rem solid #FFFFFF',
          backdropFilter: 'blur(.4rem)',
          borderRadius: '.3rem',
        },
        '& .MuiTypography-root': {
          padding: '0px',
        },
        '& .MuiBox-root': {
          padding: '0px',
        },
      }}
    >
      <div
        className={classNames('p-[16px] w-[280px]', darkMode ? 'dark' : '')}
      >
        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onChangeTypes([]);
            // Don't close popover to show the change
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[12px] text-color-text1 text-[16px]'>
              All
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[16px] h-[16px] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                totalCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center text-[16px]'>{totalCount}</div>
            </div>
          </div>

          {types.length === 0 ? (
            <div className='w-[16px] h-[16px] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[16px] h-[16px] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>

        <div className='my-[16px] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType(ValidatorEjectionStatusType.Delayed);
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[12px] text-color-text1 text-[16px]'>
              Delayed
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[16px] h-[16px] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                activeCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center text-[16px]'>{activeCount}</div>
            </div>
          </div>

          {types.indexOf(ValidatorEjectionStatusType.Delayed) >= 0 ? (
            <div className='w-[16px] h-[16px] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[16px] h-[16px] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>

        <div className='my-[16px] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType(ValidatorEjectionStatusType.Exiting);
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[12px] text-color-text1 text-[16px]'>
              Exiting
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[16px] h-[16px] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                pendingCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center text-[16px]'>{pendingCount}</div>
            </div>
          </div>

          {types.indexOf(ValidatorEjectionStatusType.Exiting) >= 0 ? (
            <div className='w-[16px] h-[16px] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[16px] h-[16px] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>

        <div className='my-[16px] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType(ValidatorEjectionStatusType.Withdrawn);
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[12px] text-color-text1 text-[16px]'>
              Withdrawn
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[16px] h-[16px] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                exitedCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center text-[16px]'>{exitedCount}</div>
            </div>
          </div>

          {types.indexOf(ValidatorEjectionStatusType.Withdrawn) >= 0 ? (
            <div className='w-[16px] h-[16px] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[16px] h-[16px] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>
      </div>
    </Popover>
  );
};
