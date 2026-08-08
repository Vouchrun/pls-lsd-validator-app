/**
 * RPC Initialization Check
 * This module runs early to validate any stored custom RPC before the app fully initializes
 */

import { STORAGE_KEY_CUSTOM_RPC } from './storageUtils';

/**
 * Check if stored custom RPC is valid, remove if not
 * This prevents app crashes on page load due to invalid RPC
 */
export function initializeRpcCheck(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const customRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
    
    if (!customRpc || !customRpc.trim()) {
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(customRpc.trim());
      const validProtocols = ['http:', 'https:', 'ws:', 'wss:'];
      
      if (!validProtocols.includes(url.protocol)) {
        console.warn('[RPC Init Check] Invalid protocol detected, clearing custom RPC:', customRpc);
        window.localStorage.removeItem(STORAGE_KEY_CUSTOM_RPC);
      }
    } catch (error) {
      console.warn('[RPC Init Check] Invalid URL format detected, clearing custom RPC:', customRpc);
      window.localStorage.removeItem(STORAGE_KEY_CUSTOM_RPC);
    }
  } catch (error) {
    console.error('[RPC Init Check] Error during initialization check:', error);
    // If anything fails, clear custom RPC to be safe
    try {
      window.localStorage.removeItem(STORAGE_KEY_CUSTOM_RPC);
    } catch {
      // Silent fail
    }
  }
}

/**
 * Setup global error handlers for RPC-related errors
 */
export function setupRpcErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle unhandled promise rejections related to RPC
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorMessage = error?.message || String(error);
    
    // Check if it's an RPC-related error
    const isRpcError = 
      errorMessage.includes('CONNECTION ERROR') ||
      errorMessage.includes('connect to node') ||
      errorMessage.includes('Invalid JSON RPC') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('CORS');

    if (isRpcError) {
      console.error('[RPC Error Handler] RPC connection error detected:', errorMessage);
      
      // Clear custom RPC automatically
      const customRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
      if (customRpc) {
        console.warn('[RPC Error Handler] Automatically clearing invalid custom RPC:', customRpc);
        window.localStorage.removeItem(STORAGE_KEY_CUSTOM_RPC);
        
        // Automatically reload to use default RPC
        console.log('[RPC Error Handler] Reloading with default RPC...');
        setTimeout(() => {
          window.location.reload();
        }, 100); // Small delay to ensure localStorage is cleared
      }
      
      // Prevent the error from bubbling up and crashing the app
      event.preventDefault();
    }
  });

  // Handle regular errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || '';
    
    const isRpcError = 
      errorMessage.includes('CONNECTION ERROR') ||
      errorMessage.includes('connect to node') ||
      errorMessage.includes('fetch');

    if (isRpcError) {
      console.error('[RPC Error Handler] RPC error in error handler:', errorMessage);
      
      const customRpc = window.localStorage.getItem(STORAGE_KEY_CUSTOM_RPC);
      if (customRpc) {
        console.warn('[RPC Error Handler] Automatically clearing custom RPC due to error:', customRpc);
        window.localStorage.removeItem(STORAGE_KEY_CUSTOM_RPC);
        
        // Automatically reload
        console.log('[RPC Error Handler] Reloading with default RPC...');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      
      // Prevent the error from crashing the app
      event.preventDefault();
    }
  });
}

// Auto-run on module load (client-side only)
if (typeof window !== 'undefined') {
  initializeRpcCheck();
  setupRpcErrorHandlers();
}

