/**
 * Generates a bcrypt hash for AUTH_PASSWORD_HASH.
 *
 * Usage:
 *   npm run hash-password -- "your-chosen-password"
 *
 * Paste the printed hash into your .env as AUTH_PASSWORD_HASH. The
 * plaintext password is never stored anywhere - only this hash is.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "your-chosen-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(hash);
