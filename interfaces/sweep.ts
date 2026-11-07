/**
 * Types for the TVA (Trusted Validator Account) Safe reward sweep.
 *
 * A sweep signs one Safe `execTransaction` per selected Safe (threshold 1 of N)
 * and submits all of them through `MultiSendCallOnly` in a single transaction.
 */

export type SweepItemStatus =
  | 'ok'
  | 'signed'
  | 'not_a_safe'
  | 'zero_balance'
  | 'not_owner'
  | 'threshold_unsupported'
  | 'rpc_error'
  | 'stale'
  | 'simulation_failed';

export interface SweepItem {
  address: string;
  /** Snapshot of the Safe's PLS balance (wei) used in the signed payload. */
  balance: string;
  /** Snapshot of the Safe nonce used in the signed payload. */
  nonce: string;
  owners: string[];
  status: SweepItemStatus;
  reason?: string;
  signature?: string;
}

export interface SweepRunResult {
  items: SweepItem[];
  destination?: string;
  signer?: string;
  dryRun: boolean;
  txHash?: string;
  error?: string;
}

export type SweepPhase =
  | 'idle'
  | 'preflight'
  | 'signing'
  | 'executing'
  | 'done';

export interface SweepProgress {
  phase: SweepPhase;
  signed: number;
  total: number;
  address?: string;
}
