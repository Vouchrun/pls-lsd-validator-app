import classNames from 'classnames';
import { EmptyContent } from 'components/common/EmptyContent';
import { Icomoon } from 'components/icon/Icomoon';
import { robotoBold, robotoSemiBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useState } from 'react';
import { getTokenName } from 'utils/configUtils';

export const PubkeyDetailSlashHistory = () => {
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [page, setPage] = useState(1);

  return (
    <div>
      <div className='mt-[48px] flex items-center'>
        <div
          className={classNames(
            robotoBold.className,
            'text-[20px] md:text-[24px] text-color-text1'
          )}
        >
          Slash History
        </div>
      </div>
      <div className='overflow-x-auto'>
        <div className='mt-[24px] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] min-w-[700px] overflow-hidden'>
          <div
            className='py-[15px] md:py-[20px] grid items-center font-[500] border-solid border-b-[.01rem] border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
            style={{
              gridTemplateColumns: '25% 22% 22% 31%',
            }}
          >
            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Block
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Time (UTC)
            </div>

            <div className='flex items-center justify-center text-[14px] md:text-[16px] text-color-text2'>
              Slashed {getTokenName()}
            </div>

            <div className='flex items-center text-[14px] md:text-[16px] text-color-text2'>
              <div className='flex-1 ml-[.56rem] mr-[.9rem] flex items-center justify-between'>
                <div>Detials</div>

                {/* <Icomoon
                icon="right"
                color={darkMode ? "#ffffff80" : "#6C86AD"}
                size=".13rem"
              /> */}
              </div>
            </div>
          </div>

          <div className='py-[15px] md:py-[20px] flex items-center justify-center'>
            <EmptyContent />
          </div>

          {/* <SlashHistoryItem index={0} /> */}

          {/* <div className="my-[.32rem] flex items-center justify-center">
          <CustomPagination
            page={page}
            onChange={setPage}
            totalCount={totalCount || 0}
          />
        </div> */}
        </div>
      </div>

    </div>
  );
};

interface SlashHistoryItemProps {
  index: number;
}

const SlashHistoryItem = (props: SlashHistoryItemProps) => {
  const { darkMode } = useAppSlice();
  const { index } = props;

  return (
    <div
      className={classNames(
        'py-[15px] md:py-[20px] grid items-center font-[500]',
        index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
      )}
      style={{
        gridTemplateColumns: '25% 22% 22% 31%',
      }}
    >
      <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
        <div
          className='h-[42px] w-[2.08rem] px-[16px] flex items-center justify-between border-solid border-[1px] border-white dark:border-[#1B1B1F] rounded-[.3rem] bg-color-bgPage'
          onClick={() => { }}
        >
          <div className='text-color-text1 text-[16px]'>
            12901082-15901082
          </div>

          <div className='ml-[.06rem] rotate-[-90deg]'>
            <Icomoon icon='arrow-down' size='10px' color='#848B97' />
          </div>
        </div>
      </div>

      <div className='flex items-center justify-center text-color-text1 text-[14px] md:text-[16px]'>
        <div className={classNames(robotoSemiBold.className)}>
          16 April 23:00
        </div>
      </div>

      <div className='flex items-center justify-center text-color-text1 text-[14px] md:text-[16px] '>
        <div className={classNames(robotoSemiBold.className)}>24.5</div>
      </div>

      <div className='flex items-center justify-center text-color-text1 text-[14px] md:text-[16px]'>
        <div className='flex-1 ml-[.56rem] mr-[.9rem] flex items-center justify-between'>
          <div
            className={classNames('mr-[.04rem] flex-1')}
            style={{
              maxLines: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 1,
              lineClamp: 1,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
            }}
          >
            Didn't set configure fee recipien Didn't set configure fee
            recipient…
          </div>

          <div className='w-[10px] min-w-[10px]'>
            <Icomoon
              icon='right1'
              size='10px'
              color={darkMode ? '#ffffff80' : '#6C86AD'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
