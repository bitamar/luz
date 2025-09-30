export const OIDC_COOKIE_NAME = 'oidc' as const;
export const OIDC_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 300,
};

export const OIDC_SCOPE = 'openid email profile' as const;
