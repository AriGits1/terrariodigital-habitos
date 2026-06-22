import bcrypt from "bcryptjs";

const COST_FACTOR = 12;

/**
 * Hash a plaintext password using bcrypt with cost factor 12.
 * Never store the returned hash as plaintext — it already contains the salt.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

/**
 * Compare a plaintext candidate against a stored bcrypt hash.
 * Safe to call even if hash is an empty string — bcrypt returns false.
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
