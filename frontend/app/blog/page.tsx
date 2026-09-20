'use client';

import React, { useState } from 'react';
import PublicLayout from '@/components/public-layout';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'AI & CRM', 'Product Updates', 'Marketing Automation', 'Customer Engagement', 'Engineering'];

const BLOG_POSTS = [
  {
    id: 1,
    title: 'The Shift to AI-Native CRMs: Beyond Static Customer Profiles',
    description: 'Why modern marketing teams are moving away from passive record systems in favor of autonomous agent workflows that proactively discover revenue opportunities.',
    category: 'AI & CRM',
    author: 'Siddharth Nair',
    date: 'June 18, 2026',
    readTime: '6 min read',
  },
  {
    id: 2,
    title: 'Introducing the Catalyst Opportunity Engine: Proactive Customer Win-backs',
    description: 'A deep dive into how Catalyst analyzes order intervals and behavioral recency to surface high-value dormant customers before they churn.',
    category: 'Product Updates',
    author: 'Neha Deshmukh',
    date: 'June 12, 2026',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'Optimizing Send Times with Multi-Agent Orchestration',
    description: 'How our Channel Selection agent coordinates with LangGraph workflows to evaluate past response rates and choose optimal engagement windows.',
    category: 'Marketing Automation',
    author: 'Varun Grover',
    date: 'June 05, 2026',
    readTime: '8 min read',
  },
  {
    id: 4,
    title: 'Rebuilding Customer Engagement Loops for Modern Commerce',
    description: 'Actionable strategies for consumer and SaaS brands to increase lifetime value (LTV) and reduce subscriber churn using predictive behavioral cohorts.',
    category: 'Customer Engagement',
    author: 'Aishwarya Roy',
    date: 'May 28, 2026',
    readTime: '5 min read',
  },
  {
    id: 5,
    title: 'pgvector RAG vs Traditional Indexing: Memory Architectures in Enterprise CRM',
    description: 'An engineering exploration of how we leverage vector embeddings in Postgres to store brand guidelines and historical campaign performance.',
    category: 'Engineering',
    author: 'Dr. Ramesh Prasad',
    date: 'May 20, 2026',
    readTime: '11 min read',
  },
  {
    id: 6,
    title: 'Real-Time Email Delivery Pipelines: Idempotency & Batching at Scale',
    description: 'The architectural design behind the Catalyst Execution Agent, built to guarantee zero duplicate sends and accurate delivery telemetry.',
    category: 'Engineering',
    author: 'Elena Rostova',
    date: 'May 14, 2026',
    readTime: '7 min read',
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = selectedCategory === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter((p) => p.category === selectedCategory);

  return (
    <PublicLayout>
      <div className="space-y-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DDE2EA] bg-white text-xs font-mono text-[#5F6878]">
            Engineering & Product Insights
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1E222B]">
            Catalyst Publication
          </h1>
          <p className="text-base text-[#5F6878] max-w-2xl mx-auto leading-relaxed">
            Articles, architecture breakdowns, and best practices on AI-native CRM, autonomous marketing agents, and customer intelligence.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-[#DDE2EA] pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2B2B2B] text-white'
                  : 'border border-[#DDE2EA] text-[#5F6878] hover:text-[#1E222B] hover:bg-[#F7F9FC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Post Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.article
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                key={post.id}
                className="catalyst-card p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-[#DDE2EA] bg-white text-[#1E222B]">
                    {post.category}
                  </span>

                  <h3 className="text-base font-bold text-[#1E222B] hover:underline cursor-pointer leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#5F6878] leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DDE2EA] space-y-2 text-[11px] text-[#8B96A5] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><User className="w-3 h-3 text-[#1E222B]" />{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                    <span className="text-[#1E222B] font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                      Read Article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
