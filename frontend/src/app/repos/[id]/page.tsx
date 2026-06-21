'use client';

import Link from 'next/link';
import {
  MessageSquare,
  FileText,
  Network,
  ExternalLink,
  Calendar,
  GitBranch,
} from 'lucide-react';
import { RepoLayout } from '@/components/repo/RepoLayout';
import { useRepo } from '@/components/repo/RepoLayout';
import { formatDate } from '@/lib/utils';

function OverviewContent() {
  const { repo } = useRepo();
  if (!repo) return null;

  const actions = [
    {
      href: `/repos/${repo._id}/chat`,
      icon: MessageSquare,
      title: 'RAG Chat',
      desc: 'Ask questions about code, architecture, APIs, and get onboarding help',
      color: 'bg-blue-500/10 text-blue-400',
    },
    {
      href: `/repos/${repo._id}/docs`,
      icon: FileText,
      title: 'Documentation',
      desc: 'Generate README, API docs, onboarding guides, and folder structure docs',
      color: 'bg-green-500/10 text-green-400',
    },
    {
      href: `/repos/${repo._id}/architecture`,
      icon: Network,
      title: 'Architecture',
      desc: 'Explore project structure, dependencies, and component relationships',
      color: 'bg-purple-500/10 text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{repo.owner}/{repo.repo}</h2>
            {repo.description && (
              <p className="mt-2 text-[var(--muted)]">{repo.description}</p>
            )}
          </div>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            GitHub
          </a>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-surface p-4">
            <p className="text-xs text-[var(--muted)]">Branch</p>
            <p className="mt-1 flex items-center gap-1 font-medium">
              <GitBranch className="h-4 w-4" />
              {repo.branch}
            </p>
          </div>
          <div className="rounded-lg bg-surface p-4">
            <p className="text-xs text-[var(--muted)]">Files Indexed</p>
            <p className="mt-1 text-xl font-bold">{repo.fileCount}</p>
          </div>
          <div className="rounded-lg bg-surface p-4">
            <p className="text-xs text-[var(--muted)]">Vector Chunks</p>
            <p className="mt-1 text-xl font-bold">{repo.chunkCount}</p>
          </div>
          <div className="rounded-lg bg-surface p-4">
            <p className="text-xs text-[var(--muted)]">Indexed At</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              {repo.indexedAt ? formatDate(repo.indexedAt) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="card group transition-all hover:border-brand-500/30 hover:shadow-md"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-brand-400">{action.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RepoOverviewPage() {
  return (
    <RepoLayout>
      <OverviewContent />
    </RepoLayout>
  );
}
