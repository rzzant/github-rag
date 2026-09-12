# RepoMind

RepoMind is an AI-powered GitHub repository assistant that uses Retrieval-Augmented Generation (RAG) to help developers understand unfamiliar codebases.

Paste a GitHub repository URL and RepoMind:

1. clones the repository
2. filters and parses relevant files
3. splits source into searchable chunks
4. generates embeddings with Gemini
5. stores embeddings in ChromaDB
6. retrieves relevant code for each question
7. generates a grounded answer with Gemini
8. returns file and line-level citations
9. persists chat sessions in MongoDB

The goal is not just to generate an answer, but to make the answer traceable back to the repository.

---

## Features

### RAG Chat

Ask questions about:

- code behavior
- architecture
- functions
- APIs
- onboarding
- implementation details

Answers are generated from retrieved repository context and include source citations.

### Chat Modes

RepoMind provides focused modes for:

- Explain
- Architecture
- Function
- API
- Onboarding

### Repository Indexing

Repositories are cloned and indexed automatically.

The indexing pipeline filters irrelevant files and limits very large files before chunking and embedding.

### Source Citations

RAG responses include:

- file path
- start line
- end line
- source snippet
- retrieval score

### Documentation

RepoMind can generate repository documentation such as:

- README
- API documentation
- onboarding documentation
- folder structure information

### Architecture View

The application exposes repository architecture/dependency information through a dedicated UI.

### Persistent Chat Sessions

Chat sessions are stored in MongoDB and associated with the repository they belong to.

---

## Architecture

```text
                        ┌─────────────────────┐
                        │      Next.js UI      │
                        │  React + TypeScript  │
                        └──────────┬──────────┘
                                   │ HTTP
                                   ▼
                        ┌─────────────────────┐
                        │   Express Backend   │
                        │    TypeScript API   │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
       │   MongoDB   │      │  ChromaDB   │     │   Gemini    │
       │ metadata +  │      │ embeddings +│     │ embeddings +│
       │ chat        │      │ retrieval   │     │ generation  │
       └─────────────┘      └─────────────┘     └─────────────┘
                                   ▲
                                   │
                           repository chunks
                                   ▲
                                   │
                        ┌─────────────────────┐
                        │  GitHub repository  │
                        │ clone + parse/filter│
                        └─────────────────────┘
