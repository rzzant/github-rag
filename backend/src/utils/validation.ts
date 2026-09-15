import { z } from 'zod';

// Matches a valid MongoDB ObjectId (24 hex characters). Used to reject
// malformed ids with a clean 400 before they ever reach Mongoose - without
// this, an invalid id (e.g. "not-an-id") throws a Mongoose CastError that
// the global error handler can only classify as a generic 500.
export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

// .passthrough() preserves any other route params (e.g. :type on the docs
// route) that this schema doesn't explicitly validate - z.object() strips
// unrecognized keys by default, which would otherwise silently delete them
// from req.params after validateParams() replaces it with the parsed result.
export const repositoryIdParamSchema = z
  .object({
    id: mongoIdSchema,
  })
  .passthrough();

export const repositorySessionParamSchema = z
  .object({
    id: mongoIdSchema,
    sessionId: mongoIdSchema,
  })
  .passthrough();
