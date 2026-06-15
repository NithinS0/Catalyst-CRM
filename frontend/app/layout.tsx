import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catalyst — AI-Native Enterprise CRM",
  description:
    "Next-generation enterprise CRM powered by LangGraph agents, pgvector RAG memory, and real-time omnichannel orchestration.",
  keywords: ["CRM", "AI", "LangGraph", "enterprise", "campaign automation"],
  openGraph: {
    title: "Catalyst AI-Native CRM",
    description: "AI-powered CRM with multi-agent orchestration",
    type: "website",
  },
};

import { ToastProvider } from "@/components/ui/toast";
import { CurrencyProvider } from "@/context/currency-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#09090b] text-[#f4f4f5] antialiased`}
      >
        <ToastProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
