import classNames from 'classnames';
import { FaqItem } from 'components/common/FaqItem';
import { PageTitleContainer } from 'components/common/PageTitleContainer';
import { MyDataAssets } from 'components/myData/MyDataAssets';
import { MyDataHistory } from 'components/myData/MyDataHistory';
import { MyDataPubkeys } from 'components/myData/MyDataPubkeys';
import { MyDataTabs } from 'components/myData/MyDataTabs';
import { robotoBold } from 'config/font';
import Image from 'next/image';
import { useRouter } from 'next/router';
import tokenStakeIcon from 'public/images/token_stake.svg';
import { useMemo, useState } from 'react';
import { getTokenName } from 'utils/configUtils';

const MyDataPage = () => {
  const router = useRouter();

  const selectedTab = useMemo(() => {
    const tabParam = router.query.tab;
    if (tabParam) {
      switch (tabParam) {
        case 'assets':
        case 'pubkeys':
        case 'history':
          return tabParam;
        default:
          return 'assets';
      }
    }
    return 'assets';
  }, [router.query]);

  return (
    <div>
      <PageTitleContainer>
        <div className='h-full flex items-center w-smallContentW xl:w-contentW 2xl:w-largeContentW'>
          <div className='w-[.68rem] h-[.68rem] relative'>
            <Image src={tokenStakeIcon} layout='fill' alt='icon' />
          </div>
          <div
            className={classNames(
              robotoBold.className,
              'text-[.34rem] ml-[.12rem] text-color-text1'
            )}
          >
            My Data
          </div>
        </div>
      </PageTitleContainer>

      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto'>
        <div className='pt-[.24rem] flex items-center justify-between'>
          <div className='flex items-center'>
            <MyDataTabs />
          </div>
        </div>

        {selectedTab === 'assets' && <MyDataAssets />}

        {selectedTab === 'pubkeys' && <MyDataPubkeys />}

        {/* {selectedTab === "history" && <MyDataHistory />} */}

        <div className={classNames('mt-[.56rem] mr-[.16rem] pb-[.56rem]')}>
          <div className='mt-[.16rem] text-[.24rem] text-color-text1'>FAQ</div>

          <div
            className='grid items-start mt-[.16rem]'
            style={{
              gridTemplateColumns: '48% 48%',
              columnGap: '4%',
              rowGap: '.16rem',
            }}
          >
            <FaqItem text='What is the maximum number validators I can run?'>
              <div>
              In short you can run as many as you wish, however;
              </div>
              
              <div className='mt-faqGap'>
              When running validators in Vouch you can deposit and stake multiple
              Validators from the same deposit address (i.e. Connected Account).
              In Vouch we call this the "Node Addr". It is strongly advised to NOT  
              exceed 300 pubkeys per connected account, while this is a soft limit, 
              for security and performance reasons you should use muliple connected
              accounts if you intend on running more than 300 validators.
              </div>

            </FaqItem>

            <FaqItem text='What are the commissions and fees associated with staking PLS?'>
              Staking Reward Commission: 10% of your staking reward. 5% will be
              allocated to the Vouch DAO, 5% will be allocated to validator
              Nodes (Operators).
            </FaqItem>
            
            <FaqItem text='What are the factors that affect the staking rewards?'>
              <div>
                Staking rewards in the Vouch protocol are influenced by various
                factors including the total amount of native tokens staked and
                redeemed, the staking rewards earned, slash occurrences,
                penalties, and the commission ratio. Slashing events, caused by
                disconnection or malicious behavior of validator nodes, could
                potentially reduce rewards; however, Vouch mitigates this risk
                by diversifying the staking funds across multiple validators
                with clean records and requiring them to provide additional
                deposits as collaterals. The staking reward claim status and the
                timing of claims on the original chain can also affect staking
                rewards.
              </div>

              <div className='mt-faqGap'>
                To learn more about how staking rewards are calculated, please
                read:
              </div>

              <a
                className='block mt-faqGap text-color-link'
                href='https://vouch.run/docs/introduction/vPLS_Token.html'
                target='_blank'
                rel='noreferrer'
              >
                https://vouch.run/docs/introduction/vPLS_Token.html
              </a>
            </FaqItem>
            
            <FaqItem text='Bulk Deposit and Staking Limits?'>
              Vouch lets you desposit and stake multiple validator in a single 
              transaction, however you can hit limits doing too many at once. 
              You will need to sign a long transaction and wallets etc impose a
              finite limit on the legnth of such messages. If you work on approx
              40 deposits max in a single message you should be fine. 
            </FaqItem>             
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDataPage;
