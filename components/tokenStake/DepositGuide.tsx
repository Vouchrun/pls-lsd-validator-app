import classNames from 'classnames';
import { Icomoon } from 'components/icon/Icomoon';
import { getValidatorTotalDepositAmount } from 'config/env';
import { robotoBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useSoloNodeDepositAmount } from 'hooks/useSoloNodeDepositAmount';
import { useRouter } from 'next/router';
import { formatValidatorDespositAmount } from 'utils/commonUtils';
import { getTokenName } from 'utils/configUtils';
import { formatNumber } from 'utils/numberUtils';

export const DepositGuide = () => {
  const { darkMode } = useAppSlice();
  const router = useRouter();

  const { soloNodeDepositAmount } = useSoloNodeDepositAmount();

  return (
    <div className=''>
      <a
        className='text-[.24rem] text-color-text1 inline-flex items-center'
        href='https://vouch.run/docs/validator_guide/getting_started.html'
        target='_blank'
        rel='noreferrer'
      >
        <div className='mr-[.16rem]'>Guide</div>

        <Icomoon
          icon='right'
          color={darkMode ? '#ffffff80' : '#6C86AD'}
          size='.11rem'
        />
      </a>

      <div className='mt-[.12rem] rounded-[.16rem] w-[4.3rem] bg-[#6C86AD14] p-[.2rem]'>
        <div className='flex items-center'>
          <div
            className={classNames(
              'rounded-full w-[.2rem] h-[.2rem] bg-text1 dark:bg-text1Dark text-white dark:text-text1 text-[.16rem] flex items-center justify-center',
              robotoBold.className
            )}
          >
            1
          </div>

          <div
            className={classNames(
              'ml-[.1rem] text-color-text1 text-[.16rem]',
              robotoBold.className
            )}
          >
            Deposit
          </div>
        </div>

        <div
          className='text-color-text2 text-[.14rem] px-[.2rem] py-[.1rem] mt-[.06rem] ml-[.1rem] leading-normal border-dashed border-l-[1px] border-l-text1 dark:border-l-text1Dark'
          style={{}}
        >
          {soloNodeDepositAmount && Number(soloNodeDepositAmount) > 0 && (
            <>
              Begin as a Solo validator with StaFi by depositing{' '}
              <span className={robotoBold.className}>
                {formatNumber(soloNodeDepositAmount, { fixedDecimals: false })}{' '}
                {getTokenName()}
              </span>
              . StaFi will contribute an additional{' '}
              <span className={robotoBold.className}>
                {formatNumber(
                  getValidatorTotalDepositAmount() -
                    Number(soloNodeDepositAmount),
                  { fixedDecimals: false }
                )}{' '}
                {getTokenName()}
              </span>
              , ensuring your node fulfills the validator requirements for{' '}
              <span className={robotoBold.className}>{getTokenName()}</span>
              .
              <div className='mt-[.1rem]' />
            </>
          )}
          Note: <span className={robotoBold.className}>Trusted validators</span>{' '}
          do not need to deposit {getTokenName()}.
        </div>

        <div className='ml-[.05rem] mt-[-0.04rem]'>
          <Icomoon
            icon='arrow-down'
            color={darkMode ? '#E8EFFD' : '#1B1B1F'}
            size='.12rem'
          />
        </div>

        <div className='mt-[.06rem] flex items-center'>
          <div
            className={classNames(
              'opacity-50 rounded-full w-[.2rem] h-[.2rem] bg-text2 dark:bg-text2Dark text-white dark:text-text2 text-[.16rem] flex items-center justify-center',
              robotoBold.className
            )}
          >
            2
          </div>

          <div
            className={classNames(
              'ml-[.1rem] text-color-text2 text-[.16rem]',
              robotoBold.className
            )}
          >
            Stake
          </div>
        </div>

        <div
          className='text-color-text2 text-[.14rem] px-[.2rem] py-[.1rem] mt-[.06rem] ml-[.1rem] leading-normal border-dashed border-l-[1px] border-l-text2/30 dark:border-l-text2Dark/30'
          style={{}}
        >
          Once your node balance reaches{' '}
          <span className={robotoBold.className}>
            {formatValidatorDespositAmount} {getTokenName()}
          </span>
          , you may proceed to deploy a pool contract. This action allocates{' '}
          <span className={robotoBold.className}>
            {formatValidatorDespositAmount} {getTokenName()}
          </span>{' '}
          to the <span className={robotoBold.className}>{getTokenName()}</span>{' '}
          deposit contract.
          <div className='mt-[.1rem]' />
          Subsequently, you will need to await the validation progress on{' '}
          <span className={robotoBold.className}>{getTokenName()}</span>.
        </div>

        <div className='ml-[.05rem] mt-[-0.04rem] opacity-30'>
          <Icomoon
            icon='arrow-down'
            color={darkMode ? '#ffffff80' : '#6C86AD'}
            size='.12rem'
          />
        </div>

        <div className='mt-[.06rem] flex items-center'>
          <div
            className={classNames(
              'opacity-50 rounded-full w-[.2rem] h-[.2rem] bg-text2 dark:bg-text2Dark text-white dark:text-text2 text-[.16rem] flex items-center justify-center',
              robotoBold.className
            )}
          >
            3
          </div>

          <div
            className={classNames(
              'ml-[.1rem] text-color-text2 text-[.16rem]',
              robotoBold.className
            )}
          >
            Status
          </div>
        </div>

        <div
          className='text-color-text2 text-[.14rem] px-[.2rem] py-[.1rem] mt-[.06rem] ml-[.1rem] leading-normal'
          style={{}}
        >
          After your stake is in place, our protocol takes over. There's nothing
          more required from you. As a validator, you may monitor the status via
          our user-friendly{' '}
          <span
            className={classNames(
              'underline cursor-pointer',
              robotoBold.className
            )}
            onClick={() => {
              router.push('/myData');
            }}
          >
            dashboard
          </span>
          . Patience is key here, as we await the network's nod of approval.
        </div>
      </div>
    </div>
  );
};
