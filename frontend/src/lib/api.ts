const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// In-flight GET request deduplication: reuse pending promises for identical URLs
const inflight = new Map<string, Promise<any>>();

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

function deduplicatedGet(endpoint: string): Promise<any> {
  const existing = inflight.get(endpoint);
  if (existing) return existing;

  const promise = request(endpoint).finally(() => {
    inflight.delete(endpoint);
  });
  inflight.set(endpoint, promise);
  return promise;
}

export const api = {
  get: (endpoint: string) => deduplicatedGet(endpoint),
  post: (endpoint: string, data?: any) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data?: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
  upload: async (file: File, folder?: 'products' | 'categories' | 'settings') => {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const res = await fetch(`${API_URL}/upload${query}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  uploadMultiple: async (files: File[], folder?: 'products' | 'categories' | 'settings') => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const res = await fetch(`${API_URL}/upload/multiple${query}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
