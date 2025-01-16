import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { FaqItem } from 'components/common/FaqItem';
import { TokenStakeList } from 'components/tokenStake/TokenStakeList';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Switch } from '@mui/material';
import { useEffect, useState } from 'react';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  maxWidth: '600px',
  width: 'calc(100% - 20px)',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '1px solid #6C86AD80',
  boxShadow: 20,
  p: 4,
  background: '#455168',
  borderRadius: '0.3rem',
  outline: 'none',
};

const TokenStakeListPage = () => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const handleClose = (event: any, reason: string) => {
    if (reason === 'backdropClick') {
      return; // Ignore backdrop clicks
    }
    setOpen(false);
  };

  const onConfirm = async () => {
    if (show) {
      window.localStorage.setItem('show', 'false');
    }
    setOpen(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      setOpen(window.localStorage.getItem('show') === 'false' ? false : true);
    }
  }, []);

  return (
    <div>
      {/* <PageTitleContainer>
        <div className="h-full flex items-center w-smallContentW xl:w-contentW 2xl:w-largeContentW">
          <div className="w-[.68rem] h-[.68rem] relative">
            <Image src={tokenStakeIcon} layout="fill" alt="icon" />
          </div>
          <div
            className={classNames(
              robotoBold.className,
              "text-[.34rem] ml-[.12rem] text-color-text1"
            )}
          >
            Token Stake
          </div>
        </div>
      </PageTitleContainer> */}

      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto'>
        <TokenStakeList />

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
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={style}>
          <h4 className='d-title'>Disclaimer</h4>
          <br />
          <p id='modal-modal-description' className='d-subtitle'>
            I acknowledge that all transactions executed through connected smart
            contracts are irreversible and conducted solely on the applicable
            blockchain networks. I understand that using smart contracts carries
            risks, including errors, hacks, and unforeseen consequences, which
            may result in loss of funds.
          </p>
          <br />
          <p id='modal-modal-description' className='d-subtitle'>
            I understand the risks associated with entering into using Vouch
            protocol and agree with full{' '}
            <a
              href='https://vouch.run/docs/terms/terms.html'
              target='_blank'
              style={{ textDecoration: 'underline' }}
            >
              Terms of Use
            </a>{' '}
            by clicking the "Accept" button below
          </p>
          <br />
          <div className='flex items-center gap-[8px]'>
            <label className='sc-1ecf058b-1 ggnPRR'>
              {' '}
              <Switch
                checked={show}
                onChange={() => setShow(!show)}
                name='loading'
                color='warning'
              />
              <span className='sc-1ecf058b-0 dioEsS'></span>
            </label>
            <div style={{ color: 'white' }}>Do not show again</div>
          </div>
          <CustomButton
            mt='.18rem'
            className='mx-[.24rem]'
            height='.56rem'
            type='primary'
            onClick={() => onConfirm()}
            border='none'
          >
            <div className='flex items-center'>Accept</div>
          </CustomButton>
        </Box>
      </Modal>
    </div>
  );
};

export default TokenStakeListPage;
