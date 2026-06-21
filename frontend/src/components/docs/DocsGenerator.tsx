'use client';

import { useState } from 'react';
import { FileText, BookOpen, Map, FolderTree, Loader2, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { DocType, GeneratedDocument } from '@/types';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { cn } from '@/lib/utils';

const DOC_TYPES: { type: DocType; label: string; icon: typeof FileText; desc: string }[] = [
  { type: 'readme', label: 'README', icon: FileText, desc: 'Project overview and setup guide' },
  { type: 'api_docs', label: 'API Docs', icon: BookOpen, desc: 'Endpoint documentation' },
  { type: 'onboarding', label: 'Onboarding', icon: Map, desc: 'Developer onboarding guide' },
  { type: 'folder_structure', label: 'Folder Structure', icon: FolderTree, desc: 'Directory organization' },
];

interface DocsGeneratorProps {
  repoId: string;
}

export function DocsGenerator({ repoId }: DocsGeneratorProps) {
  const [activeDoc, setActiveDoc] = useState<GeneratedDocument | null>(null);
  const [generating, setGenerating] = useState<DocType | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (type: DocType) => {
    setGenerating(type);
    setError('');
    try {
      const doc = await api.docs.generate(repoId, type);
      setActiveDoc(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.type}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Doc type cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--muted)]">Generate Documentation</h3>
        {DOC_TYPES.map((doc) => (
          <button
            key={doc.type}
            onClick={() => handleGenerate(doc.type)}
            disabled={generating !== null}
            className={cn(
              'card w-full text-left transition-all hover:border-brand-500/30 hover:shadow-sm',
              activeDoc?.type === doc.type && 'border-brand-500/50',
              generating === doc.type && 'opacity-70'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
                {generating === doc.type ? (
                  <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
                ) : (
                  <doc.icon className="h-5 w-5 text-brand-400" />
                )}
              </div>
              <div>
                <p className="font-medium">{doc.label}</p>
                <p className="text-xs text-[var(--muted)]">{doc.desc}</p>
              </div>
            </div>
          </button>
        ))}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Preview */}
      <div className="lg:col-span-2">
        {activeDoc ? (
          <div className="card">
            <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-4">
              <h2 className="text-lg font-semibold">{activeDoc.title}</h2>
              <button onClick={handleDownload} className="btn-secondary text-sm">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
              <MarkdownRenderer content={activeDoc.content} />
            </div>
          </div>
        ) : (
          <div className="card flex h-64 items-center justify-center">
            <p className="text-[var(--muted)]">Select a document type to generate</p>
          </div>
        )}
      </div>
    </div>
  );
}
