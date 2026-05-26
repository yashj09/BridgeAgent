import { AgentCard } from "@/components/AgentCard";
import { TradesTable } from "@/components/TradesTable";
import { DEFAULT_AGENT_ID } from "@/lib/contracts";
import { fetchAgent, fetchTrades, summarize } from "@/lib/data";

export const revalidate = 30; // re-fetch live chain data at most every 30s

type SearchParams = Promise<{ agent?: string }>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const agentId =
    params.agent && /^\d+$/.test(params.agent) ? BigInt(params.agent) : DEFAULT_AGENT_ID;

  const [agent, trades] = await Promise.all([
    fetchAgent(agentId),
    fetchTrades(agentId),
  ]);
  const stats = summarize(trades);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-moss-300">
          BridgeAgent
        </div>
        <h1 className="mt-2 text-4xl font-semibold leading-tight">
          Autonomous perps, anchored on Mantle.
        </h1>
        <p className="mt-3 max-w-xl text-moss-200">
          BridgeAgent is a Byreal-bootstrapped CLI trading agent. Every settled
          trade is mirrored to the on-chain{" "}
          <span className="font-mono text-moss-100">TradeJournal</span>. The
          identity below is an ERC-8004 NFT this agent owns.
        </p>
      </header>

      <AgentCard agent={agent} stats={stats} />
      <TradesTable trades={trades} />

      <footer className="pt-8 text-xs text-moss-400">
        Mantle Turing Test Hackathon 2026 · sponsored by Mantle, Bybit, Byreal
      </footer>
    </main>
  );
}
