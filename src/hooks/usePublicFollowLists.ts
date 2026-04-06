/**
 * usePublicFollowLists — discover public kind-30000 follow-set lists by keyword.
 *
 * Strategy (maximum coverage, three passes):
 *
 *  Pass A — NIP-50 full-text search (if the relay supports it):
 *    { kinds: [30000], search: keyword, limit: 50 }
 *
 *  Pass B — Structural filters in one query (relays return the union):
 *    Filter 1: { kinds: [30000], '#t': [kw], limit: 100 }
 *    Filter 2: { kinds: [30000], '#d': slugVariants(kw), limit: 100 }
 *
 *  Pass C — Broad sweep with a generous limit, then client-side filter:
 *    { kinds: [30000], limit: 500 }
 *    → keeps events whose title / d-tag / description / t-tags contain the kw
 *
 * All passes run in parallel (Promise.allSettled).  Results are deduped,
 * require at least 1 member, and sorted by member-count descending.
 *
 * A per-pass timeout of 8 s prevents the UI hanging on slow relays.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import type { NostrEvent } from '@nostrify/nostrify';

export interface PublicFollowList {
  event: NostrEvent;
  dTag: string;
  title: string;
  description: string;
  authorPubkey: string;
  pubkeys: string[];
  /** "30000:pubkey:dTag" coordinate */
  naddr: string;
}

function buildNaddr(pubkey: string, dTag: string): string {
  return `30000:${pubkey}:${dTag}`;
}

/** Common d-tag slug patterns for a given keyword */
function slugVariants(kw: string): string[] {
  return [
    kw,
    `${kw}-list`,
    `${kw}s`,
    `${kw}s-list`,
    `list-${kw}`,
    `my-${kw}`,
    `${kw}-people`,
    `${kw}-follows`,
    `follow-${kw}`,
    `the-${kw}`,
    `best-${kw}`,
    `top-${kw}`,
  ];
}

/** Wrap a promise with a timeout; returns [] on timeout/error */
async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function isRelevant(e: NostrEvent, kw: string): boolean {
  const title = (e.tags.find(([t]) => t === 'title')?.[1] ?? '').toLowerCase();
  const dTag  = (e.tags.find(([t]) => t === 'd')?.[1]     ?? '').toLowerCase();
  const desc  = (e.tags.find(([t]) => t === 'description')?.[1] ?? '').toLowerCase();
  const name  = (e.tags.find(([t]) => t === 'name')?.[1]  ?? '').toLowerCase();
  const tTags = e.tags.filter(([t]) => t === 't').map(([, v]) => v.toLowerCase());

  return (
    title.includes(kw) ||
    dTag.includes(kw)  ||
    desc.includes(kw)  ||
    name.includes(kw)  ||
    tTags.some((t) => t === kw || t.includes(kw))
  );
}

function mapToFollowList(e: NostrEvent): PublicFollowList {
  const dTag   = e.tags.find(([t]) => t === 'd')?.[1]           ?? e.id;
  const pubkeys = e.tags.filter(([t]) => t === 'p').map(([, pk]) => pk);
  return {
    event: e,
    dTag,
    title:        e.tags.find(([t]) => t === 'title')?.[1]       ?? dTag,
    description:  e.tags.find(([t]) => t === 'description')?.[1] ?? '',
    authorPubkey: e.pubkey,
    pubkeys,
    naddr: buildNaddr(e.pubkey, dTag),
  };
}

export function usePublicFollowLists(keyword: string | null) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  return useQuery({
    queryKey: ['public-follow-lists', keyword, config.relayMetadata.updatedAt],
    queryFn: async (): Promise<PublicFollowList[]> => {
      if (!keyword?.trim()) return [];

      const kw = keyword.trim().toLowerCase();

      const relayUrls = config.relayMetadata.relays
        .filter((r) => r.read)
        .map((r) => r.url);

      const pool = relayUrls.length > 0 ? nostr.group(relayUrls) : nostr;
      const TIMEOUT = 8_000;

      // ── Pass A: NIP-50 full-text search ────────────────────────────────────
      const passA = withTimeout(
        pool.query([{ kinds: [30000], search: keyword, limit: 50 }]),
        TIMEOUT,
        [] as NostrEvent[],
      ).catch(() => [] as NostrEvent[]);

      // ── Pass B: Structural #t / #d filters ─────────────────────────────────
      const passB = withTimeout(
        pool.query([
          { kinds: [30000], '#t': [kw], limit: 100 },
          { kinds: [30000], '#d': slugVariants(kw), limit: 100 },
        ]),
        TIMEOUT,
        [] as NostrEvent[],
      ).catch(() => [] as NostrEvent[]);

      // ── Pass C: Broad sweep → client-side filter ────────────────────────────
      const passC = withTimeout(
        pool.query([{ kinds: [30000], limit: 500 }]),
        TIMEOUT,
        [] as NostrEvent[],
      )
        .catch(() => [] as NostrEvent[])
        .then((events) => events.filter((e) => isRelevant(e, kw)));

      const [rA, rB, rC] = await Promise.all([passA, passB, passC]);

      // ── Deduplicate across all passes ────────────────────────────────────────
      const seen = new Set<string>();
      const unique: NostrEvent[] = [];
      for (const e of [...rA, ...rB, ...rC]) {
        if (!seen.has(e.id)) {
          seen.add(e.id);
          unique.push(e);
        }
      }

      // ── Map, filter (≥1 member), sort by member count ────────────────────────
      return unique
        .map(mapToFollowList)
        .filter((l) => l.pubkeys.length >= 1)
        .sort((a, b) => b.pubkeys.length - a.pubkeys.length)
        .slice(0, 30);
    },
    enabled: !!keyword?.trim(),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    // Disable retries — a second attempt usually doesn't yield better relay results
    retry: 1,
  });
}
