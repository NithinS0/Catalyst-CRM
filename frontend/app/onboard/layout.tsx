import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Your Free Trial — Catalyst CRM Onboarding",
  description: "Register to set up your AI-native CRM, integrate your database syncs, and orchestrate campaign agents.",
  alternates: {
    canonical: "https://catalystcrm.ai/onboard",
  },
  openGraph: {
    title: "Start Free Trial | Catalyst CRM",
    description: "Get started with Catalyst CRM, register your organization, and build customer workflows.",
    url: "https://catalystcrm.ai/onboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Start Free Trial | Catalyst CRM",
    description: "Get started with Catalyst CRM.",
  },
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
