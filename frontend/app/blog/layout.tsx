import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalyst Blog — Insights on AI, Databases, and CRM Engineering",
  description: "Read technical breakdowns, product releases, and strategic guides on autonomous multi-agent CRM pipelines, Postgres pgvector memory, and consumer engagement loops.",
  alternates: {
    canonical: "https://catalystcrm.ai/blog",
  },
  openGraph: {
    title: "Catalyst CRM Blog",
    description: "Insights on AI, pgvector database design, and next-gen customer relationship automation.",
    url: "https://catalystcrm.ai/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catalyst CRM Blog",
    description: "Insights on AI, pgvector database design, and next-gen customer relationship automation.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
