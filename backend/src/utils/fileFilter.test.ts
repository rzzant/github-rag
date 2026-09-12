import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldIgnorePath,
  isAllowedFile,
  isWithinSizeLimit,
} from './fileFilter';

test('ignores dependency directories', () => {
  assert.equal(
    shouldIgnorePath('src/node_modules/package/index.js'),
    true
  );

  assert.equal(
    shouldIgnorePath('project/.git/config'),
    true
  );

  assert.equal(
    shouldIgnorePath('frontend/.next/server/app.js'),
    true
  );
});

test('ignores lockfiles and environment files', () => {
  assert.equal(shouldIgnorePath('package-lock.json'), true);
  assert.equal(shouldIgnorePath('.env'), true);
  assert.equal(shouldIgnorePath('.env.local'), true);
});

test('allows .env.example', () => {
  assert.equal(shouldIgnorePath('.env.example'), false);
});

test('allows supported source files', () => {
  assert.equal(isAllowedFile('src/app.ts'), true);
  assert.equal(isAllowedFile('src/component.tsx'), true);
  assert.equal(isAllowedFile('main.py'), true);
  assert.equal(isAllowedFile('README.md'), true);
});

test('allows Dockerfiles', () => {
  assert.equal(isAllowedFile('Dockerfile'), true);
  assert.equal(isAllowedFile('Dockerfile.dev'), true);
});

test('rejects unsupported file types', () => {
  assert.equal(isAllowedFile('image.png'), false);
  assert.equal(isAllowedFile('archive.zip'), false);
});

test('enforces the 512KB file-size limit', () => {
  assert.equal(isWithinSizeLimit(512 * 1024), true);
  assert.equal(isWithinSizeLimit(512 * 1024 + 1), false);
});