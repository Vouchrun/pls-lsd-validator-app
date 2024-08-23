import { Popover } from '@mui/material';
import classNames from 'classnames';
import { CustomButton } from 'components/common/CustomButton';
import { NoticeDrawer } from 'components/drawer/NoticeDrawer';
import { SettingsDrawer } from 'components/drawer/SettingsDrawer';
import { Icomoon } from 'components/icon/Icomoon';
import {
  getEthereumChainId,
  getEthereumChainName,
  getNetworkName,
} from 'config/env';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useAppSlice } from 'hooks/selector';
import { useWalletAccount } from 'hooks/useWalletAccount';
import {
  bindPopover,
  bindTrigger,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import auditIcon from 'public/images/audit.svg';
import blockSedIcon from 'public/images/audit/block_sec.svg';
import blockSedDarkIcon from 'public/images/audit/block_sec_dark.svg';
import peckShieldIcon from 'public/images/audit/peck_shield.svg';
import peckShieldDarkIcon from 'public/images/audit/peck_shield_dark.svg';
import defaultAvatar from 'public/images/default_avatar.png';
import noticeIcon from 'public/images/notice.png';
import appLogo from 'public/images/appIconDark.svg';
import appLogoLight from 'public/images/appIconLight.svg';
import { useEffect, useMemo, useState } from 'react';
import {
  setNoticeDrawerOpen,
  setSettingsDrawerOpen,
} from 'redux/reducers/AppSlice';
import {
  disconnectWallet,
  setMetaMaskDisconnected,
} from 'redux/reducers/WalletSlice';
import { RootState } from 'redux/store';
import { getLsdTokenName } from 'utils/configUtils';
import { getChainIcon } from 'utils/iconUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { getShortAddress } from 'utils/stringUtils';
import { useConnect } from 'wagmi';

export const Navbar = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { darkMode, unreadNoticeFlag } = useAppSlice();
  const [auditExpand, setAuditExpand] = useState(false);
  const [pageWidth, setPageWidth] = useState(
    document.documentElement.clientWidth
  );
  const { metaMaskAccount } = useWalletAccount();
  const { noticeDrawerOpen, settingsDrawerOpen } = useAppSelector(
    (state: RootState) => {
      return {
        noticeDrawerOpen: state.app.noticeDrawerOpen,
        settingsDrawerOpen: state.app.settingsDrawerOpen,
      };
    }
  );

  const displayAddress = useMemo(() => {
    return metaMaskAccount;
  }, [metaMaskAccount]);

  const isGalleryHomePage = useMemo(() => {
    return router.pathname === '/gallery/[eco]';
  }, [router.pathname]);

  const envPopupState = usePopupState({
    variant: 'popover',
    popupId: 'env',
  });

  const chainPopupState = usePopupState({
    variant: 'popover',
    popupId: 'chain',
  });

  const resizeListener = () => {
    const clientW = document.documentElement.clientWidth;
    setPageWidth(clientW);
  };

  useEffect(() => {
    window.addEventListener('resize', resizeListener);
    resizeListener();

    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  useEffect(() => {
    if (envPopupState.isOpen) {
      dispatch(setNoticeDrawerOpen(false));
      dispatch(setSettingsDrawerOpen(false));
    }
  }, [envPopupState.isOpen, dispatch]);

  return (
    <div className='bg-color-bgPage py-[.36rem] flex items-center justify-center'>
      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto flex items-center justify-between relative'>
        <div
          className={classNames(
            'absolute top-[.11rem] w-[.82rem] h-[.2rem]',
            pageWidth >= 1600 ? 'left-[-1.06rem]' : 'left-0'
          )}
        >
          <Image
            src={darkMode ? appLogo : appLogoLight}
            alt='stafi'
            layout='fill'
          />
        </div>

        <div
          className={classNames(
            'flex items-center',
            pageWidth >= 1600 ? '' : 'pl-[1.06rem]'
          )}
        >
          <div
            className='w-[3.3rem] h-[.42rem] p-[.04rem] grid items-stretch bg-color-bg2 rounded-[.6rem]'
            style={{
              gridTemplateColumns: '40% 28% 32%',
            }}
          >
            <Link href={`/tokenStake/list`}>
              <div
                className={classNames(
                  'h-[.34rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.6rem]',
                  router.pathname.startsWith('/tokenStake')
                    ? 'bg-color-selected font-bold rounded-[.6rem] border-color-divider1 text-text1 border-solid border-[0.01rem]'
                    : 'text-color-text1'
                )}
              >
                Token Stake
              </div>
            </Link>

            <Link href={'/myData'}>
              <div
                className={classNames(
                  'h-[.34rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.6rem] ',
                  router.pathname.startsWith('/myData')
                    ? 'bg-color-selected text-text1 font-bold rounded-[.6rem] border-color-divider1 border-solid border-[0.01rem]'
                    : 'text-color-text1'
                )}
              >
                <span>My Data</span>
              </div>
            </Link>

            <Link href={'/poolData'}>
              <div
                className={classNames(
                  'h-[.34rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.6rem]',
                  router.pathname.startsWith('/poolData')
                    ? 'bg-color-selected text-text1 font-bold rounded-[.6rem] border-color-divider1 border-solid border-[0.01rem]'
                    : 'text-color-text1'
                )}
              >
                {getLsdTokenName()} Pool
              </div>
            </Link>
          </div>

          {/* <AuditComponent
            expand={auditExpand}
            onExpandChange={setAuditExpand}
          /> */}
        </div>

        <div className={classNames('flex items-center')}>
          <div
            className={classNames(
              'ml-[.16rem]',
              isGalleryHomePage ? 'hidden' : ''
            )}
          >
            {displayAddress ? (
              <UserInfo auditExpand={auditExpand} />
            ) : (
              <ConnectButton />
            )}
          </div>

          <div
            className={classNames(
              'cursor-pointer ml-[.3rem] w-[.42rem] h-[.42rem] flex items-center justify-center rounded-[.12rem] relative',
              noticeDrawerOpen ? 'bg-color-selected' : ''
            )}
            onClick={() => {
              dispatch(setSettingsDrawerOpen(false));
              dispatch(setNoticeDrawerOpen(!noticeDrawerOpen));
            }}
          >
            <div className='h-[.25rem] w-[.22rem] relative'>
              <Image src={noticeIcon} layout='fill' alt='notice' />
            </div>

            {unreadNoticeFlag && (
              <div className='bg-error rounded-full w-[.06rem] h-[.06rem] absolute right-[0.08rem] top-[0.08rem]'></div>
            )}
          </div>

          <div
            className={classNames(
              'cursor-pointer ml-[.3rem] w-[.42rem] h-[.42rem] flex items-center justify-center rounded-[.12rem]',
              settingsDrawerOpen ? 'bg-color-selected' : ''
            )}
            onClick={() => {
              dispatch(setNoticeDrawerOpen(false));
              dispatch(setSettingsDrawerOpen(!settingsDrawerOpen));
            }}
          >
            <Icomoon icon='more' size='.2rem' color='#6C86AD' />
          </div>
        </div>

        <SettingsDrawer
          open={settingsDrawerOpen}
          onChangeOpen={(open) => {
            dispatch(setSettingsDrawerOpen(open));
          }}
        />

        <NoticeDrawer
          open={noticeDrawerOpen}
          onChangeOpen={(open) => {
            dispatch(setNoticeDrawerOpen(open));
          }}
        />
      </div>
    </div>
  );
};

const UserInfo = (props: { auditExpand: boolean }) => {
  const { auditExpand } = props;
  const dispatch = useAppDispatch();
  const { metaMaskAccount } = useWalletAccount();
  const { darkMode } = useAppSelector((state: RootState) => {
    return {
      darkMode: state.app.darkMode,
    };
  });

  const [hideNet, hideAddress] = useMemo(() => {
    if (!auditExpand) {
      return [false, false];
    }
    let html = document.documentElement;
    let clientW = html.clientWidth;
    let hideNet = false;
    let hideAddress = true;
    if (Number(clientW) <= 1280) {
      hideNet = true;
    }

    return [hideNet, hideAddress];
  }, [auditExpand]);

  const addressPopupState = usePopupState({
    variant: 'popover',
    popupId: 'address',
  });

  const netPopupState = usePopupState({
    variant: 'popover',
    popupId: 'net',
  });

  // useEffect(() => {
  //   if (appEnv === AppEnv.Polkadot) {
  //     dispatch(setAppNet(NetName.Polkadot_StaFi));
  //   } else if (appEnv === AppEnv.Ethereum) {
  //     dispatch(setAppNet(NetName.Evm_ERC20));
  //   } else {
  //     dispatch(setAppNet(undefined));
  //   }
  // }, [appEnv, dispatch]);

  return (
    <div className='h-[.42rem] bg-color-bg2 rounded-[.6rem] flex items-stretch'>
      <div
        className={classNames(
          'items-center pl-[.04rem] pr-[.12rem] rounded-l-[.6rem]',
          netPopupState.isOpen ? 'bg-color-selected' : '',
          'cursor-default',
          auditExpand ? 'hidden 2xl:flex' : 'flex'
        )}
      >
        <div className='w-[.34rem] h-[.34rem] relative'>
          <Image
            src={getChainIcon()}
            alt='logo'
            className='rounded-full  overflow-hidden'
            layout='fill'
          />
        </div>

        <div
          className={classNames(
            'ml-[.08rem] text-[.16rem]',
            netPopupState.isOpen ? 'text-text1 ' : 'text-color-text1'
          )}
        >
          {getEthereumChainName()}
        </div>

        {/* <div className="ml-[.12rem]">
          <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
        </div> */}
      </div>

      <div
        className={classNames(
          'self-center h-[.22rem] w-[.01rem] bg-[#DEE6F7] dark:bg-[#6C86AD80]',
          auditExpand ? 'hidden 2xl:flex' : 'flex'
        )}
      />

      <div
        className={classNames(
          'cursor-pointer pr-[.04rem] flex items-center rounded-r-[.6rem]',
          addressPopupState.isOpen ? 'bg-color-selected' : '',
          auditExpand
            ? 'rounded-[.6rem] pl-[.04rem] 2xl:rounded-r-[.6rem] 2xl:pl-[.12rem]'
            : 'rounded-r-[.6rem]  pl-[.12rem]'
        )}
        {...bindTrigger(addressPopupState)}
      >
        <Image
          src={defaultAvatar}
          alt='logo'
          className='w-[.34rem] h-[.34rem] rounded-full'
        />

        {!hideAddress && (
          <div
            className={classNames(
              'mx-[.12rem] text-[.16rem]',
              addressPopupState.isOpen ? 'text-text1 ' : 'text-color-text1'
            )}
          >
            {getShortAddress(metaMaskAccount, 5)}
          </div>
        )}
      </div>

      {/* Address Menu */}
      <Popover
        {...bindPopover(addressPopupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        elevation={0}
        sx={{
          marginTop: '.15rem',
          '& .MuiPopover-paper': {
            background: darkMode ? '#6C86AD4D' : '#ffffff80',
            border: darkMode
              ? '0.01rem solid #6C86AD80'
              : '0.01rem solid #FFFFFF',
            backdropFilter: 'blur(.4rem)',
            borderRadius: '.3rem',
          },
          '& .MuiTypography-root': {
            padding: '0px',
          },
          '& .MuiBox-root': {
            padding: '0px',
          },
        }}
      >
        <div
          className={classNames('p-[.16rem] w-[2rem]', darkMode ? 'dark' : '')}
        >
          <div
            className='cursor-pointer flex items-center justify-between'
            onClick={() => {
              navigator.clipboard.writeText(metaMaskAccount || '').then(() => {
                addressPopupState.close();
                snackbarUtil.success('Copy success');
              });
            }}
          >
            <div className='flex items-center'>
              <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
                Copy Address
              </div>
            </div>
          </div>

          <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

          <div
            className='cursor-pointer flex items-center justify-between'
            onClick={() => {
              addressPopupState.close();
              dispatch(disconnectWallet());
            }}
          >
            <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
              Disconnect
            </div>
          </div>
        </div>
      </Popover>
    </div>
  );
};

const ConnectButton = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const { connectAsync, connectors } = useConnect();

  const clickConnectWallet = async () => {
    dispatch(setNoticeDrawerOpen(false));
    dispatch(setSettingsDrawerOpen(false));

    const metamaskConnector = connectors.find(
      (c) => c.name === 'MetaMask' || c.name === 'Rabby Wallet'
    );
    if (!metamaskConnector) {
      return;
    }
    try {
      dispatch(setMetaMaskDisconnected(false));
      await connectAsync({
        chainId: getEthereumChainId(),
        connector: metamaskConnector,
      });
      dispatch(setMetaMaskDisconnected(false));
    } catch (err: any) {
      if (err.code === 4001) {
      } else {
        console.error(err);
      }
    }
  };

  return (
    <CustomButton
      type='small'
      height='.42rem'
      onClick={() => {
        clickConnectWallet();
      }}
      // textColor={darkMode ? "#E8EFFD" : ""}
    >
      Connect Wallet
    </CustomButton>
  );
};

interface AuditComponentProps {
  expand: boolean;
  onExpandChange: (expand: boolean) => void;
}

const AuditComponent = (props: AuditComponentProps) => {
  const { expand, onExpandChange } = props;
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();

  useEffect(() => {
    if (metaMaskAccount) {
      onExpandChange(false);
    }
  }, [metaMaskAccount, onExpandChange]);

  return (
    <div
      className={classNames(
        'mx-[.16rem] h-[.42rem] rounded-[.3rem] border-[#6C86AD]/20 flex items-center',
        expand ? 'border-[0.01rem]' : ''
      )}
    >
      <div
        className='cursor-pointer ml-[.04rem] w-[.34rem] h-[.34rem] p-[.06rem] relative rounded-full bg-color-bg1'
        onClick={() => {
          onExpandChange(!expand);
        }}
      >
        <div className='w-full h-full relative'>
          <Image src={auditIcon} alt='audit' layout='fill' />
        </div>
      </div>

      <div
        className={classNames(
          'items-center origin-left',
          expand ? 'animate-expand flex' : 'animate-collapse hidden'
        )}
      >
        <div
          className='text-color-text2 ml-[.06rem] text-[.14rem] w-[.8rem] min-w-[.8rem] break-normal'
          style={
            {
              // maxLines: 1,
              // overflow: "hidden",
              // textOverflow: "ellipsis",
              // WebkitLineClamp: 1,
              // lineClamp: 1,
              // display: "-webkit-box",
              // WebkitBoxOrient: "vertical",
            }
          }
        >
          Audited By
        </div>

        <div className='ml-[.1rem] w-[.8rem] h-[.17rem] relative'>
          <Image
            src={darkMode ? peckShieldDarkIcon : peckShieldIcon}
            alt='audit'
            layout='fill'
          />
        </div>

        <div className='ml-[.1rem] w-[.8rem] h-[.17rem] relative'>
          <Image
            src={darkMode ? blockSedDarkIcon : blockSedIcon}
            alt='audit'
            layout='fill'
          />
        </div>

        <div className='ml-[.1rem] w-[.52rem] h-[.17rem] relative flex items-center'>
          <Icomoon
            icon='zellic'
            color={darkMode ? '#E8EFFD' : '#1B1B1F'}
            size='.52rem'
          />
        </div>

        <div
          className='mx-[.12rem] cursor-pointer'
          onClick={() => {
            onExpandChange(false);
          }}
        >
          <Icomoon icon='collapse' size='.12rem' />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
