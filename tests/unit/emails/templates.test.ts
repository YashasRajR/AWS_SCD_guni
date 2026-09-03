import { describe, expect, it } from 'vitest';
import { renderEmailTemplate } from '../../../backend/src/integrations/email/templates.js';

describe('renderEmailTemplate', () => {
  it('includes the verification link and does not discard it', () => {
    const { html, text } = renderEmailTemplate('email-verification', {
      link: 'https://example.com/verify-email?token=abc123',
      ttl: '24h',
    });
    expect(html).toContain('https://example.com/verify-email?token=abc123');
    expect(text).toContain('https://example.com/verify-email?token=abc123');
  });

  it('includes the password reset link', () => {
    const { text } = renderEmailTemplate('password-reset', {
      link: 'https://example.com/reset-password?token=xyz789',
      ttl: '1h',
    });
    expect(text).toContain('https://example.com/reset-password?token=xyz789');
  });

  it('escapes HTML-unsafe characters in interpolated data', () => {
    const { html } = renderEmailTemplate('registration-confirmation', {
      fullName: '<script>alert(1)</script>',
      registrationNumber: 'REG-1',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('falls back gracefully on missing data instead of throwing', () => {
    expect(() => renderEmailTemplate('ticket', {})).not.toThrow();
  });
});
