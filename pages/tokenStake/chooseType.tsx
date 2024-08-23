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
      <div className='flex mt-[.24rem] items-start'>
        <CardContainer width='6.2rem' title='Choose Validator Type'>
          <div
            className='pb-[.52rem] flex justify-center pt-[.52rem] flex-wrap gap-[.12rem]'
            style={{
              rowGap: '.32rem',
              columnGap: '.12rem',
            }}
          >
            <div className='w-[1.88rem] h-[2.11rem] rounded-[.16rem] bg-color-bgPage flex flex-col items-center justify-between'>
              <div className='mt-[.32rem] flex flex-col items-center'>
                <div
                  className={classNames(
                    'text-[.16rem] text-color-text1',
                    robotoBold.className
                  )}
                >
                  Solo Validator
                </div>

                <div
                  className={classNames(
                    'text-[.14rem] text-color-text2 mt-[.14rem] text-center mx-[.12rem] leading-snug'
                  )}
                >
                  Deposit {getTokenName()} to be delegated
                </div>
              </div>

              <div className='self-stretch mb-[.24rem] mx-[.16rem]'>
                <CustomButton
                  height='.48rem'
                  disabled={soloDisabled}
                  onClick={() => {
                    router.push('/tokenStake/soloDeposit');
                  }}
                >
                  Next
                </CustomButton>
              </div>
            </div>

            <div className='w-[1.88rem] h-[2.11rem] rounded-[.16rem] bg-color-bgPage flex flex-col items-center justify-between'>
              <div className='mt-[.32rem] flex flex-col items-center'>
                <div
                  className={classNames(
                    'text-[.16rem] text-color-text1',
                    robotoBold.className
                  )}
                >
                  Trusted Validator
                </div>

                <div
                  className={classNames(
                    'text-[.14rem] text-color-text2 mt-[.14rem] mx-[.12rem] leading-snug'
                  )}
                >
                  Apply to be nominated
                </div>
              </div>

              <div className='self-stretch mb-[.24rem] mx-[.16rem]'>
                {!isTrust ? (
                  <CustomButton
                    height='.48rem'
                    type='stroke'
                    disabled={!trustDepositEnabled}
                    onClick={() => {
                      openLink('https://forms.gle/RtFK7qo9GzabQTCfA');
                    }}
                  >
                    Apply
                  </CustomButton>
                ) : (
                  <CustomButton
                    height='.48rem'
                    onClick={() => {
                      router.push('/tokenStake/trustDeposit');
                    }}
                  >
                    Next
                  </CustomButton>
                )}
              </div>
            </div>

            <div className='w-[1.88rem] h-[2.11rem] rounded-[.16rem] bg-color-bgPage flex flex-col items-center justify-between'>
              <div className='mt-[.32rem] flex flex-col items-center mx-[.16rem]'>
                <div
                  className={classNames(
                    'text-[.16rem] text-color-text1',
                    robotoBold.className
                  )}
                >
                  DVT Validator
                </div>

                <div
                  className={classNames(
                    'text-[.14rem] text-color-text2 mt-[.14rem] leading-snug text-center mx-[.12rem]'
                  )}
                >
                  Not Yet Available on Pulsechain
                </div>
              </div>

              <div className='self-stretch mb-[.24rem] mx-[.16rem]'>
                <CustomButton
                  height='.48rem'
                  type='stroke'
                  onClick={() => {
                    openLink('https://docs.stafi.io/dvt/#ssv-integration');
                  }}
                >
                  Instruction
                </CustomButton>
              </div>
            </div>
          </div>
        </CardContainer>

        <div className='ml-[.85rem]'>
          <ChooseTypeGuide />
        </div>
      </div>
    </div>
  );
};

export default ChooseTypePage;
