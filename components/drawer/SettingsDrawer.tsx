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
import { getAllRpcUrls, getEthereumRpc, validateCustomRpc } from 'config/env';
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
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const allRpcUrls = getAllRpcUrls();
  const defaultFallbackRpc = allRpcUrls[allRpcUrls.length > 1 ? 1 : 0]; // Get first non-custom RPC

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
    console.log('SettingsDrawer - customRpc:', customRpc);
  }, [customRpc]);

  // Get the currently active RPC
  const currentActiveRpc = customRpc || getEthereumRpc();
  
  const handleClearCustomRpc = () => {
    setCustomRpcInput('');
    setValidationError(null);
    dispatch(setCustomRpc(undefined));
    snackbarUtil.success('Custom RPC cleared, using default RPC');
  };

  const handleApplyCustomRpc = async (rpcUrl: string) => {
    const trimmedValue = rpcUrl.trim();
    
    if (!trimmedValue) {
      handleClearCustomRpc();
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmedValue);
    } catch {
      setValidationError('Invalid URL format');
      snackbarUtil.error('Invalid RPC URL format');
      return;
    }

    // Validate RPC connectivity
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const isValid = await validateCustomRpc(trimmedValue);
      
      if (isValid) {
        dispatch(setCustomRpc(trimmedValue));
        setValidationError(null);
        snackbarUtil.success('Custom RPC validated and applied successfully');
      } else {
        setValidationError('Unable to connect to RPC');
        snackbarUtil.error('Failed to connect to custom RPC. Using default RPC.');
        // Don't save invalid RPC
        setTimeout(() => {
          handleClearCustomRpc();
        }, 1000);
      }
    } catch (error: any) {
      console.error('RPC validation error:', error);
      setValidationError('Connection test failed');
      snackbarUtil.error('Custom RPC validation failed. Using default RPC.');
      handleClearCustomRpc();
    } finally {
      setIsValidating(false);
    }
  };

  console.log(
    'SettingsDrawer render - customRpc:',
    customRpc,
    'currentActiveRpc:',
    currentActiveRpc
  );

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
                disabled={isValidating}
                error={!!validationError}
                helperText={validationError}
                onChange={(e) => {
                  setCustomRpcInput(e.target.value);
                  setValidationError(null);
                }}
                onBlur={() => {
                  const trimmedValue = customRpcInput.trim();
                  if (trimmedValue && trimmedValue !== customRpc) {
                    handleApplyCustomRpc(trimmedValue);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmedValue = customRpcInput.trim();
                    handleApplyCustomRpc(trimmedValue);
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      {isValidating ? (
                        <CircularProgress
                          size={20}
                          sx={{ color: darkMode ? '#4ade80' : '#16a34a' }}
                        />
                      ) : (
                        customRpcInput && (
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
                        )
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: validationError
                        ? darkMode
                          ? '#ef4444'
                          : '#dc2626'
                        : darkMode
                        ? '#2D2D32'
                        : '#E8EFFD',
                    },
                    '&:hover fieldset': {
                      borderColor: validationError
                        ? darkMode
                          ? '#ef4444'
                          : '#dc2626'
                        : darkMode
                        ? '#4ade80'
                        : '#16a34a',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: validationError
                        ? darkMode
                          ? '#ef4444'
                          : '#dc2626'
                        : darkMode
                        ? '#4ade80'
                        : '#16a34a',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: darkMode ? '#fff' : '#000',
                    fontSize: '.14rem',
                  },
                  '& .MuiFormHelperText-root': {
                    color: darkMode ? '#ef4444' : '#dc2626',
                    fontSize: '.11rem',
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
                Press Enter or click outside to validate and apply. The RPC will
                be tested before being used. Click × to clear and fallback to{' '}
                {defaultFallbackRpc || 'the default RPC'}.
              </Typography>
              {isValidating && (
                <Typography
                  style={{
                    color: darkMode ? '#4ade80' : '#16a34a',
                    fontSize: '.11rem',
                    marginTop: '.08rem',
                    fontWeight: 600,
                  }}
                >
                  Validating RPC connection...
                </Typography>
              )}
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
