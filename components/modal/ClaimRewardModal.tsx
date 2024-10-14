import { Box, Modal } from '@mui/material';
import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { DataLoading } from 'components/common/DataLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { roboto, robotoBold, robotoSemiBold } from 'config/font';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { IpfsRewardItem } from 'interfaces/common';
import { useRouter } from 'next/router';
import { claimValidatorRewards } from 'redux/reducers/ValidatorSlice';
import { RootState } from 'redux/store';
import { getTokenName } from 'utils/configUtils';
import { formatNumber } from 'utils/numberUtils';
import { useWriteContract } from 'wagmi';

interface ClaimRewardModalProps {
  visible: boolean;
  onClose: () => void;
  myRewardTokenAmount: string | undefined;
  ipfsMyRewardInfo: IpfsRewardItem | undefined;
  myShareAmount: string | undefined;
  mySharePercentage: string | undefined;
  totalManagedAmount: string | undefined;
}

export const ClaimRewardModal = (props: ClaimRewardModalProps) => {
  const {
    visible,
    onClose,
    myRewardTokenAmount,
    ipfsMyRewardInfo,
    myShareAmount,
    mySharePercentage,
    totalManagedAmount,
  } = props;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { writeContractAsync } = useWriteContract();
  const { darkMode, claimRewardsLoading } = useAppSelector(
    (state: RootState) => {
      return {
        darkMode: state.app.darkMode,
        claimRewardsLoading: state.validator.claimRewardsLoading,
      };
    }
  );

  return (
    <Modal open={visible} onClose={onClose}>
      <Box
        pt='0'
        sx={{
          backgroundColor: darkMode ? '#38475D' : '#ffffff',
          width: '5.8rem',
          borderRadius: '0.16rem',
          outline: 'none',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={classNames(
            'flex-1 flex flex-col items-center',
            darkMode ? 'dark' : '',
            roboto.className
          )}
        >
          <div
            className={classNames(
              'mr-[.24rem] self-end mt-[.24rem] cursor-pointer'
            )}
            onClick={onClose}
          >
            <Icomoon
              icon='close'
              size='.16rem'
              color={darkMode ? '#FFFFFF80' : '#6C86AD80'}
            />
          </div>

          <div
            className={classNames(
              'mx-[.36rem] mt-[-0.2rem] text-[.24rem] text-color-text1 font-[700] text-center leading-normal',
              robotoBold.className
            )}
          >
            Claim Rewards
          </div>

          <div className='mt-[.4rem] self-stretch bg-bgPage/50 dark:bg-bgPageDark/50 flex items-center justify-between h-[.84rem] px-[.32rem]'>
            <div className='text-[.14rem] text-color-text2'>Claimable</div>

            <div
              className={classNames(
                'text-color-link text-[.24rem]',
                robotoBold.className
              )}
            >
              {formatNumber(myRewardTokenAmount, { hideDecimalsForZero: true })}{' '}
              {getTokenName()}
            </div>

            <div className='text-[.14rem] text-color-text2 invisible'>
              Claimable
            </div>
          </div>

          <div className='mt-[.25rem] self-stretch flex items-center justify-between px-[.32rem]'>
            <div className='text-[.14rem] text-color-text2'>
              Total Staked {getTokenName()}
            </div>

            <div
              className={classNames(
                'text-[.14rem] text-color-text2',
                robotoSemiBold.className
              )}
            >
              {totalManagedAmount === undefined ? (
                <DataLoading height='.16rem' />
              ) : (
                formatNumber(totalManagedAmount, { hideDecimalsForZero: true })
              )}
            </div>
          </div>

          <div className='mt-[.25rem] self-stretch items-center justify-between px-[.32rem] hidden'>
            <div className='text-[.14rem] text-color-text2'>Vesting</div>

            <div
              className={classNames(
                'text-[.14rem] text-color-text2',
                robotoSemiBold.className
              )}
            >
              -- D
            </div>
          </div>

          <div className='mt-[.25rem] self-stretch flex items-center justify-between px-[.32rem]'>
            <div className='text-[.14rem] text-color-text2'>My Share</div>

            <div
              className={classNames(
                'text-[.14rem] text-color-text2 flex',
                robotoSemiBold.className
              )}
            >
              <div className='mr-[.06rem]'>
                {myShareAmount === undefined ? (
                  <DataLoading height='.16rem' />
                ) : (
                  formatNumber(myShareAmount, { hideDecimalsForZero: true })
                )}
              </div>
              (
              <div className='mx-[.06rem]'>
                {mySharePercentage === undefined ? (
                  <DataLoading height='.16rem' />
                ) : (
                  formatNumber(Number(mySharePercentage) * 100, {
                    hideDecimalsForZero: true,
                    decimals: 2,
                  })
                )}
              </div>
              %)
            </div>
          </div>

          <div className='self-stretch m-[.24rem]'>
            <CustomButton
              loading={claimRewardsLoading}
              height='.56rem'
              disabled={Number(myRewardTokenAmount) <= 0 || !ipfsMyRewardInfo}
              onClick={() => {
                dispatch(
                  claimValidatorRewards(
                    writeContractAsync,
                    ipfsMyRewardInfo,
                    myRewardTokenAmount || '0',
                    (success) => {
                      if (success) {
                        onClose();
                      }
                    }
                  )
                );
              }}
            >
              Claim
            </CustomButton>
          </div>
        </div>
      </Box>
    </Modal>
  );
};
