import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Authentication', () => {
  it('hashes passwords correctly', async () => {
    const pass = 'secret123';
    const hash = await bcrypt.hash(pass, 10);
    expect(hash).not.toBe(pass);
    const isValid = await bcrypt.compare(pass, hash);
    expect(isValid).toBe(true);
  });
});
