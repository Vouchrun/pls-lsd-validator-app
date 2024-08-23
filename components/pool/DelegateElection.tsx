import classNames from 'classnames';
import { CustomPagination } from 'components/common/CustomPagination';
import { EmptyContent } from 'components/common/EmptyContent';
import { Icomoon } from 'components/icon/Icomoon';
import { robotoBold, robotoSemiBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useState } from 'react';
import { openLink } from 'utils/commonUtils';
import { getDocLinks, getTokenName } from 'utils/configUtils';

export const DelegateElection = () => {
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [page, setPage] = useState(1);

  return (
    <div>
      <div className='mt-[.48rem] flex items-center'>
        <div
          className={classNames(
            robotoBold.className,
            'text-[.24rem] text-color-text1'
          )}
        >
          Delegate Election
        </div>

        <div
          className={classNames(
            'ml-[.16rem] items-center cursor-pointer',
            getDocLinks().delegationMechanism ? 'flex' : 'hidden'
          )}
          onClick={() => {
            openLink(getDocLinks().delegationMechanism);
          }}
        >
          <div className='text-color-text2 text-[.16rem]'>
            StaFi Delegation Mechanism
          </div>

          <div className='ml-[.06rem] flex items-center'>
            <Icomoon
              icon='right'
              size='.1rem'
              color={darkMode ? '#ffffff80' : '#6C86AD'}
            />
          </div>
        </div>
      </div>

      <div className='mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div
          className='h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]'
          style={{
            gridTemplateColumns: '25% 25% 25% 25%',
          }}
        >
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Address
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Chosen Time (UTC)
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            {getTokenName()} Rewarded
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Details
          </div>
        </div>

        <div className='h-[2rem] flex items-center justify-center'>
          <EmptyContent />
        </div>

        {/* <NodeElectionItem index={0} />

        <div className="my-[.32rem] flex items-center justify-center">
          <CustomPagination page={page} onChange={setPage} totalCount={1} />
        </div> */}
      </div>
    </div>
  );
};

interface NodeElectionItemProps {
  index: number;
}

const NodeElectionItem = (props: NodeElectionItemProps) => {
  const { darkMode } = useAppSlice();
  const { index } = props;

  return (
    <div
      className={classNames(
        'h-[.74rem] grid items-center font-[500]',
        index % 2 === 0 ? 'bg-bgPage/50 dark:bg-bgPageDark/50' : ''
      )}
      style={{
        gridTemplateColumns: '25% 25% 25% 25%',
      }}
    >
      <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
        <div
          className='h-[.42rem] w-[1.76rem] px-[.16rem] flex items-center justify-between border-solid border-[1px] border-white dark:border-[#1B1B1F] rounded-[.3rem] bg-color-bgPage'
          onClick={() => {}}
        >
          <div className='text-color-text1 text-[.16rem]'>0x998C…837G</div>

          <div className='ml-[.06rem] rotate-[-90deg]'>
            <Icomoon icon='arrow-down' size='.1rem' color='#848B97' />
          </div>
        </div>
      </div>

      <div className='flex items-center justify-center text-color-text1 text-[.16rem]'>
        <div className={classNames(robotoSemiBold.className)}>
          16 April 23:00
        </div>
      </div>

      <div className='flex items-center justify-center text-color-text1 text-[.16rem] '>
        <div className={classNames(robotoSemiBold.className)}>24.5</div>
      </div>

      <div className='flex items-center justify-center text-color-text1 text-[.16rem]'>
        <div className='flex items-center'>
          <div className={classNames(robotoSemiBold.className, 'mr-[.06rem]')}>
            Active
          </div>

          <Icomoon
            icon='right1'
            size='.1rem'
            color={darkMode ? '#ffffff80' : '#6C86AD'}
          />
        </div>
      </div>
    </div>
  );
};
