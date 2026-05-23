# BridgeAgent

> Byreal-bootstrapped, Mantle-anchored agentic perps trading CLI.

**Status: WIP — fork in progress for the [Mantle Turing Test 2026 Hackathon](https://dorahacks.io/hackathon/mantleturingtesthackathon2026/detail).**

This project is a fork of [HyperAgent](https://github.com/yashj09/Hyperagent) (PyPI: `hyperliquidagent`), being ported to:

1. Bootstrap its agent wallet through the **Byreal Perps CLI** (a Privy-bridged Hyperliquid frontend), satisfying the hackathon's *Agentic Wallets & Economy* track requirement.
2. Anchor every settled trade and the agent's identity to **Mantle Sepolia** via:
   - An **ERC-8004 IdentityRegistry** (agent identity NFT)
   - A **TradeJournal** contract (append-only on-chain trade log)
3. Run the existing HyperAgent multi-strategy engine + deterministic risk layer + Claude-explained trades — unchanged at runtime.

Full architecture and build plan: see `../docs/hackathon.md` and the project plan file.

## Submission tracks (DoraHacks)

- **Agentic Wallets & Economy** (primary, sponsored by Byreal)
- **AI Trading & Strategy** (secondary)

## Repo layout (in progress)

```
bridgeagent/                    # Python CLI/TUI (this directory)
contracts/                      # Foundry — IdentityRegistry + TradeJournal (D2–D4)
web/                            # Next.js status page on Vercel (D11–D14)
```

A polished README with setup instructions, architecture diagram, deployed contract addresses, and demo video lands in D17–D19. Until then, refer to the plan file.

## License

MIT (inherited from HyperAgent).
