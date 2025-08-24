import classNames from 'classnames';
import { CustomTag } from 'components/common/CustomTag';
import { DataLoading } from 'components/common/DataLoading';
import { PageTitleContainer } from 'components/common/PageTitleContainer';
import { Icomoon } from 'components/icon/Icomoon';
import { PubkeyDetailAsset } from 'components/pubkey/PubkeyDetailAsset';
import { PubkeyDetailSlashHistory } from 'components/pubkey/PubkeyDetailSlashHistory';
import { getValidatorInfoURL } from 'config/env';
import { robotoBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { usePubkeyDetail } from 'hooks/usePubkeyDetail';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getLsdTokenIcon } from 'utils/iconUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { getShortAddress } from 'utils/stringUtils';

const PubkeyDetailPage = () => {
  const { darkMode } = useAppSlice();
  const router = useRouter();

  const pubkeyAddress: string | undefined = useMemo(() => {
    if (
      router.isReady &&
      router.query.pubkeyAddress &&
      typeof router.query.pubkeyAddress === 'string'
    ) {
      return router.query.pubkeyAddress;
    } else {
      return undefined;
    }
  }, [router]);

  const { pubkeyInfo } = usePubkeyDetail(pubkeyAddress);

  return (
    <div>
      <PageTitleContainer
        showBackButton
        onClickBack={() => {
          router.back();
        }}
      >
        <div className='h-full flex items-center justify-between w-smallContentW xl:w-contentW 2xl:w-largeContentW flex-col md:flex-row'>
          <div className='flex items-center w-full'>
            <div className='w-[48px] h-[48px] md:w-[68px] md:h-[68px] relative'>
              <Image src={getLsdTokenIcon()} layout='fill' alt='icon' />
            </div>

            <div>
              <div className='flex items-center'>
                <div
                  className={classNames(
                    robotoBold.className,
                    'text-[20px] md:text-[34px] ml-[12px] text-color-text1'
                  )}
                >
                  Public Key Detail
                </div>

                {pubkeyInfo && (
                  <CustomTag
                    type={
                      pubkeyInfo.displayStatus === 'Exited'
                        ? 'error'
                        : pubkeyInfo.displayStatus === 'Active'
                        ? 'active'
                        : 'pending'
                    }
                    ml='16px'
                  >
                    <div className='text-[12px]'>{pubkeyInfo.displayStatus}</div>
                  </CustomTag>
                )}
              </div>

              {pubkeyAddress && (
                <div className='ml-[12px] mt-[12px] flex items-center justify-center text-[12px] text-color-text2 cursor-pointer'>
                  <div className='flex items-center'>
                    <div className='mr-[.06rem]'>
                      <span className={robotoBold.className}>Address:</span>{' '}
                      <a
                        href={getValidatorInfoURL() + 'validator/' + pubkeyAddress}
                        target='_blank'
                      >
                        {getShortAddress(pubkeyAddress, 20)}
                      </a>
                    </div>
                  </div>

                  <Icomoon
                    icon='copy'
                    size='12px'
                    color={darkMode ? '#ffffff80' : '#6C86AD'}
                    onClick={() => {
                      navigator.clipboard.writeText(pubkeyAddress).then(() => {
                        snackbarUtil.success('Copy success');
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className='flex flex-col items-end w-full mt-2 md:mt-0'>
            <div className='flex items-center'>
              <div
                className={classNames(
                  robotoBold.className,
                  'text-[24px] md:text-[34px] ml-[12px] flex items-center text-color-text1'
                )}
              >
                {pubkeyInfo?.days === undefined ? (
                  <DataLoading height='12px' />
                ) : (
                  pubkeyInfo?.days
                )}

                <div className='ml-[.06rem]'>Days</div>
              </div>
            </div>

            <div className='mt-[12px] flex items-center justify-center text-[12px] text-color-text2 cursor-pointer'>
              <CustomTag type='stroke' ml='16px'>
                <div className='flex items-center text-color-text1'>
                  <div className='mr-[.06rem] text-[12px]'>Epoch</div>
                  {pubkeyInfo?.eligibilityEpoch === undefined ? (
                    <DataLoading height='12px' />
                  ) : (
                    pubkeyInfo?.eligibilityEpoch
                  )}
                </div>
              </CustomTag>

              <div className='ml-[.06rem]'>Eligible for Activation</div>
            </div>
          </div>
        </div>
      </PageTitleContainer>

      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto'>
        <PubkeyDetailAsset
          pubkeyAddress={pubkeyAddress}
          pubkeyInfo={pubkeyInfo}
        />

        <PubkeyDetailSlashHistory />
      </div>
    </div>
  );
};

export default PubkeyDetailPage;
