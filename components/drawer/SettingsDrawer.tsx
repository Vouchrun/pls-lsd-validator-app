import {
  Drawer,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import classNames from 'classnames';
import { IOSSwitch } from 'components/common/CustomSwitch';
import { MenuItem } from 'components/common/MenuItem';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { setDarkMode, setCustomRpc } from 'redux/reducers/AppSlice';
import { RootState } from 'redux/store';
import { openLink } from 'utils/commonUtils';
import { getContactList, getExternalLinkList } from 'utils/configUtils';
import { getAllRpcUrls, getEthereumRpc, testCustomRpc } from 'config/env';
import { useAppKitTheme } from '@reown/appkit/react';
import { useState, useEffect } from 'react';
import { STORAGE_KEY_CUSTOM_RPC } from 'utils/storageUtils';
import snackbarUtil from 'utils/snackbarUtils';

interface Props {
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const SettingsDrawer = (props: Props) => {
  const { open, onChangeOpen } = props;
  const dispatch = useAppDispatch();
  const { setThemeMode } = useAppKitTheme();
  const { darkMode, customRpc } = useAppSelector((state: RootState) => {
    return {
      darkMode: state.app.darkMode,
      customRpc: state.app.customRpc,
    };
  });

  const [customRpcInput, setCustomRpcInput] = useState(customRpc || '');
  const [isTestingRpc, setIsTestingRpc] = useState(false);
  const [rpcTestError, setRpcTestError] = useState<string>('');
  const allRpcUrls = getAllRpcUrls();
  const defaultFallbackRpc = allRpcUrls[0];

  // Hydrate custom RPC from storage when drawer mounts
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedCustomRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
    if (storedCustomRpc && storedCustomRpc !== customRpc) {
      dispatch(setCustomRpc(storedCustomRpc));
    }
  }, [dispatch, customRpc]);

  // Sync input with Redux state when it changes
  useEffect(() => {
    setCustomRpcInput(customRpc || '');
    setRpcTestError('');
    console.log('SettingsDrawer - customRpc:', customRpc);
  }, [customRpc]);

  // Listen for custom RPC being cleared automatically due to failures
  useEffect(() => {
    const handleCustomRpcCleared = (event: CustomEvent) => {
      console.log('Custom RPC was automatically cleared:', event.detail);
      dispatch(setCustomRpc(undefined));
      setCustomRpcInput('');
      setRpcTestError('');
    };

    window.addEventListener(
      'customRpcCleared',
      handleCustomRpcCleared as EventListener
    );

    return () => {
      window.removeEventListener(
        'customRpcCleared',
        handleCustomRpcCleared as EventListener
      );
    };
  }, [dispatch]);

  // Get the currently active RPC
  const currentActiveRpc = customRpc || getEthereumRpc();

  const handleClearCustomRpc = () => {
    setCustomRpcInput('');
    setRpcTestError('');
    dispatch(setCustomRpc(undefined));
  };

  const handleSetCustomRpc = async (value: string) => {
    const trimmedValue = value.trim();

    // If empty, just clear it
    if (!trimmedValue) {
      dispatch(setCustomRpc(undefined));
      setRpcTestError('');
      return;
    }

    // Test the RPC before setting it
    setIsTestingRpc(true);
    setRpcTestError('');

    try {
      const testResult = await testCustomRpc(trimmedValue);

      if (testResult.success) {
        dispatch(setCustomRpc(trimmedValue));
        snackbarUtil.success('Custom RPC set successfully!');
        setRpcTestError('');
      } else {
        // Show error but still allow setting (user might want to try anyway)
        const errorMessage = testResult.error || 'Failed to connect to RPC';
        setRpcTestError(errorMessage);

        if (testResult.errorType === 'cors') {
          snackbarUtil.error(
            'CORS Error: RPC may not work. Will fallback to default if it fails.'
          );
        } else {
          snackbarUtil.error(
            `RPC test failed: ${errorMessage}. Will fallback to default if it fails.`
          );
        }

        // Still set it, but it will be cleared automatically if it fails during actual use
        dispatch(setCustomRpc(trimmedValue));
      }
    } catch (error: any) {
      console.error('Error testing RPC:', error);
      setRpcTestError('Failed to test RPC connection');
      snackbarUtil.error(
        'Could not test RPC. Setting anyway, will fallback if it fails.'
      );
      dispatch(setCustomRpc(trimmedValue));
    } finally {
      setIsTestingRpc(false);
    }
  };

  const getContactIcon = (type: string) => {
    if (darkMode) {
      return `${type.toLowerCase()}-dark`;
    }
    return `${type.toLowerCase()}-dark`;
  };

  return (
    <Drawer
      anchor={'right'}
      open={open}
      onClose={() => onChangeOpen(false)}
      sx={{
        '& .MuiPaper-root': {
          background: darkMode ? '#1a1a1a' : '#f3f3ec',
          width: '450px',
          paddingTop: '1rem',
        },
      }}
    >
      <div className='pb-[1rem] flex-1 flex flex-col justify-between items-stretch pt-2'>
        <div>
          <div className='px-[36px]'>
            <div className='ml-[24px] mt-[12px] flex items-center'>
              <div
                className='text-[16px] mr-[16px]'
                style={{ color: darkMode ? '#fff' : '#1b1b1f' }}
              >
                Dark Mode
              </div>

              <IOSSwitch
                // darkMode={darkMode}
                checked={darkMode}
                onChange={(e) => {
                  dispatch(setDarkMode(e.target.checked));
                  setThemeMode(e.target.checked ? 'dark' : 'light');
                }}
              />
            </div>

            <div className='mt-[32px] h-[0.01rem] bg-color-divider2' />

            <div className='px-[.24rem] mt-[.36rem]'>
              <Typography
                style={{
                  color: darkMode ? '#fff' : '#1b1b1f',
                  fontSize: '.16rem',
                  marginBottom: '.16rem',
                  fontWeight: 600,
                }}
              >
                RPC Settings
              </Typography>

              {/* Current Active RPC */}
              <div
                style={{
                  backgroundColor: darkMode ? '#2D2D32' : '#E8EFFD',
                  padding: '.12rem',
                  borderRadius: '.08rem',
                  marginBottom: '.16rem',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Typography
                      style={{
                        color: darkMode ? '#aaa' : '#666',
                        fontSize: '.12rem',
                        marginBottom: '.04rem',
                      }}
                    >
                      Currently Using:
                    </Typography>
                    <Typography
                      style={{
                        color: darkMode ? '#4ade80' : '#16a34a',
                        fontSize: '.14rem',
                        fontWeight: 600,
                        wordBreak: 'break-all',
                        paddingRight: customRpc ? '.32rem' : '0',
                      }}
                    >
                      {currentActiveRpc}
                    </Typography>
                    {customRpc && (
                      <Typography
                        style={{
                          color: darkMode ? '#fbbf24' : '#d97706',
                          fontSize: '.11rem',
                          marginTop: '.04rem',
                          fontStyle: 'italic',
                        }}
                      >
                        (Custom RPC)
                      </Typography>
                    )}
                  </div>
                  {customRpc && (
                    <IconButton
                      size='small'
                      onClick={handleClearCustomRpc}
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        padding: '.08rem',
                        minWidth: '24px',
                        minHeight: '24px',
                        border: darkMode
                          ? '2px solid #ef4444'
                          : '2px solid #dc2626',
                        borderRadius: '.04rem',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        backgroundColor: darkMode
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(220, 38, 38, 0.2)',
                        '&:hover': {
                          color: darkMode ? '#ef4444' : '#dc2626',
                          backgroundColor: darkMode
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(220, 38, 38, 0.3)',
                          borderColor: darkMode ? '#ef4444' : '#dc2626',
                        },
                      }}
                      title='Clear custom RPC and fallback to available RPC'
                    >
                      ×
                    </IconButton>
                  )}
                </div>
              </div>

              <Typography
                style={{
                  color: darkMode ? '#fff' : '#1b1b1f',
                  fontSize: '.14rem',
                  marginTop: '.16rem',
                  marginBottom: '.08rem',
                }}
              >
                Custom RPC (optional):
              </Typography>
              <TextField
                size='small'
                fullWidth
                placeholder='Enter custom RPC URL (e.g., https://...)'
                value={customRpcInput}
                disabled={isTestingRpc}
                error={!!rpcTestError}
                helperText={rpcTestError}
                onChange={(e) => {
                  setCustomRpcInput(e.target.value);
                  setRpcTestError('');
                }}
                onBlur={() => {
                  const trimmedValue = customRpcInput.trim();
                  if (trimmedValue !== customRpc) {
                    handleSetCustomRpc(trimmedValue);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSetCustomRpc(customRpcInput.trim());
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      {isTestingRpc && (
                        <CircularProgress
                          size={20}
                          sx={{
                            color: darkMode ? '#4ade80' : '#16a34a',
                            marginRight: '.08rem',
                          }}
                        />
                      )}
                      {customRpcInput && !isTestingRpc && (
                        <IconButton
                          size='small'
                          onClick={handleClearCustomRpc}
                          edge='end'
                          sx={{
                            color: darkMode ? '#aaa' : '#666',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            '&:hover': {
                              color: darkMode ? '#ef4444' : '#dc2626',
                            },
                          }}
                        >
                          ×
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: darkMode ? '#2D2D32' : '#E8EFFD',
                    },
                    '&:hover fieldset': {
                      borderColor: darkMode ? '#4ade80' : '#16a34a',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: darkMode ? '#4ade80' : '#16a34a',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: darkMode ? '#fff' : '#000',
                    fontSize: '.14rem',
                  },
                }}
              />
              <Typography
                style={{
                  color: darkMode ? '#aaa' : '#666',
                  fontSize: '.11rem',
                  marginTop: '.08rem',
                  fontStyle: 'italic',
                }}
              >
                Press Enter or click outside to apply and test, If it fail then
                fallback to {defaultFallbackRpc || 'the default RPC'}.
              </Typography>
            </div>

            <div className='mt-[32px] h-[0.01rem] bg-color-divider2' />

            <div className='ml-[24px]'>
              {getExternalLinkList().map(
                (item: { name: string; link: string }) => (
                  <MenuItem
                    key={item.name}
                    mt='36px'
                    text={item.name}
                    link={item.link}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div
          className='pl-[56px] flex items-center'
          style={{ marginTop: '.5rem' }}
        >
          {getContactList().map(
            (item: { type: string; link: string }, index: number) => (
              <div
                key={item.type}
                className={classNames(
                  'cursor-pointer',
                  index > 0 ? 'ml-[.4rem]' : ''
                )}
                onClick={() => {
                  openLink(item.link);
                }}
              >
                <Icomoon
                  icon={getContactIcon(item.type)}
                  size='48px'
                  color={darkMode ? '#FFF' : '#000'}
                />
              </div>
            )
          )}
        </div>
      </div>
    </Drawer>
  );
};
