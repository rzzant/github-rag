'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { RepoLayout } from '@/components/repo/RepoLayout';
import { useRepo } from '@/components/repo/RepoLayout';
import { ArchitectureView } from '@/components/architecture/ArchitectureView';
import { api } from '@/lib/api';
import { ArchitectureData } from '@/types';

function ArchitectureContent() {
  const { id } = useRepo();
  const [data, setData] = useState<ArchitectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.repositories
      .getArchitecture(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card py-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return <ArchitectureView data={data} />;
}

export default function RepoArchitecturePage() {
  return (
    <RepoLayout>
      <ArchitectureContent />
    </RepoLayout>
  );
}
