import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsroom & Brand Assets — Catalyst CRM Media Desk",
  description: "Read the latest press releases, corporate announcements, fact sheets, and download the official brand and vector graphic assets for Catalyst CRM.",
  alternates: {
    canonical: "https://catalystcrm.ai/press",
  },
  openGraph: {
    title: "Newsroom & Brand Assets | Catalyst CRM",
    description: "Catalyst CRM media desk, news, and official brand assets.",
    url: "https://catalystcrm.ai/press",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Newsroom & Brand Assets | Catalyst CRM",
    description: "Catalyst CRM press releases and official brand assets.",
  },
};

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
