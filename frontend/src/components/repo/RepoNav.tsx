'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  FileText,
  Network,
  ArrowLeft,
  GitBranch,
  FileCode,
  Layers,
} from 'lucide-react';
import { Repository } from '@/types';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '', label: 'Overview', icon: FileCode },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/docs', label: 'Docs', icon: FileText },
  { href: '/architecture', label: 'Architecture', icon: Network },
];

interface RepoNavProps {
  repo: Repository;
}

export function RepoNav({ repo }: RepoNavProps) {
  const pathname = usePathname();
  const basePath = `/repos/${repo._id}`;

  return (
    <div className="border-b border-surface-border bg-surface-elevated/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-4 py-4">
          <Link
            href="/"
            className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-surface-border/50 hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">
              {repo.owner}/{repo.repo}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {repo.branch}
              </span>
              <span className="flex items-center gap-1">
                <FileCode className="h-3 w-3" />
                {repo.fileCount} files
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {repo.chunkCount} chunks
              </span>
              {repo.language && (
                <span className="rounded bg-brand-500/10 px-2 py-0.5 text-brand-400">
                  {repo.language}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const href = `${basePath}${tab.href}`;
            const isActive =
              tab.href === ''
                ? pathname === basePath
                : pathname.startsWith(href);

            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
