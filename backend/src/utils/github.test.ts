import test from 'node:test';
import assert from 'node:assert/strict';
import { getCollectionName } from './github';

test('generates a normalized Chroma collection name', () => {
  assert.equal(
    getCollectionName('rzzant', 'github-rag'),
    'repo_rzzant_github_rag'
  );
});

test('lowercases owner and repository names', () => {
  assert.equal(
    getCollectionName('RZZANT', 'GitHub-RAG'),
    'repo_rzzant_github_rag'
  );
});

test('replaces unsupported characters with underscores', () => {
  assert.equal(
    getCollectionName('my-org', 'my.repo'),
    'repo_my_org_my_repo'
  );
});