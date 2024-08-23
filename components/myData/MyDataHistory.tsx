import { Popover } from '@mui/material';
import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { EmptyContent } from 'components/common/EmptyContent';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppSlice } from 'hooks/selector';
import _ from 'lodash';
import { bindPopover } from 'material-ui-popup-state';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { openLink } from 'utils/commonUtils';
import checkedIcon from 'public/images/checked.svg';
import { getLsdTokenName } from 'utils/configUtils';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { IOSSwitch } from 'components/common/CustomSwitch';
import { useRewardUpdateHour } from 'hooks/useRewardUpdateHour';
import { DataLoading } from 'components/common/DataLoading';
import { getLsdTokenIcon } from 'utils/iconUtils';

export const MyDataHistory = () => {
  const { darkMode } = useAppSlice();
  const [types, setTypes] = useState<string[]>([]);
  const [toggleOn, setToggleOn] = useState<boolean>(false);
  const { rewardUpdateHour } = useRewardUpdateHour();

  const typePopupState = usePopupState({
    variant: 'popover',
    popupId: 'type',
  });

  const displayTypesText = useMemo(() => {
    if (types.length === 0) {
      return 'All Types';
    } else if (types.length === 1) {
      return types[0];
    } else {
      return types.map((status) => status).join(',');
    }
  }, [types]);

  return (
    <div>
      <div className='mt-[.24rem] flex items-center'>
        <div
          className={classNames(
            'cursor-pointer px-[.16rem] h-[.42rem] inline-flex items-center justify-between rounded-[.3rem] border-[0.01rem]',
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

        <div className='ml-[.36rem] flex items-center'>
          <IOSSwitch
            // darkMode={darkMode}
            checked={toggleOn}
            onChange={(e) => {
              setToggleOn(e.target.checked);
            }}
          />

          <div className='text-[.16rem] text-color-text1 ml-[.06rem]'>
            Reward History
          </div>

          <div className='text-[.16rem] text-color-text2 ml-[.06rem] flex items-center'>
            (Updates every
            <div className='mx-[.06rem]'>
              {rewardUpdateHour === undefined ? (
                <DataLoading height='.16rem' />
              ) : (
                rewardUpdateHour
              )}
            </div>
            hours)
          </div>
        </div>
      </div>

      <div className='mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div className='mt-[.24rem] h-[.56rem] mx-[.24rem] bg-[#6C86AD14] dark:bg-[#6C86AD50] rounded-[.16rem] flex items-center justify-between pl-[.12rem] pr-[.18rem]'>
          <div className='flex items-center'>
            <Icomoon icon='tip' size='.2rem' />

            <div className='ml-[.06rem] text-color-text2 text-[.14rem] leading-normal'>
              Holding rTokens will keep generating rewards while you depositing
              them to farm and other yield protocols, but it can't be shown in
              the est.Reward as the calculation limits.
            </div>
          </div>
        </div>

        <div
          className='h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]'
          style={{
            gridTemplateColumns: '20% 16% 16% 16% 16% 16%',
          }}
        >
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Token Name
          </div>
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Time (UTC)
          </div>
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Kind
          </div>
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Transaction
          </div>
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Balance
          </div>
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Rewards
          </div>
        </div>

        <div className='h-[2rem] flex items-center justify-center'>
          <EmptyContent />
        </div>

        {/* <MyDataHistoryItem index={0} /> */}

        <ChooseTypePopover
          popupState={typePopupState}
          types={types}
          onChangeTypes={setTypes}
          onClose={() => {
            typePopupState.close();
          }}
        />
      </div>
    </div>
  );
};

interface MyDataHistoryItemProps {
  index: number;
}

const MyDataHistoryItem = (props: MyDataHistoryItemProps) => {
  const { index } = props;

  return (
    <div
      className={classNames(
        'h-[.74rem] grid items-center font-[500]',
        index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
      )}
      style={{
        gridTemplateColumns: '20% 16% 16% 16% 16% 16%',
      }}
    >
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        <div
          className='cursor-pointer mx-[.24rem] flex-1 h-[.42rem] flex items-center justify-between bg-color-bgPage rounded-[.6rem] border-[0.01rem] border-color-border1'
          onClick={() => {}}
        >
          <div className='flex items-center'>
            <div className='w-[.34rem] h-[.34rem] min-w-[.34rem] relative ml-[.04rem]'>
              <Image src={getLsdTokenIcon()} alt='logo' layout='fill' />
            </div>

            <div className='ml-[.08rem] text-[.16rem] text-color-text1'>
              {getLsdTokenName()}
            </div>
          </div>

          <div className='mr-[.16rem] -rotate-90'>
            <Icomoon icon='arrow-down' size='.1rem' color='#848B97' />
          </div>
        </div>
      </div>

      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        16 April 23:00
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        Stake
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        <div className='text-link'>+0.2</div>
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        0.8+0.2
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        0.05
      </div>
    </div>
  );
};

interface ChooseTypePopoverProps {
  popupState: any;
  onClose: () => void;
  types: string[];
  onChangeTypes: (types: string[]) => void;
}

const ChooseTypePopover = (props: ChooseTypePopoverProps) => {
  const { popupState, types, onChangeTypes, onClose } = props;
  const { darkMode } = useAppSlice();

  const onClickType = (type: string) => {
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
          </div>

          {types.length === 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-[#6C86AD4D]' />
          )}
        </div>

        <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType('Reward');
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              Reward
            </div>
          </div>

          {types.indexOf('Reward') >= 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-[#6C86AD4D]' />
          )}
        </div>

        <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

        <div
          className='cursor-pointer flex items-center justify-between'
          onClick={() => {
            onClickType('Withdraw');
          }}
        >
          <div className='flex items-center'>
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              Withdraw
            </div>
          </div>

          {types.indexOf('Withdraw') >= 0 ? (
            <div className='w-[.16rem] h-[.16rem] relative'>
              <Image src={checkedIcon} alt='checked' layout='fill' />
            </div>
          ) : (
            <div className='w-[.16rem] h-[.16rem] rounded-[0.03rem] border-solid border-[1px] border-[#6C86AD4D]' />
          )}
        </div>
      </div>
    </Popover>
  );
};
