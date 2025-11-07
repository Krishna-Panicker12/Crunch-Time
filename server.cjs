// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));

function isAllowedUrl(url) {
  const allowedPrefixes = [
    "https://github.com/nflverse/nflverse-data/releases/download/",
    "https://objects.githubusercontent.com/",
  ];
  return allowedPrefixes.some((p) => url.startsWith(p));
}

app.get("/api/nfl-csv", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing 'url'" });
  if (!isAllowedUrl(url)) return res.status(400).json({ error: "URL not allowed" });

  try {
    const response = await fetch(url); // built-in in Node 18+
    if (!response.ok) return res.status(response.status).json({ error: response.statusText });

    const text = await response.text();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));
