'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { TreeNode } from '@/types';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  tree: TreeNode;
}

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.type === 'directory';
  const hasChildren = isDir && node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-surface-border/30',
          !hasChildren && 'cursor-default'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {isDir ? (
          expanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-400" />
          )
        ) : (
          <File className="h-4 w-4 shrink-0 text-blue-400" />
        )}
        <span className="truncate">{node.name}</span>
        {node.extension && (
          <span className="ml-auto text-xs text-[var(--muted)]">{node.extension}</span>
        )}
      </button>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ tree }: FileTreeProps) {
  return (
    <div className="card max-h-[500px] overflow-y-auto p-2">
      <h3 className="mb-3 px-2 text-sm font-medium">Project Structure</h3>
      {tree.children?.map((child) => (
        <TreeNodeComponent key={child.path} node={child} />
      ))}
    </div>
  );
}
