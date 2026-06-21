'use client';

import { RepoLayout } from '@/components/repo/RepoLayout';
import { useRepo } from '@/components/repo/RepoLayout';
import { DocsGenerator } from '@/components/docs/DocsGenerator';

function DocsContent() {
  const { id } = useRepo();
  return <DocsGenerator repoId={id} />;
}

export default function RepoDocsPage() {
  return (
    <RepoLayout>
      <DocsContent />
    </RepoLayout>
  );
}
