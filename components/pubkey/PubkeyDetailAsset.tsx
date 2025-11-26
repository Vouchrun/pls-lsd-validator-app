import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { DataLoading } from 'components/common/DataLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { getValidatorInfoURL, getLsdAppUrl } from 'config/env';
import { fetchWithBeaconFallback } from 'utils/beaconUtils';
import { usePubkeyDetail } from 'hooks/usePubkeyDetail';
import { NodePubkeyInfo } from 'interfaces/common';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { openLink } from 'utils/commonUtils';
import { getLsdTokenName, getTokenName } from 'utils/configUtils';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { formatNumber } from 'utils/numberUtils';
import Web3 from 'web3';

const MINIMUM_BALANCE = 32000000;

export const PubkeyDetailAsset = (props: {
  pubkeyAddress: string | undefined;
  pubkeyInfo: NodePubkeyInfo | undefined;
}) => {
  const { pubkeyInfo, pubkeyAddress } = props;
  const [apiData, setApiData] = useState<any>(null);
  useEffect(() => {
    const getData = async () => {
      if (!pubkeyAddress) {
        return;
      }

      const apires = await fetchWithBeaconFallback(
        `/eth/v1/beacon/states/head/validators?id=${pubkeyAddress}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setApiData(apires.data[0]);
    };

    getData();
  }, [pubkeyAddress]);

  return (
    <div className='overflow-x-auto'>
      <div className='mt-[24px] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] min-w-[700px] overflow-hidden'>

        <div
          className='py-[15px] md:py-[20px] grid items-center font-[500] border-solid border-b-[.01rem] border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
          style={{
            gridTemplateColumns: '20% 20% 20% 20% 20%',
          }}
        >
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Index: {!apiData ? '--' : apiData?.index}
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Current {getTokenName()}
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Deposit {getTokenName()}
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            My Reward {getTokenName()}
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Validator Health
          </div>
        </div>

        <div
          className={classNames(
            'py-[15px] md:py-[20px] grid items-center font-[500]',
            'bg-bgPage/50 dark:bg-bgPageDark/50'
          )}
          style={{
            gridTemplateColumns: '20% 20% 20% 20% 20%',
          }}
        >
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div
              className='cursor-pointer mx-[24px] flex-1 h-[42px] flex items-center justify-between bg-color-bgPage rounded-[.6rem] border-[0.01rem] border-color-border1'
              onClick={() => {
                openLink(getLsdAppUrl());
              }}
            >
              <div className='flex items-center'>
                <div className='w-[.34rem] h-[34px] min-w-[34px] relative ml-[.04rem]'>
                  <Image src={getLsdTokenIcon()} alt='logo' layout='fill' />
                </div>

                <div className='ml-[.08rem] text-[14px] md:text-[16px] text-color-text1'>
                  {getLsdTokenName()}
                </div>
              </div>

              <div className='mr-[.16rem] -rotate-90'>
                <Icomoon icon='arrow-down' size='10px' color='#848B97' />
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            {pubkeyInfo === undefined ? (
              <DataLoading height='.16rem' />
            ) : (
              formatNumber(pubkeyInfo.currentTokenAmount, {
                hideDecimalsForZero: true,
              })
            )}
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            {pubkeyInfo === undefined ? (
              <DataLoading height='.16rem' />
            ) : (
              formatNumber(Web3.utils.fromWei(pubkeyInfo._nodeDepositAmount), {
                hideDecimalsForZero: true,
              })
            )}
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            --
          </div>

          <a
            className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'
            href={
              getValidatorInfoURL() + 'validator/' + pubkeyInfo?.pubkeyAddress
            }
            target='_blank'
          >
            {pubkeyInfo?.displayStatus === 'Exited' ||
              pubkeyInfo?.displayStatus === 'Withdrawal'
              ? '⚪'
              : !apiData
                ? '--'
                : apiData?.validator?.slashed
                  ? '🔴 Slashed'
                  : parseInt(apiData?.balance) / 10 ** 9 < MINIMUM_BALANCE
                    ? '🟡 Low Balance, Leaking'
                    : '🟢 Active, OK'}
          </a>
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
          className='cursor-pointer mx-[24px] flex-1 h-[.42rem] flex items-center justify-between bg-color-bgPage rounded-[.6rem] border-[0.01rem] border-color-border1'
          onClick={() => { }}
        >
          <div className='flex items-center'>
            <div className='w-[34px] h-[34px] min-w-[34px] relative ml-[.04rem]'>
              <Image src={getLsdTokenIcon()} alt='logo' layout='fill' />
            </div>

            <div className='ml-[.08rem] text-[.16rem] text-color-text1'>
              {getLsdTokenName()}
            </div>
          </div>

          <div className='mr-[.16rem] -rotate-90'>
            <Icomoon icon='arrow-down' size='10px' color='#848B97' />
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
