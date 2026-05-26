import type { AgentSnapshot, AgentStats } from "@/lib/data";
import { ADDRESSES } from "@/lib/contracts";
import { mantleSepolia } from "@/lib/chain";

function fmtAddress(a: `0x${string}` | null) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function fmtBps(bps: bigint) {
  const pct = Number(bps) / 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function AgentCard({ agent, stats }: { agent: AgentSnapshot; stats: AgentStats }) {
  const explorer = mantleSepolia.blockExplorers.default.url;
  const winRate = stats.totalTrades > 0
    ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) + "%"
    : "—";

  return (
    <div className="rounded-2xl border border-moss-700 bg-moss-900/60 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-moss-300">
            ERC-8004 Agent
          </div>
          <div className="mt-1 text-3xl font-semibold">#{agent.agentId.toString()}</div>
        </div>
        <div className="text-right text-xs text-moss-300">
          <div>Mantle Sepolia · chain 5003</div>
          <a
            href={`${explorer}/address/${ADDRESSES.identityRegistry}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-moss-200 hover:text-moss-50"
          >
            {fmtAddress(ADDRESSES.identityRegistry)}
          </a>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-moss-300">Owner</dt>
          <dd className="mt-1 font-mono text-sm">
            {agent.owner ? (
              <a
                href={`${explorer}/address/${agent.owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-moss-100 hover:text-moss-50"
              >
                {fmtAddress(agent.owner)}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-moss-300">Venue</dt>
          <dd className="mt-1 text-sm">{agent.venue ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-moss-300">Agent URI</dt>
          <dd className="mt-1 truncate font-mono text-xs text-moss-200">
            {agent.agentURI ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-moss-700 pt-4">
        <Stat label="Trades" value={stats.totalTrades.toString()} />
        <Stat label="Win rate" value={winRate} />
        <Stat label="Net PnL" value={fmtBps(stats.netPnlBps)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-moss-300">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
