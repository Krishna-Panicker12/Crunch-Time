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
// NOTE TO SELF: Remember to add logos of team to the compare page when the player is selected. For otmmorow the goal is to finally host the website on vercel.
// Make sure that everything functions in production
// Hide all api keys and sensitive information
// Test LLm functionality before deploying and it works in production
// Make one md file that describes all the things happening
// Leave comments