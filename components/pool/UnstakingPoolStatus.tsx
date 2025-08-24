import classNames from 'classnames';
import { DataLoading } from 'components/common/DataLoading';
import { robotoBold, robotoSemiBold } from 'config/font';
import { useUnstakedTokenOfDay } from 'hooks/useUnstakedTokenOfDay';
import { useUnstakingPoolData } from 'hooks/useUnstakingPoolData';
import { useValidatorEjectionData } from 'hooks/useValidatorEjectionData';
import { getLsdTokenName, getTokenName } from 'utils/configUtils';
import { formatNumber } from 'utils/numberUtils';

export const UnstakingPoolStatus = () => {
  const { poolEth, unstakeawableEth, waitingStakers, ejectedValidators } =
    useUnstakingPoolData();

  const { unstakedTokenOfDay } = useUnstakedTokenOfDay();
  const { pendingCount } = useValidatorEjectionData();

  return (
    <div>
      <div className='mt-[48px] flex items-center flex-col md:flex-row'>
        <div
          className={classNames(
            robotoBold.className,
            'text-[20px] md:text-[24px] text-color-text1'
          )}
        >
          Unstaking Pool Status
        </div>

        <div
          className={classNames(
            'md:ml-[16px] text-[16px] text-color-text2 flex items-center mt-[10px] md:mt-0',
          )}
        >
          {unstakedTokenOfDay === undefined ? (
            <DataLoading height='16px' />
          ) : (
            formatNumber(unstakedTokenOfDay, {
              hideDecimalsForZero: true,
            })
          )}
          <div className='ml-[.06rem]'>{getTokenName()} Unstaked today</div>
        </div>
      </div>
      <div className='overflow-x-auto'>
        <div className='mt-[24px] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] min-w-[600px] overflow-hidden'>
          <div
            className='py-[15px] md:py-[20px] grid items-center font-[500] border-solid border-b-[.01rem] border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
            style={{
              gridTemplateColumns: '33% 33% 33%',
            }}
          >
            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Pool {getTokenName()}
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Waiting Stakers
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Ejecting Validators
            </div>
          </div>

          <div
            className={classNames(
              'py-[15px] md:py-[20px] grid items-center font-[500] bg-bgPage/50 dark:bg-bgPageDark/50',
              robotoSemiBold.className
            )}
            style={{
              gridTemplateColumns: '33% 33% 33%',
            }}
          >
            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
              {poolEth === undefined ? (
                <DataLoading height='16px' />
              ) : (
                formatNumber(poolEth, {
                  hideDecimalsForZero: true,
                })
              )}
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
              {waitingStakers === undefined ? (
                <DataLoading height='16px' />
              ) : (
                waitingStakers
              )}
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text1'>
              {pendingCount}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
