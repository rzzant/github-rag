'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArchitectureData } from '@/types';
import { FileTree } from './FileTree';
import { getLanguageColor } from '@/lib/utils';
import { FileCode, FolderTree, Package, Link2 } from 'lucide-react';

interface ArchitectureViewProps {
  data: ArchitectureData;
}

const COLORS = ['#5c7cfa', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function ArchitectureView({ data }: ArchitectureViewProps) {
  const languageData = useMemo(
    () =>
      Object.entries(data.stats.languages)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
    [data.stats.languages]
  );

  const internalEdges = data.dependencies.edges.filter((e) => e.type === 'import');
  const externalDeps = data.dependencies.nodes.filter((n) => n.type === 'package');

  const topConnected = useMemo(() => {
    const connectionCount = new Map<string, number>();
    for (const edge of internalEdges) {
      connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
      connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
    }
    return Array.from(connectionCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, count]) => ({
        file: file.split('/').pop() || file,
        fullPath: file,
        connections: count,
      }));
  }, [internalEdges]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <FileCode className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.stats.totalFiles}</p>
            <p className="text-xs text-[var(--muted)]">Source Files</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <FolderTree className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.stats.totalDirectories}</p>
            <p className="text-xs text-[var(--muted)]">Directories</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Link2 className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{internalEdges.length}</p>
            <p className="text-xs text-[var(--muted)]">Internal Imports</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Package className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{externalDeps.length}</p>
            <p className="text-xs text-[var(--muted)]">External Packages</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* File Tree */}
        <FileTree tree={data.tree} />

        {/* Language Distribution */}
        <div className="card">
          <h3 className="mb-4 text-sm font-medium">Language Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={languageData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {languageData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[i % COLORS.length]}
                    className={getLanguageColor(entry.name)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dependency Graph Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-medium">Most Connected Files</h3>
          <div className="space-y-2">
            {topConnected.map((item) => (
              <div
                key={item.fullPath}
                className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
              >
                <span className="truncate font-mono text-xs">{item.fullPath}</span>
                <span className="ml-2 shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs text-brand-400">
                  {item.connections} links
                </span>
              </div>
            ))}
            {topConnected.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No import relationships detected</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-medium">External Dependencies</h3>
          <div className="flex flex-wrap gap-2">
            {externalDeps.slice(0, 30).map((dep) => (
              <span
                key={dep.id}
                className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 font-mono text-xs"
              >
                {dep.label}
              </span>
            ))}
            {externalDeps.length > 30 && (
              <span className="px-3 py-1.5 text-xs text-[var(--muted)]">
                +{externalDeps.length - 30} more
              </span>
            )}
            {externalDeps.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No external dependencies detected</p>
            )}
          </div>
        </div>
      </div>

      {/* Top-level folders */}
      {data.stats.topLevelFolders.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-medium">Top-Level Directories</h3>
          <div className="flex flex-wrap gap-2">
            {data.stats.topLevelFolders.map((folder) => (
              <span
                key={folder}
                className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400"
              >
                {folder}/
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
