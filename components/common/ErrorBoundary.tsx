import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Typography, Box } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's an RPC connection error
    const isRpcError = 
      error.message?.includes('CONNECTION ERROR') ||
      error.message?.includes('connect to node') ||
      error.message?.includes('fetch') ||
      error.message?.includes('CORS') ||
      errorInfo.componentStack?.includes('web3');

    if (isRpcError && typeof window !== 'undefined') {
      console.warn('RPC error detected, automatically resetting to default RPC');
      window.localStorage.removeItem('eth_lsd_custom_rpc');
      
      // Automatically reload the page without showing error UI
      console.log('Reloading page with default RPC...');
      window.location.reload();
      return; // Don't update state, just reload
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    // Clear custom RPC
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('eth_lsd_custom_rpc');
      console.log('Custom RPC cleared, reloading page...');
    }
    
    // Reset state and reload
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: '#1a1a1a',
            color: '#fff',
          }}
        >
          <Box
            sx={{
              maxWidth: '600px',
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: '#2D2D32',
              borderRadius: '12px',
              border: '2px solid #ef4444',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                marginBottom: '1rem',
                fontWeight: 'bold',
                color: '#ef4444',
              }}
            >
              Connection Error
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                marginBottom: '1.5rem',
                color: '#aaa',
              }}
            >
              The application encountered a connection error. This might be due to an invalid custom RPC configuration.
            </Typography>

            <Typography
              variant="body2"
              sx={{
                marginBottom: '2rem',
                color: '#666',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '150px',
                overflow: 'auto',
                padding: '1rem',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                textAlign: 'left',
              }}
            >
              {this.state.error?.message || 'Unknown error'}
            </Typography>

            <Button
              variant="contained"
              onClick={this.handleReset}
              sx={{
                backgroundColor: '#4ade80',
                color: '#000',
                fontWeight: 'bold',
                padding: '12px 32px',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#22c55e',
                },
              }}
            >
              Reset RPC Settings & Reload
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                marginTop: '1rem',
                color: '#666',
                fontSize: '0.75rem',
              }}
            >
              Your custom RPC settings will be cleared and the app will use default RPC endpoints.
            </Typography>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

