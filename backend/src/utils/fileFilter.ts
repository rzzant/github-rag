import path from 'path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  'vendor',
  '.idea',
  '.vscode',
  '.turbo',
  '.nuxt',
  '.output',
  'target',
  'bin',
  'obj',
]);

const IGNORED_FILES = new Set([
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.local',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.kt', '.scala',
  '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.hpp',
  '.swift', '.vue', '.svelte', '.astro',
  '.json', '.yaml', '.yml', '.toml',
  '.md', '.mdx', '.txt',
  '.css', '.scss', '.sass', '.less',
  '.sql', '.graphql', '.gql',
  '.sh', '.bash', '.zsh',
  '.dockerfile', '.env.example',
]);

const MAX_FILE_SIZE = 512 * 1024; // 512KB

export function shouldIgnorePath(filePath: string): boolean {
  const parts = filePath.split(path.sep);
  for (const part of parts) {
    if (IGNORED_DIRS.has(part)) return true;
  }
  const basename = path.basename(filePath);
  if (IGNORED_FILES.has(basename)) return true;
  if (basename.startsWith('.') && basename !== '.env.example') return true;
  return false;
}

export function isAllowedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  if (basename === 'dockerfile' || basename.startsWith('dockerfile.')) return true;
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  return false;
}

export function isWithinSizeLimit(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE;
}
