"""On-chain Mantle integration.

BridgeAgent anchors agent identity (ERC-8004 NFT) and every settled trade
to Mantle Sepolia. Trading itself happens off-chain via Hyperliquid; the
Mantle layer is the verifiable record judges and the web companion read.

Public surface:
    MantleClient        — RPC + signer + contract handles
    IdentityClient      — ERC-8004 register/read helpers
    TradeJournalClient  — append-only trade log with batched flush

All clients are sync (web3.py is sync). The BridgeAgent runtime wraps
calls in asyncio.to_thread() at the call site, mirroring how it handles
the Hyperliquid SDK.
"""

from bridgeagent.mantle.client import MantleClient
from bridgeagent.mantle.identity import IdentityClient
from bridgeagent.mantle.trade_journal import TradeJournalClient

__all__ = ["MantleClient", "IdentityClient", "TradeJournalClient"]
