// src/api/proxyFetch.js

// For dev you're hitting localhost:3001.
// Later when you deploy, you'll change the PROD URL.
const PROXY_BASE =
  import.meta.env.PROD
    ? "https://your-production-backend.com" // TODO: change when you deploy
    : "http://localhost:3001";

export async function fetchCsvViaProxy(url) {
  const proxyUrl = `${PROXY_BASE}/api/nfl-csv?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Proxy error: ${res.status}`);
  }

  return res.text(); // CSV string
}