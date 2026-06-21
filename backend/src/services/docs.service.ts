import { geminiService } from './embedding.service';
import { chromaService } from './chroma.service';
import { parserService } from './parser.service';
import { githubService } from './github.service';
import { DocumentType } from '../models/Document';

const DOC_PROMPTS: Record<DocumentType, { title: string; prompt: string }> = {
  readme: {
    title: 'Generated README',
    prompt: `Generate a comprehensive README.md for this repository based on the codebase analysis.
Include: project overview, features, tech stack, installation, configuration, usage, project structure, and contributing guidelines.
Use proper markdown formatting.`,
  },
  api_docs: {
    title: 'API Documentation',
    prompt: `Generate comprehensive API documentation for this repository.
Include all endpoints/routes, request/response schemas, authentication, error codes, and usage examples.
Use proper markdown formatting with tables where appropriate.`,
  },
  onboarding: {
    title: 'Developer Onboarding Guide',
    prompt: `Create a detailed developer onboarding guide for this repository.
Include: prerequisites, local setup steps, environment variables, key architecture overview, important files to know, development workflow, testing, and common tasks.
Use proper markdown formatting.`,
  },
  folder_structure: {
    title: 'Folder Structure Guide',
    prompt: `Explain the folder structure and organization of this repository.
For each major directory, explain its purpose, key files, and how it fits into the overall architecture.
Use a tree-like format and detailed descriptions.`,
  },
};

export class DocsService {
  async generate(
    collectionName: string,
    localPath: string,
    type: DocumentType
  ): Promise<{ title: string; content: string }> {
    const config = DOC_PROMPTS[type];

    const contextQueries: Record<DocumentType, string[]> = {
      readme: ['project overview main entry point', 'package.json dependencies scripts'],
      api_docs: ['API routes endpoints controllers', 'request response handlers middleware'],
      onboarding: ['setup installation configuration environment', 'main application entry architecture'],
      folder_structure: ['project structure directories modules', 'source code organization'],
    };

    const queries = contextQueries[type];
    const allResults = await Promise.all(
      queries.map((q) => chromaService.query(collectionName, q, 5))
    );

    const context = allResults
      .flat()
      .map((r) => `${r.filePath}:${r.startLine}-${r.endLine}\n${r.content}`)
      .join('\n\n---\n\n');

    let extraContext = '';
    if (type === 'readme') {
      const existingReadme = await githubService.getReadme(localPath);
      if (existingReadme) {
        extraContext = `\n\nExisting README:\n${existingReadme.slice(0, 3000)}`;
      }
    }

    if (type === 'folder_structure') {
      const files = await parserService.parseRepository(localPath);
      const tree = parserService.buildFileTree(localPath, files);
      extraContext = `\n\nFile tree:\n${JSON.stringify(tree, null, 2).slice(0, 5000)}`;
    }

    const content = await geminiService.generateWithContext(
      config.prompt,
      context + extraContext,
      'You are a technical documentation expert. Generate clear, accurate documentation based on the repository context.'
    );

    return { title: config.title, content };
  }
}

export const docsService = new DocsService();
