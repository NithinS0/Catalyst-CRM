import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Catalyst — Enterprise CRM Solutions",
  description: "Get in touch with our sales, technical support, or partnership teams to integrate autonomous AI agents into your CRM workflows.",
  alternates: {
    canonical: "https://catalystcrm.ai/contact",
  },
  openGraph: {
    title: "Contact Catalyst CRM",
    description: "Contact our sales, technical support, or partnership teams.",
    url: "https://catalystcrm.ai/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Catalyst CRM",
    description: "Get in touch with our sales, technical support, or partnership teams.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
