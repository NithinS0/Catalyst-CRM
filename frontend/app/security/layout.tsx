import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Posture & Compliance — Catalyst Trust Center",
  description: "Learn about Catalyst's design safeguards, logically isolated tenant databases (Row-Level Security), AES-256 encryption, CORS, and subprocessor vetting.",
  alternates: {
    canonical: "https://catalystcrm.ai/security",
  },
  openGraph: {
    title: "Security Posture | Catalyst CRM",
    description: "Enterprise security architecture, logical isolation, and data protection protocols.",
    url: "https://catalystcrm.ai/security",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Posture | Catalyst CRM",
    description: "Enterprise security architecture and logical isolation.",
  },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
