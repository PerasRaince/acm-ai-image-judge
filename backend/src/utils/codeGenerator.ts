import crypto from 'crypto';

// Characters excluding ambiguous ones (no 0, O, 1, l, I)
const CODE_CHARS = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generates a non-sequential, cryptographically strong competition code.
 * Format: 3 groups separated by hyphens (e.g. "abc-defg-hij")
 * Total 10 characters from a 31-character alphabet = 31^10 ≈ 8.2 x 10^14 combinations.
 */
export function generateCompetitionCode(): string {
  const getRandomChar = (): string => {
    const randomByte = crypto.randomBytes(1)[0];
    return CODE_CHARS[randomByte % CODE_CHARS.length];
  };

  const part1 = Array.from({ length: 3 }, getRandomChar).join('');
  const part2 = Array.from({ length: 4 }, getRandomChar).join('');
  const part3 = Array.from({ length: 3 }, getRandomChar).join('');

  return `${part1}-${part2}-${part3}`;
}

/**
 * Normalizes user input into a canonical competition code format.
 * Handles full URLs (e.g., "http://localhost:3000/join/abc-defg-hij" -> "abc-defg-hij"),
 * removes surrounding spaces, slashes, and converts to lowercase.
 */
export function normalizeCompetitionCode(rawInput: string): string {
  if (!rawInput) return '';
  
  let trimmed = rawInput.trim().toLowerCase();

  // If full URL was pasted, extract the last segment or query
  if (trimmed.includes('/join/')) {
    const parts = trimmed.split('/join/');
    trimmed = parts[parts.length - 1];
  } else if (trimmed.includes('/competitions/')) {
    const parts = trimmed.split('/competitions/');
    trimmed = parts[parts.length - 1];
  }

  // Remove URL query parameters or hash if any
  trimmed = trimmed.split('?')[0].split('#')[0];

  // Remove any leading/trailing slashes
  trimmed = trimmed.replace(/^\/+|\/+$/g, '');

  return trimmed;
}

/**
 * Validates whether a code has acceptable length and character composition.
 */
export function isValidCompetitionCode(code: string): boolean {
  if (!code) return false;
  const normalized = normalizeCompetitionCode(code);
  // Must be at least 6 characters and consist only of lowercase letters, digits, and hyphens
  return /^[a-z0-9-]{6,30}$/.test(normalized);
}
