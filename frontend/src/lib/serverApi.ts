// Server-side data fetching for server components.
// NEXT_PUBLIC_API_URL is the relative "/api" in production (for the browser), which Node's fetch
// cannot resolve, so server components talk to the API directly on its internal port.
const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || '';
export const SERVER_API_URL =
  process.env.INTERNAL_API_URL || (PUBLIC_API.startsWith('http') ? PUBLIC_API : 'http://127.0.0.1:4001/api');

/** GET an API path on the server; returns `fallback` on any failure so pages still render (client refetches). */
export async function serverGet<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
