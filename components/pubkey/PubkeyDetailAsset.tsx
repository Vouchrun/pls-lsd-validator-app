import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { DataLoading } from 'components/common/DataLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { getLsdAppUrl } from 'config/env';
import { usePubkeyDetail } from 'hooks/usePubkeyDetail';
import { NodePubkeyInfo } from 'interfaces/common';
import Image from 'next/image';
import { useMemo } from 'react';
import { openLink } from 'utils/commonUtils';
import { getLsdTokenName, getTokenName } from 'utils/configUtils';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { formatNumber } from 'utils/numberUtils';
import Web3 from 'web3';

export const PubkeyDetailAsset = (props: {
  pubkeyAddress: string | undefined;
  pubkeyInfo: NodePubkeyInfo | undefined;
}) => {
  const { pubkeyInfo } = props;

  return (
    <div className='mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
      <div
        className='h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]'
        style={{
          gridTemplateColumns: '20% 20% 20% 20% 20%',
        }}
      >
        <div className='flex items-center justify-center text-[.16rem] text-color-text2'></div>

        <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
          Current {getTokenName()}
        </div>

        <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
          Deposit {getTokenName()}
        </div>

        <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
          My Reward {getTokenName()}
        </div>

        <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
          Slashed {getTokenName()}
        </div>
      </div>

      <div
        className={classNames(
          'h-[.74rem] grid items-center font-[500]',
          'bg-bgPage/50 dark:bg-bgPageDark/50'
        )}
        style={{
          gridTemplateColumns: '20% 20% 20% 20% 20%',
        }}
      >
        <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
          <div
            className='cursor-pointer mx-[.24rem] flex-1 h-[.42rem] flex items-center justify-between bg-color-bgPage rounded-[.6rem] border-[0.01rem] border-color-border1'
            onClick={() => {
              openLink(getLsdAppUrl());
            }}
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
          {pubkeyInfo === undefined ? (
            <DataLoading height='.16rem' />
          ) : (
            formatNumber(pubkeyInfo.currentTokenAmount, {
              hideDecimalsForZero: true,
            })
          )}
        </div>

        <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
          {pubkeyInfo === undefined ? (
            <DataLoading height='.16rem' />
          ) : (
            formatNumber(Web3.utils.fromWei(pubkeyInfo._nodeDepositAmount), {
              hideDecimalsForZero: true,
            })
          )}
        </div>

        <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
          --
        </div>

        <div className='flex items-center justify-center text-[.16rem] text-error'>
          --
        </div>
      </div>
    </div>
  );
};

interface AssetItemProps {
  index: number;
}

const MyDataAssetItem = (props: AssetItemProps) => {
  const { index } = props;

  return (
    <div
      className={classNames(
        'h-[.74rem] grid items-center font-[500]',
        index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
      )}
      style={{
        gridTemplateColumns: '20% 20% 20% 20% 20%',
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
        1.2k
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        1.2k
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-color-text1'>
        1.2k
      </div>
      <div className='flex items-center justify-center text-[.16rem] text-error'>
        1.2
      </div>
    </div>
  );
};
