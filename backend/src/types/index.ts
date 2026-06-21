export interface SourceChunk {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
}

export interface ParsedFile {
  filePath: string;
  relativePath: string;
  content: string;
  language: string;
  size: number;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  extension?: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'file' | 'module' | 'package';
  group?: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'import' | 'require' | 'dependency';
}

export interface ArchitectureData {
  tree: TreeNode;
  dependencies: {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
  };
  stats: {
    totalFiles: number;
    totalDirectories: number;
    languages: Record<string, number>;
    topLevelFolders: string[];
  };
}

export interface RAGResponse {
  answer: string;
  citations: Array<{
    filePath: string;
    startLine: number;
    endLine: number;
    snippet: string;
    score: number;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
