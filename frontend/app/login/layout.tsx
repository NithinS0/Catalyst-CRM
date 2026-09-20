import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Catalyst CRM Portal",
  description: "Log in to access your AI-powered workspace and automation engine.",
  alternates: {
    canonical: "https://catalystcrm.ai/login",
  },
  openGraph: {
    title: "Sign In | Catalyst CRM",
    description: "Access your AI-powered CRM workspace and control dashboard.",
    url: "https://catalystcrm.ai/login",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | Catalyst CRM",
    description: "Access your AI-powered CRM workspace.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
