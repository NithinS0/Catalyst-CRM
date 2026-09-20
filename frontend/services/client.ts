export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

// ── Performance: In-flight Request Deduplication & Short-lived SWR Cache ────────
const inflightRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 3000; // 3-second cache makes tab switching and component mounts instant

export function clearApiCache() {
  responseCache.clear();
  inflightRequests.clear();
}

function clearSessionAndRedirect() {
  if (typeof window === 'undefined') return;

  // Clear auth cookies
  document.cookie = 'catalyst_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'catalyst_role=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'catalyst_company_id=; path=/; max-age=0; SameSite=Lax';

  // Clear localStorage
  try {
    localStorage.removeItem('catalyst_user');
    localStorage.removeItem('catalyst_override_company');
  } catch {}

  // Only redirect if not already on /login or /register
  const pathname = window.location.pathname;
  if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    window.location.href = `/login?expired=true&redirect=${encodeURIComponent(pathname)}`;
  }
}

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('catalyst_user');
    if (!stored) return null;
    const userObj = JSON.parse(stored);
    const refreshToken = userObj.refresh_token;
    if (!refreshToken) return null;

    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.session?.access_token) {
      const newAccessToken = data.session.access_token;
      const newRefreshToken = data.session.refresh_token || refreshToken;

      // Update cookie
      document.cookie = `catalyst_token=${newAccessToken}; path=/; max-age=604800; SameSite=Lax`;

      // Update localStorage
      userObj.token = newAccessToken;
      userObj.refresh_token = newRefreshToken;
      localStorage.setItem('catalyst_user', JSON.stringify(userObj));

      return newAccessToken;
    }
  } catch (err) {
    console.error('Failed to auto-refresh session token:', err);
  }
  return null;
}

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // If a mutation occurs, purge the cached GET responses
  if (method !== 'GET') {
    responseCache.clear();
  }

  // Check GET response cache for instant UI rendering
  const cacheKey = `${method}:${path}`;
  if (method === 'GET') {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }

    // Deduplicate simultaneous in-flight GET requests
    if (inflightRequests.has(cacheKey)) {
      return inflightRequests.get(cacheKey) as Promise<T>;
    }
  }

  const fetchPromise = (async () => {
    let token: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('catalyst_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          token = userObj.token;
        }
      } catch (e) {
        console.error('Failed to parse user details for token', e);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (typeof window !== 'undefined') {
      const overrideCompany = localStorage.getItem('catalyst_override_company');
      if (overrideCompany) {
        headers['X-Super-Admin-Override-Company-ID'] = overrideCompany;
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let detail = `API error: ${res.status}`;
      try {
        const json = JSON.parse(text);
        detail = json.detail || json.message || detail;
      } catch {
        if (text) detail = text;
      }

      // Handle 401 Unauthorized / Token Expiration
      const isAuthError =
        res.status === 401 ||
        detail.toLowerCase().includes('token is expired') ||
        detail.toLowerCase().includes('invalid jwt') ||
        detail.toLowerCase().includes('unauthorized');

      if (isAuthError && !path.startsWith('/api/auth/')) {
        if (typeof window !== 'undefined') {
          if (!isRefreshing) {
            isRefreshing = true;
            const newToken = await tryRefreshToken();
            isRefreshing = false;

            if (newToken) {
              onTokenRefreshed(newToken);
              // Retry the original request with the new token
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryRes = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers,
              });
              if (retryRes.ok) {
                const data = await retryRes.json();
                if (method === 'GET') {
                  responseCache.set(cacheKey, { data, timestamp: Date.now() });
                }
                return data as T;
              }
            } else {
              clearSessionAndRedirect();
            }
          } else {
            // Wait for token refresh in progress
            return new Promise<T>((resolve, reject) => {
              addRefreshSubscriber(async (newToken: string) => {
                try {
                  headers['Authorization'] = `Bearer ${newToken}`;
                  const retryRes = await fetch(`${API_BASE_URL}${path}`, {
                    ...options,
                    headers,
                  });
                  if (retryRes.ok) {
                    const data = await retryRes.json();
                    if (method === 'GET') {
                      responseCache.set(cacheKey, { data, timestamp: Date.now() });
                    }
                    resolve(data);
                  } else {
                    reject(new Error(detail));
                  }
                } catch (e) {
                  reject(e);
                }
              });
            });
          }
        }
      }

      throw new Error(detail);
    }

    const data = (await res.json()) as T;
    if (method === 'GET') {
      responseCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  })();

  if (method === 'GET') {
    inflightRequests.set(cacheKey, fetchPromise);
    fetchPromise.finally(() => {
      inflightRequests.delete(cacheKey);
    });
  }

  return fetchPromise;
}
