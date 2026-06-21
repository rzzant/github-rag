import { z } from 'zod';

const githubUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return (
          (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') &&
          parsed.pathname.split('/').filter(Boolean).length >= 2
        );
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid GitHub repository URL (e.g. https://github.com/owner/repo)' }
  );

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  url: string;
}

export function parseGitHubUrl(input: string): ParsedGitHubUrl {
  const validated = githubUrlSchema.parse(input.trim());
  const parsed = new URL(validated);
  const parts = parsed.pathname.split('/').filter(Boolean);

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, '');

  let branch: string | undefined;
  if (parts[2] === 'tree' && parts[3]) {
    branch = parts[3];
  }

  return { owner, repo, branch, url: validated };
}

export function getCloneUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}.git`;
}

export function getCollectionName(owner: string, repo: string): string {
  return `repo_${owner}_${repo}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}
