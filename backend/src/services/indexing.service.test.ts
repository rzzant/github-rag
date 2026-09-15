import test from 'node:test';
import assert from 'node:assert/strict';
import { IN_PROGRESS_STATUSES } from './indexing.service';

test('IN_PROGRESS_STATUSES includes exactly the four non-terminal indexing states', () => {
  assert.deepEqual(new Set(IN_PROGRESS_STATUSES), new Set(['pending', 'cloning', 'parsing', 'embedding']));
});

test('IN_PROGRESS_STATUSES excludes the two terminal states that are safe to (re)start or delete from', () => {
  assert.equal(IN_PROGRESS_STATUSES.includes('ready' as never), false);
  assert.equal(IN_PROGRESS_STATUSES.includes('failed' as never), false);
});
