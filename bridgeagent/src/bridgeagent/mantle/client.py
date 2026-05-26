"""Mantle RPC + signer + contract handles.

A `MantleClient` is the foundation every other Mantle helper builds on.
It owns:
  - a Web3 instance pointed at MANTLE_RPC_URL
  - a LocalAccount for signing (from MANTLE_PRIVATE_KEY)
  - lazy contract handles for IdentityRegistry and TradeJournal

The runtime constructs one of these at startup. If any required env var
is missing it logs a warning and `MantleClient.from_config()` returns
None — bridgeagent then runs trading-only, with no on-chain mirror.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional

from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import Web3
from web3.contract import Contract

from bridgeagent import config
from bridgeagent.mantle._abis import IDENTITY_REGISTRY_ABI, TRADE_JOURNAL_ABI

logger = logging.getLogger(__name__)


@dataclass
class MantleClient:
    """Live connection + signer for one Mantle network."""

    w3: Web3
    account: LocalAccount
    chain_id: int
    identity: Contract
    trade_journal: Contract

    @classmethod
    def from_config(cls) -> Optional["MantleClient"]:
        """Build a MantleClient from env-backed config. Returns None and
        logs a clear warning if anything required is missing."""
        missing = []
        if not config.MANTLE_RPC_URL:
            missing.append("MANTLE_RPC_URL")
        if not config.MANTLE_PRIVATE_KEY:
            missing.append("MANTLE_PRIVATE_KEY")
        if not config.MANTLE_IDENTITY_REGISTRY:
            missing.append("MANTLE_IDENTITY_REGISTRY")
        if not config.MANTLE_TRADE_JOURNAL:
            missing.append("MANTLE_TRADE_JOURNAL")

        if missing:
            logger.warning(
                "Mantle on-chain mirror disabled — missing env vars: %s. "
                "Trading still works; on-chain TradeJournal records will be skipped.",
                ", ".join(missing),
            )
            return None

        w3 = Web3(Web3.HTTPProvider(config.MANTLE_RPC_URL))
        if not w3.is_connected():
            logger.error(
                "Mantle RPC unreachable at %s — disabling on-chain mirror.",
                config.MANTLE_RPC_URL,
            )
            return None

        chain_id = w3.eth.chain_id
        if chain_id != config.MANTLE_CHAIN_ID:
            logger.warning(
                "Mantle RPC reports chain_id=%s; expected %s. Continuing, "
                "but txs may target the wrong network.",
                chain_id, config.MANTLE_CHAIN_ID,
            )

        account = Account.from_key(config.MANTLE_PRIVATE_KEY)
        identity = w3.eth.contract(
            address=Web3.to_checksum_address(config.MANTLE_IDENTITY_REGISTRY),
            abi=IDENTITY_REGISTRY_ABI,
        )
        trade_journal = w3.eth.contract(
            address=Web3.to_checksum_address(config.MANTLE_TRADE_JOURNAL),
            abi=TRADE_JOURNAL_ABI,
        )

        logger.info(
            "Mantle client ready (chain=%s, signer=%s, balance=%s MNT)",
            chain_id, account.address,
            w3.from_wei(w3.eth.get_balance(account.address), "ether"),
        )
        return cls(
            w3=w3,
            account=account,
            chain_id=chain_id,
            identity=identity,
            trade_journal=trade_journal,
        )

    @property
    def address(self) -> str:
        return self.account.address

    def get_balance(self) -> float:
        """Native MNT balance of the signer in ether-units."""
        wei = self.w3.eth.get_balance(self.account.address)
        return float(self.w3.from_wei(wei, "ether"))

    def send(self, fn_call) -> str:
        """Sign and broadcast a contract function call. Returns the tx hash hex.

        `fn_call` is a built ContractFunction (e.g. `contract.functions.foo(...)`).
        Caller is responsible for any pre-flight reverts / dry-runs they want.
        """
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        tx = fn_call.build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "chainId": self.chain_id,
        })
        signed = self.account.sign_transaction(tx)
        # web3.py renamed the attr from rawTransaction → raw_transaction in 7.x
        raw = getattr(signed, "raw_transaction", None) or signed.rawTransaction
        tx_hash = self.w3.eth.send_raw_transaction(raw)
        return tx_hash.hex()

    def wait(self, tx_hash: str, timeout: int = 120):
        """Wait for tx receipt. Re-raises on revert.

        After confirmation, polls `eth_blockNumber` until it has caught up
        to (or surpassed) the receipt's blockNumber. Mantle Sepolia's
        public RPC is multi-node and load-balanced, so a follow-on read
        right after a write can hit a node still on a stale block. The
        small wait absorbs that without making the user reason about it.
        """
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
        if receipt.status != 1:
            raise RuntimeError(f"Transaction reverted: {tx_hash}")

        target = receipt.blockNumber
        deadline = time.time() + 15
        while time.time() < deadline:
            if self.w3.eth.block_number >= target:
                break
            time.sleep(0.5)
        return receipt
