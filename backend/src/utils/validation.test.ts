import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mongoIdSchema,
  repositoryIdParamSchema,
  repositorySessionParamSchema,
} from './validation';

const VALID_ID = 'a'.repeat(24);
const OTHER_VALID_ID = 'b'.repeat(24);

test('mongoIdSchema accepts a valid 24-character hex ObjectId', () => {
  assert.doesNotThrow(() => mongoIdSchema.parse(VALID_ID));
});

test('mongoIdSchema rejects a malformed id instead of letting it reach Mongoose as a CastError', () => {
  assert.throws(() => mongoIdSchema.parse('not-an-id'));
  assert.throws(() => mongoIdSchema.parse('123'));
  assert.throws(() => mongoIdSchema.parse(''));
});

test('repositoryIdParamSchema validates id and passes through other route params (e.g. :type on the docs route)', () => {
  // Regression test: z.object() strips unrecognized keys by default, which
  // would silently delete :type from req.params after validateParams()
  // replaces it with the parsed result. .passthrough() must prevent that.
  const result = repositoryIdParamSchema.parse({ id: VALID_ID, type: 'readme' });
  assert.deepEqual(result, { id: VALID_ID, type: 'readme' });
});

test('repositoryIdParamSchema rejects a malformed repository id', () => {
  assert.throws(() => repositoryIdParamSchema.parse({ id: 'bad-id' }));
});

test('repositorySessionParamSchema accepts two valid ids', () => {
  const result = repositorySessionParamSchema.parse({ id: VALID_ID, sessionId: OTHER_VALID_ID });
  assert.deepEqual(result, { id: VALID_ID, sessionId: OTHER_VALID_ID });
});

test('repositorySessionParamSchema rejects when either id is malformed', () => {
  assert.throws(() => repositorySessionParamSchema.parse({ id: VALID_ID, sessionId: 'bad' }));
  assert.throws(() => repositorySessionParamSchema.parse({ id: 'bad', sessionId: OTHER_VALID_ID }));
});
