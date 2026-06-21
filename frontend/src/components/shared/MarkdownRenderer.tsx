'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Citation } from '@/types';
import { FileCode, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface CitationsListProps {
  citations: Citation[];
}

export function CitationsList({ citations }: CitationsListProps) {
  if (!citations?.length) return null;

  return (
    <div className="mt-3 border-t border-surface-border pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
        <FileCode className="h-3.5 w-3.5" />
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <div
            key={i}
            className="group rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs transition-colors hover:border-brand-500/30"
          >
            <div className="flex items-center gap-1.5 font-mono text-brand-400">
              <ExternalLink className="h-3 w-3" />
              {c.filePath}:{c.startLine}-{c.endLine}
            </div>
            <p className="mt-1 line-clamp-2 text-[var(--muted)]">{c.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
