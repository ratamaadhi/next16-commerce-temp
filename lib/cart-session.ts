const SESSION_COOKIE = "cart-session";

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function setSessionId(id: string): void {
  document.cookie = `${SESSION_COOKIE}=${id};path=/;Secure;SameSite=Lax;max-age=${
    7 * 24 * 60 * 60
  }`;
}

export function getSessionId(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getOrCreateSessionId(): string {
  const existing = getSessionId();
  if (existing) return existing;
  const id = generateSessionId();
  setSessionId(id);
  return id;
}

export function resetSessionId(): string {
  const id = generateSessionId();
  setSessionId(id);
  return id;
}
