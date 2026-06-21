import path from 'path';
import { parserService } from './parser.service';
import {
  ArchitectureData,
  DependencyEdge,
  DependencyNode,
  ParsedFile,
} from '../types';

const IMPORT_PATTERNS = [
  /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /from\s+['"]([^'"]+)['"]\s+import/g,
];

export class ArchitectureService {
  async analyze(localPath: string): Promise<ArchitectureData> {
    const files = await parserService.parseRepository(localPath);
    const tree = parserService.buildFileTree(localPath, files);
    const { nodes, edges } = this.buildDependencyGraph(files, localPath);

    const languages: Record<string, number> = {};
    let totalDirectories = 0;

    const countDirs = (node: typeof tree): void => {
      if (node.type === 'directory') {
        totalDirectories++;
        node.children?.forEach(countDirs);
      }
    };
    countDirs(tree);

    for (const file of files) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }

    const topLevelFolders = tree.children
      ?.filter((c) => c.type === 'directory')
      .map((c) => c.name) || [];

    return {
      tree,
      dependencies: { nodes, edges },
      stats: {
        totalFiles: files.length,
        totalDirectories,
        languages,
        topLevelFolders,
      },
    };
  }

  private buildDependencyGraph(
    files: ParsedFile[],
    rootPath: string
  ): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
    const nodeMap = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];
    const fileIndex = new Map<string, string>();

    for (const file of files) {
      const id = file.relativePath;
      fileIndex.set(id, id);
      nodeMap.set(id, {
        id,
        label: path.basename(file.relativePath),
        type: 'file',
        group: path.dirname(file.relativePath).split('/')[0] || 'root',
      });
    }

    for (const file of files) {
      const imports = this.extractImports(file.content);

      for (const imp of imports) {
        const resolved = this.resolveImport(imp, file.relativePath, fileIndex);
        if (resolved && resolved !== file.relativePath) {
          if (!nodeMap.has(resolved)) {
            nodeMap.set(resolved, {
              id: resolved,
              label: path.basename(resolved),
              type: imp.startsWith('.') ? 'file' : 'package',
              group: imp.startsWith('.') ? 'internal' : 'external',
            });
          }

          edges.push({
            source: file.relativePath,
            target: resolved,
            type: imp.startsWith('.') ? 'import' : 'dependency',
          });
        } else if (!imp.startsWith('.')) {
          const pkgId = `pkg:${imp}`;
          if (!nodeMap.has(pkgId)) {
            nodeMap.set(pkgId, {
              id: pkgId,
              label: imp,
              type: 'package',
              group: 'external',
            });
          }
          edges.push({
            source: file.relativePath,
            target: pkgId,
            type: 'dependency',
          });
        }
      }
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  }

  private extractImports(content: string): string[] {
    const imports = new Set<string>();

    for (const pattern of IMPORT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        imports.add(match[1]);
      }
    }

    return Array.from(imports);
  }

  private resolveImport(
    importPath: string,
    fromFile: string,
    fileIndex: Map<string, string>
  ): string | null {
    if (!importPath.startsWith('.')) return null;

    const dir = path.dirname(fromFile);
    let resolved = path.normalize(path.join(dir, importPath)).replace(/\\/g, '/');

    if (fileIndex.has(resolved)) return resolved;

    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.js', '/index.tsx'];
    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (fileIndex.has(candidate)) return candidate;
    }

    return null;
  }
}

export const architectureService = new ArchitectureService();
