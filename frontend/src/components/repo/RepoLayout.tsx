'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Repository } from '@/types';
import { RepoNav } from '@/components/repo/RepoNav';
import { Loader2 } from 'lucide-react';

export function useRepo() {
  const params = useParams();
  const id = params.id as string;
  const [repo, setRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.repositories
      .get(id)
      .then(setRepo)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { repo, loading, error, id };
}

interface RepoLayoutProps {
  children: React.ReactNode;
}

export function RepoLayout({ children }: RepoLayoutProps) {
  const { repo, loading, error } = useRepo();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <p className="text-red-500">{error || 'Repository not found'}</p>
      </div>
    );
  }

  return (
    <>
      <RepoNav repo={repo} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
    </>
  );
}
