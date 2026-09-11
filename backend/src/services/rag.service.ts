import { geminiService } from './embedding.service';
import { chromaService } from './chroma.service';
import { RAGResponse } from '../types';

const SYSTEM_INSTRUCTION = `You are an expert software engineer assistant analyzing a GitHub repository.
Your role is to help developers understand code, architecture, APIs, and onboarding.
Use only information explicitly supported by the provided repository context.
Do not invent examples, file contents, errors, APIs, or implementation details.
If the context does not contain enough information to answer, say so clearly.
Use markdown formatting for code blocks and structure.
Reference specific files and line numbers when relevant.
Prioritize concise, direct answers. Include only the details needed to answer the question. Avoid repeating code unless it is necessary to explain the behavior.`;

const CHAT_MODES: Record<string, string> = {
  explain: 'Explain the code or concept clearly with examples from the context.',
  architecture:
    'Focus on system architecture, design patterns, and how components interact.',
  function:
    'Explain the specific function(s), their parameters, return values, and usage.',
  api: 'Explain API endpoints, routes, request/response formats, and usage examples.',
  onboarding:
    'Create a developer onboarding guide covering setup, key files, and workflows.',
};

export class RAGService {
  async chat(
    collectionName: string,
    question: string,
    mode: string = 'explain'
  ): Promise<RAGResponse> {
    const modeInstruction = CHAT_MODES[mode] || CHAT_MODES.explain;
    const results = await chromaService.query(collectionName, question, 10);

    const context = results
      .map(
        (r, i) =>
          `[Source ${i + 1}] ${r.filePath}:${r.startLine}-${r.endLine}\n${r.content}`
      )
      .join('\n\n---\n\n');

    const answer = await geminiService.generateWithContext(
      question,
      context || 'No relevant context found in the repository.',
      `${SYSTEM_INSTRUCTION}\n\nMode: ${modeInstruction}`
    );

    const citations = results.slice(0, 5).map((r) => ({
      filePath: r.filePath,
      startLine: r.startLine,
      endLine: r.endLine,
      snippet: r.content.slice(0, 300),
      score: r.score,
    }));

    return { answer, citations };
  }
}

export const ragService = new RAGService();