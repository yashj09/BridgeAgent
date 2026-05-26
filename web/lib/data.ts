import {
  ADDRESSES,
  DEFAULT_AGENT_ID,
  identityRegistryAbi,
  publicClient,
  tradeJournalAbi,
} from "./contracts";

export type AgentSnapshot = {
  agentId: bigint;
  owner: `0x${string}` | null;
  agentURI: string | null;
  venue: string | null;
};

export type TradeRecord = {
  agentId: bigint;
  tradeHash: `0x${string}`;
  pnlBps: bigint;
  closedAt: bigint;
};

export type AgentStats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  netPnlBps: bigint;
};

export async function fetchAgent(agentId: bigint = DEFAULT_AGENT_ID): Promise<AgentSnapshot> {
  // Reads can fail if the agentId is unminted. Catch each independently
  // so the caller still gets a partial snapshot worth rendering.
  const safeRead = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

  const owner = await safeRead(() =>
    publicClient.readContract({
      address: ADDRESSES.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "ownerOf",
      args: [agentId],
    }),
  );

  const agentURI = await safeRead(() =>
    publicClient.readContract({
      address: ADDRESSES.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "tokenURI",
      args: [agentId],
    }),
  );

  const venueBytes = await safeRead(() =>
    publicClient.readContract({
      address: ADDRESSES.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "getMetadata",
      args: [agentId, "venue"],
    }),
  );

  return {
    agentId,
    owner: (owner as `0x${string}` | null) ?? null,
    agentURI: (agentURI as string | null) ?? null,
    venue: venueBytes ? new TextDecoder().decode(hexToBytes(venueBytes as `0x${string}`)) : null,
  };
}

function hexToBytes(hex: `0x${string}`): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

export async function fetchTrades(
  agentId: bigint = DEFAULT_AGENT_ID,
  limit: bigint = 50n,
): Promise<TradeRecord[]> {
  try {
    const raw = await publicClient.readContract({
      address: ADDRESSES.tradeJournal,
      abi: tradeJournalAbi,
      functionName: "tradesByAgent",
      args: [agentId, 0n, limit],
    });
    // Each row is a struct decoded as an object by viem.
    return (raw as readonly {
      agentId: bigint;
      tradeHash: `0x${string}`;
      pnlBps: bigint;
      closedAt: bigint;
    }[]).map((r) => ({
      agentId: r.agentId,
      tradeHash: r.tradeHash,
      pnlBps: r.pnlBps,
      closedAt: r.closedAt,
    }));
  } catch {
    return [];
  }
}

export function summarize(trades: TradeRecord[]): AgentStats {
  let win = 0;
  let loss = 0;
  let net = 0n;
  for (const t of trades) {
    if (t.pnlBps > 0n) win++;
    else if (t.pnlBps < 0n) loss++;
    net += t.pnlBps;
  }
  return {
    totalTrades: trades.length,
    winningTrades: win,
    losingTrades: loss,
    netPnlBps: net,
  };
}
