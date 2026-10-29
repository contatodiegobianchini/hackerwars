const TOKEN_KEY = 'hacker_token';
const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookieToken = getCookie(TOKEN_KEY);
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback and migration for legacy localStorage tokens
  try {
    const legacyToken = localStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      setAuthToken(legacyToken);
      localStorage.removeItem(TOKEN_KEY);
      return legacyToken;
    }
  } catch {
    // Ignore localStorage access errors (e.g., restricted iframe)
  }

  return null;
}

export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') return;

  const isHttps = window.location.protocol === 'https:';
  const cookieValue = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${THIRTY_DAYS_SEC}; SameSite=Strict${
    isHttps ? '; Secure' : ''
  }`;

  document.cookie = cookieValue;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore localStorage access errors
  }
}

export function removeAuthToken(): void {
  if (typeof document === 'undefined') return;

  const isHttps = window.location.protocol === 'https:';
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${
    isHttps ? '; Secure' : ''
  }`;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore localStorage access errors
  }
}
