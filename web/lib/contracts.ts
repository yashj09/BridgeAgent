import { createPublicClient, http } from "viem";
import { mantleSepolia } from "./chain";
import { identityRegistryAbi, tradeJournalAbi } from "./abis";

export const ADDRESSES = {
  identityRegistry: (process.env.NEXT_PUBLIC_MANTLE_IDENTITY_REGISTRY ??
    "0x7FDF67698D0A83EB97eA770D9bcA66d3557556c0") as `0x${string}`,
  tradeJournal: (process.env.NEXT_PUBLIC_MANTLE_TRADE_JOURNAL ??
    "0x0E36Df3b90A2B4868Ecd7a5974A16A5c1C5a2110") as `0x${string}`,
} as const;

export const DEFAULT_AGENT_ID = BigInt(
  process.env.NEXT_PUBLIC_MANTLE_AGENT_ID ?? "3",
);

export const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(),
});

export { identityRegistryAbi, tradeJournalAbi };
