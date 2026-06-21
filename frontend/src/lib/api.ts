import {
  ApiResponse,
  ArchitectureData,
  ChatMode,
  ChatSession,
  DocType,
  GeneratedDocument,
  Repository,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || 'Request failed', res.status);
  }

  return json.data as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  repositories: {
    list: () => request<Repository[]>('/repositories'),
    get: (id: string) => request<Repository>(`/repositories/${id}`),
    getStatus: (id: string) =>
      request<Pick<Repository, 'status' | 'statusMessage' | 'fileCount' | 'chunkCount' | 'error' | 'indexedAt'>>(
        `/repositories/${id}/status`
      ),
    index: (url: string) =>
      request<Repository>('/repositories', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
    reindex: (id: string) =>
      request<Repository>(`/repositories/${id}/reindex`, { method: 'POST' }),
    delete: (id: string) =>
      request<void>(`/repositories/${id}`, { method: 'DELETE' }),
    getArchitecture: (id: string) =>
      request<ArchitectureData>(`/repositories/${id}/architecture`),
  },

  chat: {
    send: (repoId: string, message: string, mode: ChatMode, sessionId?: string) =>
      request<{ answer: string; citations: Array<{ filePath: string; startLine: number; endLine: number; snippet: string; score: number }>; sessionId: string }>(
        `/repositories/${repoId}/chat`,
        {
          method: 'POST',
          body: JSON.stringify({ message, mode, sessionId }),
        }
      ),
    listSessions: (repoId: string) =>
      request<ChatSession[]>(`/repositories/${repoId}/chat/sessions`),
    getSession: (repoId: string, sessionId: string) =>
      request<ChatSession>(`/repositories/${repoId}/chat/sessions/${sessionId}`),
    deleteSession: (repoId: string, sessionId: string) =>
      request<void>(`/repositories/${repoId}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
  },

  docs: {
    generate: (repoId: string, type: DocType) =>
      request<GeneratedDocument>(`/repositories/${repoId}/docs`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    list: (repoId: string) =>
      request<GeneratedDocument[]>(`/repositories/${repoId}/docs`),
    get: (repoId: string, type: DocType) =>
      request<GeneratedDocument>(`/repositories/${repoId}/docs/${type}`),
  },
};

export { ApiError };
