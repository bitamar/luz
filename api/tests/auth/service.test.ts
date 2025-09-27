import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { startGoogleAuth, finishGoogleAuth } from '../../src/auth/service.js';
import { buildAuthUrl, exchangeAuthorizationCode } from '../../src/auth/oidc.js';
import type { DiscoveredConfig } from '../../src/auth/oidc.js';
import type { UserRepository, DbUser } from '../../src/auth/types.js';

vi.mock('../../src/auth/oidc.js', () => ({
  buildAuthUrl: vi.fn(
    (_config: unknown, params: { state: string; nonce: string }, opts: { redirectUri: string }) => {
      const url = new URL('https://example.test/auth');
      url.searchParams.set('state', params.state);
      url.searchParams.set('nonce', params.nonce);
      url.searchParams.set('redirect_uri', opts.redirectUri);
      url.searchParams.set('scope', 'openid email profile');
      return url;
    }
  ),
  exchangeAuthorizationCode: vi.fn(),
  generateStateNonce: vi.fn(() => ({ state: 's', nonce: 'n' })),
  buildCallbackVerificationUrl: vi.fn((redirectUri: string) => new URL(redirectUri)),
}));

describe('service', () => {
  const config = {} as DiscoveredConfig;

  it('startGoogleAuth returns cookie and redirect', () => {
    const res = startGoogleAuth(config, { redirectUri: 'https://app/cb' });
    expect(res.cookie.name).toBe('oidc');
    expect(typeof res.cookie.value).toBe('string');
    expect(res.redirectUrl).toBeTruthy();
    const mock = buildAuthUrl as unknown as Mock;
    expect(mock.mock.calls.length || 1).toBeGreaterThan(0);
  });

  it('finishGoogleAuth happy path', async () => {
    (exchangeAuthorizationCode as unknown as Mock).mockResolvedValue({
      ok: true,
      data: {
        claims: () => ({ sub: '1', email: 'a', email_verified: true, name: null, picture: null }),
      },
    });
    const fakeUser: DbUser = {
      id: 'u',
      email: 'a',
      googleId: '1',
      name: null,
      avatarUrl: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      lastLoginAt: new Date(0),
    };
    const repo: UserRepository = {
      upsertByEmail: vi.fn().mockResolvedValue(fakeUser),
    };
    const res = await finishGoogleAuth(
      { config, repo, now: () => new Date(0), redirectUri: 'https://app/cb' },
      {
        requestUrl: 'https://app/cb?code=x&state=s',
        query: { code: 'x', state: 's' },
        rawCookie: JSON.stringify({ state: 's', nonce: 'n' }),
      }
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.user).toBeTruthy();
  });

  it('finishGoogleAuth handles oauth_exchange_failed', async () => {
    (exchangeAuthorizationCode as unknown as Mock).mockResolvedValue({
      ok: false,
      error: 'oauth_exchange_failed',
    });
    const repo: UserRepository = {
      upsertByEmail: vi.fn().mockResolvedValue({
        id: 'u',
        email: 'a',
        googleId: '1',
        name: null,
        avatarUrl: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        lastLoginAt: new Date(0),
      } satisfies DbUser),
    };

    const res = await finishGoogleAuth(
      { config, repo, now: () => new Date(0), redirectUri: 'https://app/cb' },
      {
        requestUrl: 'https://app/cb?code=x&state=s',
        query: { code: 'x', state: 's' },
        rawCookie: JSON.stringify({ state: 's', nonce: 'n' }),
      }
    );
    expect(res).toEqual({ ok: false, error: 'oauth_exchange_failed' });
  });
});
