export type RepositoryStatus =
  | 'pending'
  | 'cloning'
  | 'parsing'
  | 'embedding'
  | 'ready'
  | 'failed';

export interface Repository {
  _id: string;
  owner: string;
  repo: string;
  url: string;
  branch: string;
  description?: string;
  status: RepositoryStatus;
  statusMessage?: string;
  fileCount: number;
  chunkCount: number;
  language?: string;
  error?: string;
  indexedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  messageCount?: number;
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocument {
  _id: string;
  repositoryId: string;
  type: 'readme' | 'api_docs' | 'onboarding' | 'folder_structure';
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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

export type ChatMode = 'explain' | 'architecture' | 'function' | 'api' | 'onboarding';

export type DocType = 'readme' | 'api_docs' | 'onboarding' | 'folder_structure';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
