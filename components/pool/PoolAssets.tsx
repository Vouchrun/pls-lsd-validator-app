import classNames from 'classnames';
import { DataLoading } from 'components/common/DataLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { getNetworkWithdrawContract } from 'config/contract';
import { getLsdAppUrl, getValidatorInfoURL } from 'config/env';
import { robotoSemiBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { usePoolData } from 'hooks/usePoolData';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { formatValidatorDespositAmount, openLink } from 'utils/commonUtils';
import {
  getLsdTokenName,
  getTokenName,
  isSupportTokenPrice,
} from 'utils/configUtils';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { formatNumber } from 'utils/numberUtils';

export const PoolAssets = () => {
  const router = useRouter();
  const { darkMode } = useAppSlice();
  const {
    poolEth,
    mintedLsdToken,
    unmatchedEth,
    matchedValidators,
    mintedLsdTokenValue,
    stakedToken,
    stakedTokenValue,
  } = usePoolData();
  const networkwithdrawAddress = getNetworkWithdrawContract();

  return (
    <div className='overflow-x-auto'>
      <div className='mt-[24px] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] min-w-[700px] overflow-hidden'>
        <div
          className='py-[15px] md:py-[20px] grid items-center font-[500] border-solid border-b-[.01rem] border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
          style={{
            gridTemplateColumns: '20% 16% 16% 16% 16% 16%',
          }}
        >
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'></div>
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Pool {getTokenName()}
          </div>
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Minted {getLsdTokenName()}
          </div>
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Staked {getTokenName()}
          </div>
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Unmatched {getTokenName()}
          </div>
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
            Active Validators
          </div>
        </div>

        <div
          className={classNames(
            'py-[15px] md:py-[20px] grid items-center font-[500]',
            'bg-bgPage/50 dark:bg-bgPageDark/50'
          )}
          style={{
            gridTemplateColumns: '20% 16% 16% 16% 16% 16%',
          }}
        >
          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div
              className='cursor-pointer mx-[.24rem] flex-1 h-[42px] flex items-center justify-between bg-color-bgPage rounded-[.6rem] border-[0.01rem] border-color-border1'
              onClick={() => {
                openLink(getLsdAppUrl());
              }}
            >
              <div className='flex items-center'>
                <div className='w-[34px] h-[34px] min-w-[34px] relative ml-[.04rem]'>
                  <Image src={getLsdTokenIcon()} alt='logo' layout='fill' />
                </div>

                <div className='ml-[.08rem] text-[14px] md:text-[16px] text-color-text1'>
                  {getLsdTokenName()}
                </div>
              </div>

              <div className='mr-[16px] -rotate-90'>
                <Icomoon icon='arrow-down' size='10px' color='#848B97' />
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div className='flex flex-col items-center'>
              <div className={robotoSemiBold.className}>
                {poolEth === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  formatNumber(poolEth, { hideDecimalsForZero: true })
                )}
              </div>

              <div className='text-color-text2 mt-[24px] hidden'>
                -- Contracts
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div className='flex flex-col items-center'>
              <div className={robotoSemiBold.className}>
                {mintedLsdToken === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  formatNumber(mintedLsdToken, { hideDecimalsForZero: true })
                )}
              </div>

              <div
                className={classNames(
                  'text-color-text2 mt-[24px]',
                  isSupportTokenPrice() ? '' : 'hidden'
                )}
              >
                {mintedLsdTokenValue === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  `$ ${formatNumber(mintedLsdTokenValue, {
                    hideDecimalsForZero: true,
                    decimals: 2,
                  })}`
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div className='flex flex-col items-center'>
              <div className={robotoSemiBold.className}>
                {stakedToken === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  formatNumber(stakedToken, { hideDecimalsForZero: true })
                )}
              </div>

              <div
                className={classNames(
                  'text-color-text2 mt-[24px]',
                  isSupportTokenPrice() ? '' : 'hidden'
                )}
              >
                {stakedTokenValue === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  `$ ${formatNumber(stakedTokenValue, {
                    hideDecimalsForZero: true,
                    decimals: 2,
                  })}`
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div className='flex flex-col items-center'>
              <div className={robotoSemiBold.className}>
                {unmatchedEth === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  formatNumber(unmatchedEth, { hideDecimalsForZero: true })
                )}
              </div>
              <div className='text-color-text2 mt-[24px]'>
                {formatValidatorDespositAmount} {getTokenName()} / Pool
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
            <div className='flex flex-col items-center'>
              <div className={robotoSemiBold.className}>
                {matchedValidators === undefined ? (
                  <DataLoading height='16px' />
                ) : (
                  <>
                    {matchedValidators}
                    <a
                      className='min-w-[.15rem] min-h-[.15rem] ml-[.1rem]'
                      href={
                        getValidatorInfoURL() +
                        'validators?v=' +
                        networkwithdrawAddress
                      }
                      target='_blank'
                    >
                      <Icomoon icon='share' size='12px' />
                    </a>
                  </>
                )}
              </div>

              <div
                className='flex items-center mt-[24px] cursor-pointer'
                onClick={() => {
                  router.push('/tokenStake/chooseType');
                }}
              >
                <div className='mr-[.06rem]'>Apply For Validator</div>

                <Icomoon
                  icon='right'
                  color={darkMode ? '#ffffff80' : '#6C86AD'}
                  size='12px'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};
