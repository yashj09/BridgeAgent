"""Smoke test for the runtime → Mantle mirror path.

Builds a RiskManager wired to the real Mantle TradeJournal contract, feeds
it a synthetic settled trade, and confirms the trade lands on-chain after
flushing. Exercises the new code in core/risk.py and the bridge into
mantle/trade_journal.py without requiring a live HL trade.

Run from project root:
    /path/to/python bridgeagent/scripts/runtime_mirror_smoke.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from dotenv import load_dotenv

contracts_env = Path(__file__).resolve().parents[2] / "contracts" / ".env"
if contracts_env.is_file():
    load_dotenv(contracts_env)
    print(f"loaded env from {contracts_env}")

# Map deployer key → MANTLE_PRIVATE_KEY for config.py
os.environ.setdefault("MANTLE_PRIVATE_KEY", os.environ.get("PRIVATE_KEY", ""))

# Load bridgeagent now that env is set up
from bridgeagent import config
from bridgeagent.core.state import AgentState, Signal, TradeRecord
from bridgeagent.core.risk import RiskManager
from bridgeagent.mantle import MantleClient, TradeJournalClient


def main() -> int:
    mantle = MantleClient.from_config()
    if mantle is None:
        print("FAIL: MantleClient.from_config() returned None — check env vars")
        return 1
    if not config.MANTLE_AGENT_ID:
        print("FAIL: MANTLE_AGENT_ID not set — run mantle_smoke_test.py first")
        return 1

    journal = TradeJournalClient(mantle, agent_id=int(config.MANTLE_AGENT_ID))
    print(f"connected to chain {mantle.chain_id} as {mantle.address}")
    print(f"  mirror agent_id = {config.MANTLE_AGENT_ID}")
    print(f"  trades on-chain so far for this agent: {journal.trade_count_by_agent()}")

    # Build a RiskManager with a mock Hyperliquid client (we never actually
    # close a position — we only exercise the mirror path) and the real
    # journal. The synthetic TradeRecord goes straight through the bridge.
    state = AgentState()
    fake_client = MagicMock(name="HL client (mock — never used in this test)")
    risk = RiskManager(client=fake_client, state=state, trade_journal=journal)

    # Construct a synthetic TradeRecord that mimics what core/risk.py builds
    # at trade-close time. ETH long, +0.75% net.
    sig = Signal(
        coin="ETH", direction="LONG", strategy="momentum",
        score=72.0, confidence="MEDIUM", reason="smoke test",
    )
    now = int(time.time())
    record = TradeRecord(
        coin="ETH", side="long", strategy="momentum",
        entry_price=4000.0, exit_price=4030.0,
        size=0.5, pnl=15.0,           # 30 px * 0.5 size = $15
        signal=sig,
        entry_time=now - 3600,
        exit_time=now,
    )

    # 1) Enqueue
    print("\nenqueueing synthetic TradeRecord via RiskManager._enqueue_mantle_mirror...")
    risk._enqueue_mantle_mirror(record)
    print(f"  queue size after enqueue: {journal.queue_size()}")
    assert journal.queue_size() == 1, "expected 1 queued trade"

    # 2) Flush
    print("\nflushing queue to Mantle Sepolia...")
    pre_count = journal.trade_count_by_agent()
    tx_hashes = journal.flush()
    print(f"  tx hashes: {tx_hashes}")
    assert len(tx_hashes) == 1, f"expected 1 tx, got {len(tx_hashes)}"
    assert journal.queue_size() == 0, "queue should be empty after flush"

    # 3) Confirm new trade on-chain
    post_count = journal.trade_count_by_agent()
    assert post_count == pre_count + 1, (
        f"expected {pre_count + 1} trades on-chain, got {post_count}"
    )
    print(f"  trades on-chain after flush: {post_count}")

    latest = journal.trades_by_agent(post_count - 1, 1)[0]
    print(f"  latest record: {latest}")
    assert latest["pnl_bps"] == 75, (
        f"expected pnl_bps=75 (+0.75%), got {latest['pnl_bps']}"
    )

    print("\nSUCCESS — runtime → Mantle mirror integration verified end-to-end")
    return 0


if __name__ == "__main__":
    sys.exit(main())
