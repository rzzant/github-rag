'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Database, MessageSquare, FileText, Network } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { IndexRepoForm } from '@/components/dashboard/IndexRepoForm';
import { RepoCard } from '@/components/dashboard/RepoCard';
import { api } from '@/lib/api';
import { Repository } from '@/types';

const features = [
  { icon: MessageSquare, title: 'RAG Chat', desc: 'Ask questions about code, architecture, and APIs' },
  { icon: FileText, title: 'Doc Generator', desc: 'Auto-generate README, API docs, and onboarding guides' },
  { icon: Network, title: 'Architecture View', desc: 'Visualize project structure and dependencies' },
  { icon: Database, title: 'Vector Search', desc: 'Semantic search powered by ChromaDB embeddings' },
];

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepos = useCallback(async () => {
    try {
      const data = await api.repositories.list();
      setRepos(data);
    } catch {
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  useEffect(() => {
    const hasProcessing = repos.some((r) => !['ready', 'failed'].includes(r.status));
    if (!hasProcessing) return;

    const interval = setInterval(fetchRepos, 3000);
    return () => clearInterval(interval);
  }, [repos, fetchRepos]);

  const handleIndexed = (repo: Repository) => {
    setRepos((prev) => [repo, ...prev.filter((r) => r._id !== repo._id)]);
  };

  return (
    <PageContainer>
      {/* Hero */}
      <section className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-400">
          <Sparkles className="h-4 w-4" />
          AI-Powered Repository Intelligence
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Understand Any GitHub Repo
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Clone, parse, and index repositories with RAG. Chat with your codebase,
          generate documentation, and visualize architecture — all powered by Gemini.
        </p>
      </section>

      {/* Index Form */}
      <section className="mb-10">
        <IndexRepoForm onIndexed={handleIndexed} />
      </section>

      {/* Features */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
              <f.icon className="h-5 w-5 text-brand-400" />
            </div>
            <h3 className="font-medium">{f.title}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Repository List */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Your Repositories</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card h-48 animate-pulse bg-surface-border/20" />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="card py-12 text-center">
            <Database className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
            <p className="text-[var(--muted)]">No repositories indexed yet. Paste a GitHub URL above to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {repos.map((repo) => (
              <RepoCard key={repo._id} repo={repo} onUpdate={fetchRepos} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
