import test from 'node:test';
import assert from 'node:assert/strict';
import { chatSchema } from './chat.controller';

test('trims a message before validating length', () => {
  const result = chatSchema.parse({ message: '  hello world  ' });
  assert.equal(result.message, 'hello world');
});

test('rejects a whitespace-only message even though it passes a raw length check', () => {
  assert.throws(() => chatSchema.parse({ message: '   ' }));
  assert.throws(() => chatSchema.parse({ message: '\n\t' }));
});

test('rejects a genuinely empty message', () => {
  assert.throws(() => chatSchema.parse({ message: '' }));
});

test('rejects a message over 4000 characters', () => {
  assert.throws(() => chatSchema.parse({ message: 'a'.repeat(4001) }));
});

test('defaults mode to "explain" when omitted', () => {
  const result = chatSchema.parse({ message: 'hi' });
  assert.equal(result.mode, 'explain');
});

test('rejects an invalid mode value', () => {
  assert.throws(() => chatSchema.parse({ message: 'hi', mode: 'not-a-real-mode' }));
});

test('rejects a malformed sessionId', () => {
  assert.throws(() => chatSchema.parse({ message: 'hi', sessionId: 'not-an-id' }));
});

test('accepts a valid 24-char sessionId', () => {
  const result = chatSchema.parse({ message: 'hi', sessionId: 'a'.repeat(24) });
  assert.equal(result.sessionId, 'a'.repeat(24));
});
