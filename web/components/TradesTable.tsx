import type { TradeRecord } from "@/lib/data";

function fmtBps(bps: bigint) {
  const pct = Number(bps) / 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function fmtTime(unix: bigint) {
  const d = new Date(Number(unix) * 1000);
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function fmtHash(h: `0x${string}`) {
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

export function TradesTable({ trades }: { trades: TradeRecord[] }) {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-moss-700 bg-moss-900/30 p-12 text-center text-moss-300">
        No trades on-chain yet for this agent.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-moss-700 bg-moss-900/60">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-moss-700 bg-moss-900 text-xs uppercase tracking-widest text-moss-300">
          <tr>
            <th className="px-6 py-3">Closed at</th>
            <th className="px-6 py-3">Trade hash</th>
            <th className="px-6 py-3 text-right">PnL</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {trades.map((t, idx) => (
            <tr
              key={`${t.tradeHash}-${idx}`}
              className="border-b border-moss-800 last:border-0 hover:bg-moss-800/40"
            >
              <td className="px-6 py-3 text-moss-200">{fmtTime(t.closedAt)}</td>
              <td className="px-6 py-3 text-moss-100" title={t.tradeHash}>
                {fmtHash(t.tradeHash)}
              </td>
              <td
                className={`px-6 py-3 text-right ${
                  t.pnlBps > 0n
                    ? "text-emerald-400"
                    : t.pnlBps < 0n
                    ? "text-rose-400"
                    : "text-moss-200"
                }`}
              >
                {fmtBps(t.pnlBps)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
