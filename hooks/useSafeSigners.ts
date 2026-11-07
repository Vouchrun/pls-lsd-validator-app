import { useEffect, useMemo, useState } from 'react';
import { getSafeMultiContractAbi } from 'config/contractAbi';
import { executeWithRpcFallback } from 'utils/web3Utils';

/**
 * Resolve the owner set of every Safe among the node addresses.
 *
 * The /system page is gated on "is this wallet allowed to operate here". The
 * TVA Safes are owned by a fixed set of signer EOAs, which is a different set
 * from the node operators / voters / admin. Reading `getOwners()` (Safe 1.3.0)
 * lets every signer of any TVA Safe reach the page, instead of only whoever
 * happens to be in the node or voter list.
 *
 * Results are cached for a few minutes because the owner set changes rarely.
 */

const CACHE_KEY = 'tva_safe_owners_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface OwnersCache {
  timestamp: number;
  ownersBySafe: Record<string, string[]>;
}

export interface SafeSignersResult {
  /** Union of every Safe owner found, lowercased. */
  signers: Set<string>;
  ownersBySafe: Record<string, string[]>;
  loading: boolean;
}

function readCache(): OwnersCache | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as OwnersCache;
  } catch {
    return null;
  }
}

function writeCache(cache: OwnersCache): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota / disabled storage
  }
}

export function useSafeSigners(addresses: string[]): SafeSignersResult {
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

  const [ownersBySafe, setOwnersBySafe] = useState<Record<string, string[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(',') : [];

    if (list.length === 0) {
      setLoading(false);
      return;
    }

    const cached = readCache();
    if (
      cached &&
      Date.now() - cached.timestamp < CACHE_TTL_MS &&
      list.every((address) => cached.ownersBySafe[address])
    ) {
      setOwnersBySafe(cached.ownersBySafe);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      const next: Record<string, string[]> = {
        ...(cached?.ownersBySafe || {}),
      };

      try {
        await executeWithRpcFallback(async (web3) => {
          for (const address of list) {
            // getCode failures are transport errors: let the fallback retry.
            const code = await web3.eth.getCode(address);
            if (!code || code === '0x') {
              continue;
            }
            try {
              const safe = new web3.eth.Contract(
                getSafeMultiContractAbi(),
                address,
                {}
              );
              const owners: string[] = await safe.methods.getOwners().call();
              next[address] = owners.map((owner) => owner.toLowerCase());
            } catch {
              // Not a Safe, or no getOwners(): skip it.
            }
          }
        });
      } catch {
        // Keep whatever we resolved; the gate still works for node/voter/admin.
      }

      if (cancelled) {
        return;
      }

      setOwnersBySafe(next);
      writeCache({ timestamp: Date.now(), ownersBySafe: next });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  const signers = useMemo(() => {
    const set = new Set<string>();
    Object.values(ownersBySafe).forEach((owners) => {
      owners.forEach((owner) => set.add(owner.toLowerCase()));
    });
    return set;
  }, [ownersBySafe]);

  return { signers, ownersBySafe, loading };
}
