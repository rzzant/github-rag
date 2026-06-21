'use client';

import Link from 'next/link';
import {
  FileCode,
  Layers,
  GitBranch,
  Clock,
  ExternalLink,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Repository } from '@/types';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState } from 'react';

interface RepoCardProps {
  repo: Repository;
  onUpdate: () => void;
}

export function RepoCard({ repo, onUpdate }: RepoCardProps) {
  const [deleting, setDeleting] = useState(false);
  const isProcessing = !['ready', 'failed'].includes(repo.status);

  const handleDelete = async () => {
    if (!confirm(`Delete ${repo.owner}/${repo.repo}?`)) return;
    setDeleting(true);
    try {
      await api.repositories.delete(repo._id);
      onUpdate();
    } finally {
      setDeleting(false);
    }
  };

  const handleReindex = async () => {
    await api.repositories.reindex(repo._id);
    onUpdate();
  };

  return (
    <div className="card group animate-slide-up transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold">
              {repo.owner}/{repo.repo}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                getStatusColor(repo.status)
              )}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              {repo.status}
            </span>
          </div>

          {repo.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{repo.description}</p>
          )}

          {repo.statusMessage && isProcessing && (
            <p className="mt-2 text-xs text-amber-500">{repo.statusMessage}</p>
          )}

          {repo.error && (
            <p className="mt-2 text-xs text-red-500">{repo.error}</p>
          )}
        </div>

        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3.5 w-3.5" />
          {repo.branch}
        </span>
        <span className="flex items-center gap-1">
          <FileCode className="h-3.5 w-3.5" />
          {repo.fileCount} files
        </span>
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {repo.chunkCount} chunks
        </span>
        {repo.language && (
          <span className="rounded bg-surface-border/50 px-1.5 py-0.5">{repo.language}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(repo.updatedAt)}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-surface-border pt-4">
        {repo.status === 'ready' ? (
          <Link href={`/repos/${repo._id}`} className="btn-primary flex-1 text-center">
            Open Assistant
          </Link>
        ) : (
          <button disabled className="btn-primary flex-1 opacity-50">
            {isProcessing ? 'Processing...' : 'Unavailable'}
          </button>
        )}
        <button
          onClick={handleReindex}
          className="btn-secondary p-2.5"
          title="Reindex"
          disabled={isProcessing}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          className="btn-secondary p-2.5 text-red-500 hover:text-red-600"
          title="Delete"
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
