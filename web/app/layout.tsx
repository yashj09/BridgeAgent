import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BridgeAgent — Live on Mantle",
  description:
    "Byreal-bootstrapped, Mantle-anchored agentic perps trading. Every trade is verifiably on-chain via ERC-8004 + TradeJournal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
