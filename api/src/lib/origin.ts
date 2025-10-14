export function isHostAllowed(host: string, allowedHosts: string[]): boolean {
  for (const pattern of allowedHosts) {
    const star = pattern.indexOf('*');
    if (star === -1) {
      if (host === pattern) return true;
      continue;
    }
    // One-star wildcard: match digits in the middle
    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);
    if (!host.startsWith(prefix) || !host.endsWith(suffix)) continue;
    const middle = host.slice(prefix.length, host.length - suffix.length);
    if (/^[0-9]+$/.test(middle)) return true;
  }
  return false;
}

export function parseOriginHeader(value: string): { origin: string; host: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const normalizedOrigin = `${url.protocol}//${url.host}`;
    return { origin: normalizedOrigin, host: url.host };
  } catch {
    return null;
  }
}
