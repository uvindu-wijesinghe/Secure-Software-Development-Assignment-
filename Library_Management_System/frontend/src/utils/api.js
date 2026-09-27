const defaultApiBase = 'http://localhost:8000';
const apiBase = (process.env.REACT_APP_API_URL || defaultApiBase).replace(/\/$/, '');

export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export { apiBase };
