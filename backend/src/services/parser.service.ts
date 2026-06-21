import fs from 'fs/promises';
import path from 'path';
import { shouldIgnorePath, isAllowedFile, isWithinSizeLimit } from '../utils/fileFilter';
import { ParsedFile, SourceChunk, TreeNode } from '../types';
import { logger } from '../utils/logger';

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

const EXT_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.c': 'c',
  '.swift': 'swift',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.css': 'css',
  '.scss': 'scss',
};

export class ParserService {
  async parseRepository(rootPath: string): Promise<ParsedFile[]> {
    const files: ParsedFile[] = [];
    await this.walkDirectory(rootPath, rootPath, files);
    logger.info(`Parsed ${files.length} source files`);
    return files;
  }

  chunkFile(file: ParsedFile, repoId: string): SourceChunk[] {
    const lines = file.content.split('\n');
    const chunks: SourceChunk[] = [];
    let chunkIndex = 0;

    if (file.content.length <= CHUNK_SIZE) {
      chunks.push({
        id: `${repoId}_${file.relativePath}_0`,
        filePath: file.relativePath,
        content: file.content,
        startLine: 1,
        endLine: lines.length,
        language: file.language,
      });
      return chunks;
    }

    let startLine = 0;
    let currentChunk = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWithNewline = line + '\n';

      if (currentChunk.length + lineWithNewline.length > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push({
          id: `${repoId}_${file.relativePath}_${chunkIndex}`,
          filePath: file.relativePath,
          content: currentChunk.trim(),
          startLine: startLine + 1,
          endLine: i,
          language: file.language,
        });
        chunkIndex++;

        const overlapLines = Math.floor(CHUNK_OVERLAP / 50);
        const overlapStart = Math.max(0, i - overlapLines);
        currentChunk = lines.slice(overlapStart, i).join('\n') + '\n';
        startLine = overlapStart;
      }

      currentChunk += lineWithNewline;
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${repoId}_${file.relativePath}_${chunkIndex}`,
        filePath: file.relativePath,
        content: currentChunk.trim(),
        startLine: startLine + 1,
        endLine: lines.length,
        language: file.language,
      });
    }

    return chunks;
  }

  buildFileTree(rootPath: string, files: ParsedFile[]): TreeNode {
    const root: TreeNode = { name: path.basename(rootPath), path: '', type: 'directory', children: [] };

    for (const file of files) {
      const parts = file.relativePath.split(path.sep);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const nodePath = parts.slice(0, i + 1).join('/');

        if (isFile) {
          current.children = current.children || [];
          current.children.push({
            name: part,
            path: nodePath,
            type: 'file',
            extension: path.extname(part),
          });
        } else {
          current.children = current.children || [];
          let dirNode = current.children.find((c) => c.name === part && c.type === 'directory');
          if (!dirNode) {
            dirNode = { name: part, path: nodePath, type: 'directory', children: [] };
            current.children.push(dirNode);
          }
          current = dirNode;
        }
      }
    }

    this.sortTree(root);
    return root;
  }

  detectPrimaryLanguage(files: ParsedFile[]): string {
    const counts: Record<string, number> = {};
    for (const file of files) {
      counts[file.language] = (counts[file.language] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  }

  private async walkDirectory(
    rootPath: string,
    currentPath: string,
    files: ParsedFile[]
  ): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);

      if (shouldIgnorePath(relativePath)) continue;

      if (entry.isDirectory()) {
        await this.walkDirectory(rootPath, fullPath, files);
      } else if (entry.isFile() && isAllowedFile(relativePath)) {
        try {
          const stat = await fs.stat(fullPath);
          if (!isWithinSizeLimit(stat.size)) continue;

          const content = await fs.readFile(fullPath, 'utf-8');
          const ext = path.extname(entry.name).toLowerCase();
          files.push({
            filePath: fullPath,
            relativePath: relativePath.replace(/\\/g, '/'),
            content,
            language: EXT_TO_LANGUAGE[ext] || 'text',
            size: stat.size,
          });
        } catch {
          continue;
        }
      }
    }
  }

  private sortTree(node: TreeNode): void {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach((child) => this.sortTree(child));
  }
}

export const parserService = new ParserService();
