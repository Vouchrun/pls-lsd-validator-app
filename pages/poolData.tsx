import classNames from 'classnames';
import { CustomTag } from 'components/common/CustomTag';
import { DataLoading } from 'components/common/DataLoading';
import { PageTitleContainer } from 'components/common/PageTitleContainer';
import { DelegateElection } from 'components/pool/DelegateElection';
import { PoolAssets } from 'components/pool/PoolAssets';
import { UnstakingPoolStatus } from 'components/pool/UnstakingPoolStatus';
import { ValidatorEjection } from 'components/pool/ValidatorEjection';
import { robotoBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useApr } from 'hooks/useApr';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { getLsdTokenName } from 'utils/configUtils';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { formatNumber } from 'utils/numberUtils';

const PoolDataPage = () => {
  const { darkMode } = useAppSlice();
  const router = useRouter();

  const { apr, yearlyApr } = useApr();

  return (
    <div>
      <PageTitleContainer>
        <div className='h-full flex items-center w-smallContentW xl:w-contentW 2xl:w-largeContentW'>
          <div className='w-[48px] h-[48px] md:w-[68px] md:h-[68px] relative'>
            <Image src={getLsdTokenIcon()} layout='fill' alt='icon' />
          </div>

          <div>
            <div className='ml-[12px] flex items-center'>
              <div
                className={classNames(
                  robotoBold.className,
                  'text-[24px] md:text-[34px] text-color-text1'
                )}
              >
                {getLsdTokenName()} Pool
              </div>

              {apr === 0 ? (
                <CustomTag type='apr' ml='12px'>
                  <span className='ml-[.06rem] text-[12px]'>APR Pending Update</span>
                </CustomTag>
              ) : (
                <div className='ml-[.06rem]'>
                  <CustomTag type='apr'>
                    <div className='px-1'>
                      <span className='font-bold mr-1 text-[12px]'>Staking APR:</span>
                      <span className='mr-1 text-[12px]'>
                        7 Days Avg: {formatNumber(apr, { decimals: 2 })}%
                      </span>
                      <span className='text-[12px]'>
                        1 Year Avg: {formatNumber(yearlyApr, { decimals: 2 })}%
                      </span>
                    </div>
                  </CustomTag>
                </div>
              )}
            </div>

            <div className='ml-[12px] mt-[.12rem] text-[12px] text-color-text2 cursor-pointer'>
              <div className='flex items-center'>
                <div className='mr-[.06rem]'>
                  Take part in vPLS programs, earn tokens easily.
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTitleContainer>

      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto mb-[56px]'>
        <PoolAssets />

        <UnstakingPoolStatus />

        <ValidatorEjection />

        {/* <DelegateElection /> */}
      </div>
    </div>
  );
};

export default PoolDataPage;
