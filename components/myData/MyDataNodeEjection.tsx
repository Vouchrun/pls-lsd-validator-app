import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { EmptyContent } from 'components/common/EmptyContent';
import { Icomoon } from 'components/icon/Icomoon';
import { getValidatorInfoURL } from 'config/env';
import { getValidatorProfileUrl } from 'config/explorer';
import { robotoBold, robotoSemiBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useValidatorEjectionData } from 'hooks/useValidatorEjectionData';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useMemo, useState } from 'react';
import { getValidatorEjectionTypeText, openLink } from 'utils/commonUtils';
import checkedIcon from 'public/images/checked.svg';
import { getShortAddress } from 'utils/stringUtils';
import * as moment from 'moment';
import { LoadingContent } from 'components/common/LoadingContent';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ValidatorEjectionStatusType } from 'interfaces/common';
import {
  bindPopover,
  bindTrigger,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import _ from 'lodash';
import { Popover } from '@mui/material';

export const MyDataNodeEjection = () => {
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [page, setPage] = useState(1);
  const router = useRouter();

  const [types, setTypes] = useState<ValidatorEjectionStatusType[]>([]);

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
  } = useValidatorEjectionData(types, metaMaskAccount);

  const typePopupState = usePopupState({
    variant: 'popover',
    popupId: 'type',
  });

  return (
    <div>
      <div className='mt-[.48rem] flex items-center justify-between'>
        <div className='flex items-center'>
          <div
            className={classNames(
              robotoBold.className,
              'text-[.24rem] text-color-text1'
            )}
          >
            Node Ejection
          </div>

          <div className='ml-[.24rem]'>
            <CustomButton
              type='stroke'
              className='px-[.16rem]'
              height='.42rem'
              fontSize='.14rem'
              textColor={darkMode ? '#ffffff80' : '#6C86AD'}
              onClick={() => {
                openLink(getValidatorProfileUrl(metaMaskAccount || ''));
              }}
            >
              <div className='flex items-center'>
                <div>
                  <span className={classNames(robotoSemiBold.className)}>
                    Node Address:
                  </span>{' '}
                  {getShortAddress(metaMaskAccount, 5)}
                </div>

                <div className='ml-[.06rem] rotate-[-90deg]'>
                  <Icomoon icon='arrow-down' size='.1rem' color='#848B97' />
                </div>
              </div>
            </CustomButton>
          </div>
        </div>
        <div>
          <div
            className={classNames(
              'mr-[.24rem] cursor-pointer px-[.16rem] h-[.42rem] inline-flex items-center justify-between rounded-[.3rem] border-[0.01rem]',
              typePopupState.isOpen
                ? 'border-[#ffffff00] bg-color-selected'
                : 'border-[#6C86AD80]'
            )}
            {...bindTrigger(typePopupState)}
          >
            <div
              className={classNames(
                'flex-1 text-[.16rem] w-[0.8rem] flex items-center justify-center',
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
              <Icomoon icon='arrow-down' size='.1rem' color='#848B97' />
            </div>
          </div>
        </div>
      </div>

      <div className='mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div
          className='h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]'
          style={{
            gridTemplateColumns: '25% 25% 25% 25%',
          }}
        >
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Pool Address
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Exited
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Election Time (UTC)
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Status
          </div>
        </div>

        <div className='max-h-[4.2rem] overflow-auto'>
          {validatorElectionData
            .filter((item: any) => item.nodeAddress == metaMaskAccount)
            .map((item: any, index: number) => (
              <div
                key={index}
                className={classNames(
                  'h-[.74rem] grid items-center font-[500]',
                  index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
                )}
                style={{
                  gridTemplateColumns: '25% 25% 25% 25%',
                }}
              >
                <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
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

                <div className='flex items-center justify-center text-[.16rem] cursor-pointer'>
                  <div className='mx-[.06rem]'>{item.statusSymbol}</div>
                </div>

                <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
                  <div className='mx-[.06rem]'>
                    {moment.utc(item.timeStamp).format('D MMM YYYY h:mm a')}
                  </div>
                </div>

                <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
                  <div className='mx-[.06rem]'>{item.status}</div>
                </div>
              </div>
            ))}
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
        onChangeTypes={setTypes}
        onClose={() => {
          typePopupState.close();
        }}
      />
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
  } = props;

  const { darkMode } = useAppSlice();

  const onClickType = (type: ValidatorEjectionStatusType) => {
    if (types.indexOf(type) >= 0) {
      onChangeTypes(_.without(types, type));
    } else {
      onChangeTypes(_.concat(types, type));
    }
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
        className={classNames('p-[.16rem] w-[3.1rem]', darkMode ? 'dark' : '')}
      >
        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onChangeTypes([]);
            // onClose();
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              All
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[.16rem] h-[.16rem] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                totalCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center'>{totalCount}</div>
            </div>
          </div>

          {types.length === 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>

        <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType(ValidatorEjectionStatusType.Delayed);
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              Delayed
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[.16rem] h-[.16rem] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                activeCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center'>{activeCount}</div>
            </div>
          </div>

          {types.indexOf(ValidatorEjectionStatusType.Delayed) >= 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>

        <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType(ValidatorEjectionStatusType.Pending);
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              Pending
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[.16rem] h-[.16rem] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                pendingCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center'>{pendingCount}</div>
            </div>
          </div>

          {types.indexOf(ValidatorEjectionStatusType.Pending) >= 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>

        <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType(ValidatorEjectionStatusType.Exited);
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              Exited
            </div>

            <div
              className={classNames(
                'ml-[.03rem] mb-[.1rem] w-[.16rem] h-[.16rem] items-center justify-center rounded-full',
                'bg-[#E8EFFD] text-text2',
                exitedCount === undefined ? 'hidden' : 'flex'
              )}
            >
              <div className='scale-[.6] origin-center'>{exitedCount}</div>
            </div>
          </div>

          {types.indexOf(ValidatorEjectionStatusType.Exited) >= 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-color-border3' />
          )}
        </div>
      </div>
    </Popover>
  );
};
