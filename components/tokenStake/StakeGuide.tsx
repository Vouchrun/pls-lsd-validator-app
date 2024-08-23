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

export const StakeGuide = () => {
  const { darkMode } = useAppSlice();
  const router = useRouter();

  const { soloNodeDepositAmount } = useSoloNodeDepositAmount();

  return (
    <div className=''>
      <a
        className='text-[.24rem] text-color-text1 inline-flex items-center'
        href='https://lsaas-docs.stafi.io/docs/developethlsd/validator.html'
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
              Deposit{' '}
              <span className={robotoBold.className}>
                {soloNodeDepositAmount} {getTokenName()}
              </span>{' '}
              to register as a delegated validator on StaFi;
              <div className='mt-[.1rem]' />
              StaFi will match{' '}
              <span className={robotoBold.className}>
                {formatNumber(
                  getValidatorTotalDepositAmount() -
                    Number(soloNodeDepositAmount),
                  { fixedDecimals: false }
                )}{' '}
                {getTokenName()}
              </span>{' '}
              to your node so that it can meet the validator conditions of{' '}
              {getTokenName()}
              2.0.
              <div className='mt-[.1rem]' />
            </>
          )}
          If you are a{' '}
          <span className={robotoBold.className}>trusted validator</span>, you
          don't need to deposit {getTokenName()} yourself.
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
              'rounded-full w-[.2rem] h-[.2rem] bg-text1 dark:bg-text1Dark text-white dark:text-text1 text-[.16rem] flex items-center justify-center',
              robotoBold.className
            )}
          >
            2
          </div>

          <div
            className={classNames(
              'ml-[.1rem] text-color-text1 text-[.16rem]',
              robotoBold.className
            )}
          >
            Stake
          </div>
        </div>

        <div
          className='text-color-text2 text-[.14rem] px-[.2rem] py-[.1rem] mt-[.06rem] ml-[.1rem] leading-normal border-dashed border-l-[1px] border-l-text1 dark:border-l-text1Dark'
          style={{}}
        >
          Once your node reaches{' '}
          <span className={robotoBold.className}>
            {formatValidatorDespositAmount} {getTokenName()}
          </span>
          , you can deposit{' '}
          <span className={robotoBold.className}>
            {formatValidatorDespositAmount} {getTokenName()}
          </span>{' '}
          to the deposit contract of{' '}
          <span className={robotoBold.className}>{getTokenName()} 1.0</span>.
          <div className='mt-[.1rem]' />
          After that, please wait for validating progress on{' '}
          <span className={robotoBold.className}>{getTokenName()} 2.0</span>.
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
          There is nothing we can do in this step, once you stake, we should{' '}
          <span className={robotoBold.className}>wait for the queen</span>,
          check the status on the{' '}
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
          .
        </div>
      </div>
    </div>
  );
};
