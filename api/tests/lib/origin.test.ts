import { describe, it, expect } from 'vitest';
import { isHostAllowed, parseOriginHeader } from '../../src/lib/origin.js';

describe('isHostAllowed', () => {
  it('matches exact host entries', () => {
    expect(isHostAllowed('app.example.com', ['app.example.com'])).toBe(true);
  });

  it('supports wildcard matches for numeric subdomains', () => {
    expect(isHostAllowed('tenant123.app.local', ['tenant*.app.local'])).toBe(true);
  });

  it('rejects hosts that do not match patterns', () => {
    expect(isHostAllowed('malicious.example.com', ['app.example.com'])).toBe(false);
  });

  it('requires numeric middle segments when using wildcard patterns', () => {
    expect(isHostAllowed('tenant-abc.app.local', ['tenant*.app.local'])).toBe(false);
  });
});

describe('parseOriginHeader', () => {
  it('returns protocol and host for valid http origins', () => {
    const result = parseOriginHeader('https://app.example.com/dashboard');
    expect(result).toEqual({ origin: 'https://app.example.com', host: 'app.example.com' });
  });

  it('rejects non-http protocols', () => {
    expect(parseOriginHeader('ftp://app.example.com')).toBeNull();
  });

  it('returns null for invalid urls', () => {
    expect(parseOriginHeader('not a url')).toBeNull();
  });
});
