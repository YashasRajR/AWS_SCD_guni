import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyHmacSha256Hex } from '../../../backend/src/integrations/payment/razorpay-provider.js';

const SECRET = 'test-webhook-secret';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body, 'utf8').digest('hex');
}

describe('verifyHmacSha256Hex', () => {
  it('accepts a correctly signed body', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    expect(verifyHmacSha256Hex(body, sign(body), SECRET)).toBe(true);
  });

  it('rejects a body signed with the wrong secret', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    const wrongSignature = createHmac('sha256', 'wrong-secret').update(body, 'utf8').digest('hex');
    expect(verifyHmacSha256Hex(body, wrongSignature, SECRET)).toBe(false);
  });

  it('rejects a tampered body (signature no longer matches)', () => {
    const original = JSON.stringify({ amount: 100 });
    const tampered = JSON.stringify({ amount: 100000 });
    expect(verifyHmacSha256Hex(tampered, sign(original), SECRET)).toBe(false);
  });

  it('rejects a malformed (non-hex) signature instead of throwing', () => {
    expect(verifyHmacSha256Hex('{}', 'not-a-hex-signature!!', SECRET)).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(verifyHmacSha256Hex('{}', '', SECRET)).toBe(false);
  });
});
