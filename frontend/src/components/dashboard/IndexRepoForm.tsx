'use client';

import { useState } from 'react';
import { Github, Loader2, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Repository } from '@/types';

interface IndexRepoFormProps {
  onIndexed: (repo: Repository) => void;
}

export function IndexRepoForm({ onIndexed }: IndexRepoFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const repo = await api.repositories.index(url.trim());
      onIndexed(repo);
      setUrl('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to index repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Index a Repository</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Paste a GitHub URL to clone, parse, and generate embeddings automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Github className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="input pl-10"
            disabled={loading}
            required
          />
        </div>
        <button type="submit" disabled={loading || !url.trim()} className="btn-primary min-w-[140px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              Index Repo
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
