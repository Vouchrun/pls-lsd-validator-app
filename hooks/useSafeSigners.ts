import { useEffect, useMemo, useState } from 'react';
import { getSafeMultiContractAbi } from 'config/contractAbi';
import { executeWithRpcFallback } from 'utils/web3Utils';

/**
 * Decide whether the connected wallet is an owner of any node Safe.
 *
 * The /system page is gated on "is this wallet allowed to operate here". The
 * TVA Safes are owned by a fixed set of signer EOAs, which is a different set
 * from the node operators / voters / admin. This asks the Safe directly via
 * `isOwner(account)` and short-circuits on the first match, so the common case
 * (the wallet is a signer on every TVA) costs a single RPC call instead of
 * reading every owner list.
 *
 * Results are cached for a few minutes because ownership changes rarely.
 */

const CACHE_KEY = 'tva_safe_signers_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const OWNER_CHECK_CONCURRENCY = 6;

export interface SafeSignersResult {
  /** Contains the connected account when it owns at least one node Safe. */
  signers: Set<string>;
  loading: boolean;
}

interface SignerCache {
  timestamp: number;
  key: string;
  signer: string;
}

function readCache(): SignerCache | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SignerCache;
  } catch {
    return null;
  }
}

function writeCache(cache: SignerCache): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota / disabled storage
  }
}

export function useSafeSigners(
  addresses: string[],
  account?: string
): SafeSignersResult {
  // Stable key so the effect does not re-run on every render.
  const key = useMemo(
    () =>
      Array.from(
        new Set(
          (addresses || [])
            .filter(Boolean)
            .map((address) => address.toLowerCase())
        )
      )
        .sort()
        .join(','),
    [addresses]
  );

  const accountLower = account ? account.toLowerCase() : undefined;
  const [signers, setSigners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(',') : [];

    if (!accountLower || list.length === 0) {
      setSigners(new Set());
      setLoading(false);
      return;
    }

    const cached = readCache();
    if (
      cached &&
      cached.key === key &&
      cached.signer === accountLower &&
      Date.now() - cached.timestamp < CACHE_TTL_MS
    ) {
      setSigners(new Set([accountLower]));
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      let found = false;
      let next = 0;

      const worker = async () => {
        while (!found && next < list.length) {
          const address = list[next];
          next += 1;
          try {
            const isOwner = await executeWithRpcFallback(async (web3) => {
              const safe = new web3.eth.Contract(
                getSafeMultiContractAbi(),
                address,
                {}
              );
              return safe.methods.isOwner(accountLower).call();
            });
            if (isOwner) {
              found = true;
            }
          } catch {
            // Ignore this Safe; another may still confirm ownership.
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(OWNER_CHECK_CONCURRENCY, list.length) },
          () => worker()
        )
      );

      if (cancelled) {
        return;
      }

      if (found) {
        setSigners(new Set([accountLower]));
        writeCache({ timestamp: Date.now(), key, signer: accountLower });
      } else {
        setSigners(new Set());
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [key, accountLower]);

  return { signers, loading };
}
