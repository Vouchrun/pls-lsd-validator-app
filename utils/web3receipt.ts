import { executeWithRpcFallback } from './web3Utils';

export interface ReceiptWaitOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_POLL_INTERVAL_MS = 1_500;

/**
 * Wait for a transaction receipt with a bounded timeout.
 *
 * The previous implementation was an unbounded `while (!receipt)` loop that
 * swallowed every error and never switched RPC. A slow or stale provider left
 * the UI hanging forever, which in turn made operators refresh mid-flow and
 * retry a sweep that was still pending. The timeout makes that visible, and
 * each poll goes through the shared RPC fallback.
 */
export const waitForTransactionReceipt = async (
  _web3: any,
  hash: any,
  options: ReceiptWaitOptions = {}
) => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const startedAt = Date.now();
  let lastError: any;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const receipt = await executeWithRpcFallback(async (web3) =>
        web3.eth.getTransactionReceipt(hash)
      );
      if (receipt) {
        return receipt;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    lastError?.message ||
      `Timed out waiting for transaction receipt after ${Math.round(
        timeoutMs / 1000
      )}s`
  );
};
