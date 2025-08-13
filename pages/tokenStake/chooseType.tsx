import classNames from 'classnames';
import { CardContainer } from 'components/common/CardContainer';
import { CustomButton } from 'components/common/CustomButton';
import { ChooseTypeGuide } from 'components/tokenStake/ChooseTypeGuide';
import { robotoBold } from 'config/font';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useIsTrustedValidator } from 'hooks/useIsTrustedValidator';
import { useSoloDepositEnabled } from 'hooks/useSoloDepositEnabled';
import { useSoloNodeDepositAmount } from 'hooks/useSoloNodeDepositAmount';
import { useTrustDepositEnabled } from 'hooks/useTrustDepositEnabled';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { RootState } from 'redux/store';
import { openLink } from 'utils/commonUtils';
import { getTokenName } from 'utils/configUtils';

const ChooseTypePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isTrust } = useIsTrustedValidator();
  const { metaMaskAccount } = useWalletAccount();

  const { soloNodeDepositAmount } = useSoloNodeDepositAmount();
  const soloDepositEnabled = useSoloDepositEnabled();
  const trustDepositEnabled = useTrustDepositEnabled();

  const soloDisabled =
    !soloDepositEnabled ||
    !soloNodeDepositAmount ||
    Number(soloNodeDepositAmount) === 0 ||
    isTrust ||
    !metaMaskAccount;

  return (
    <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto'>
      <div className='flex mt-[24px] items-start flex-col lg:flex-row'>
        <CardContainer width='100%' title='Choose Validator Type'>
          <div
            className='p-[.52rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]'
            
          >
            <div className='rounded-[.16rem] bg-color-bgPage flex flex-col items-center justify-between'>
              <div className='mt-[.32rem] flex flex-col items-center'>
                <div
                  className={classNames(
                    'text-[16px] text-color-text1',
                    robotoBold.className
                  )}
                >
                  Solo Validator
                </div>

                <div
                  className={classNames(
                    'text-[14px] text-color-text2 mt-[.14rem] text-center mx-[.12rem] leading-snug'
                  )}
                >
                  Deposit {getTokenName()} to be delegated
                </div>
              </div>

              <div className='self-stretch mb-[.24rem] mt-[24px] mx-[.16rem]'>
                <CustomButton
                  height='42px'
                  disabled={soloDisabled}
                  onClick={() => {
                    router.push('/tokenStake/soloDeposit');
                  }}
                >
                  <div className='text-[15px]'>Next</div>
                </CustomButton>
              </div>
            </div>

            <div className=' rounded-[.16rem] bg-color-bgPage flex flex-col items-center justify-between'>
              <div className='mt-[.32rem] flex flex-col items-center'>
                <div
                  className={classNames(
                    'text-[16px] text-color-text1',
                    robotoBold.className
                  )}
                >
                  Trusted Validator
                </div>

                <div
                  className={classNames(
                    'text-[14px] text-color-text2 mt-[.14rem] mx-[.12rem] leading-snug'
                  )}
                >
                  Apply to be nominated
                </div>
              </div>

              <div className='self-stretch mb-[.24rem] mt-[24px] mx-[.16rem]'>
                {!isTrust ? (
                  <CustomButton
                    height='42px'
                    type='stroke'
                    disabled={!trustDepositEnabled}
                    onClick={() => {
                      openLink('https://t.me/vouchrun');
                    }}
                  >
                    <div className='text-[15px]'>Apply</div>
                    
                  </CustomButton>
                ) : (
                  <CustomButton
                    height='42px'
                    onClick={() => {
                      router.push('/tokenStake/trustDeposit');
                    }}
                  >
                    
                    <div className='text-[15px]'>Next</div>
                  </CustomButton>
                )}
              </div>
            </div>

            <div className='rounded-[.16rem] bg-color-bgPage flex flex-col items-center justify-between'>
              <div className='mt-[.32rem] flex flex-col items-center mx-[.16rem]'>
                <div
                  className={classNames(
                    'text-[16px] text-color-text1',
                    robotoBold.className
                  )}
                >
                  DVT Validator
                </div>

                <div
                  className={classNames(
                    'text-[14px] text-color-text2 mt-[.14rem] leading-snug text-center mx-[.12rem]'
                  )}
                >
                  Not Yet Available on Pulsechain
                </div>
              </div>

              <div className='self-stretch mb-[.24rem] mt-[24px] mx-[.16rem]'>
                <CustomButton
                  height='42px'
                  type='stroke'
                  onClick={() => {
                    openLink('https://ethereum.org/en/staking/dvt/');
                  }}
                >
                  <div className='text-[15px]'>Instruction</div>
                  
                </CustomButton>
              </div>
            </div>
          </div>
        </CardContainer>

        <div className='w-full lg:pl-[50px] mt-2 lg:mt-0'>
          <ChooseTypeGuide />
        </div>
      </div>
    </div>
  );
};

export default ChooseTypePage;
