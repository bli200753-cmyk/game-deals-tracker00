const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const STEAM_BASE = "https://store.steampowered.com/api";
const UA = "Mozilla/5.0 (compatible; SteamDealsSite/1.0)";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

async function fetchSteam(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Steam API HTTP ${res.status}`);
  return res.json();
}

function normalizeGame(item, source) {
  const price = item.price || {};
  const initial = price.initial != null ? price.initial : item.original_price;
  const final = price.final != null ? price.final : item.final_price;
  return {
    appid: item.id || item.appid,
    name: item.name,
    initialPrice: initial != null ? initial / 100 : null,
    finalPrice: final != null ? final / 100 : null,
    discountPercent: item.discount_percent || 0,
    image: item.header_image || item.tiny_image || null,
    metascore: item.metascore || null,
    source,
  };
}

async function handleDeals(res, lang) {
  try {
    const data = await fetchSteam(`${STEAM_BASE}/featuredcategories/?cc=us&l=${lang}`);
    const items = (data.specials && data.specials.items) || [];
    sendJSON(res, 200, { games: items.map((i) => normalizeGame(i, "specials")) });
  } catch (err) {
    sendJSON(res, 502, { error: "تعذر الاتصال بمتجر ستيم: " + err.message });
  }
}

async function handleSearch(res, term, lang) {
  if (!term || term.trim().length < 2) {
    return sendJSON(res, 400, { error: "أدخل كلمة بحث من حرفين على الأقل." });
  }
  try {
    const data = await fetchSteam(
      `${STEAM_BASE}/storesearch/?term=${encodeURIComponent(term.trim())}&cc=us&l=${lang}`
    );
    const items = (data.items || []).filter((i) => i.type === "app");
    sendJSON(res, 200, { games: items.map((i) => normalizeGame(i, "search")) });
  } catch (err) {
    sendJSON(res, 502, { error: "تعذر الاتصال بمتجر ستيم: " + err.message });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rawLang = url.searchParams.get("lang") === "en" ? "english" : "arabic";

  if (url.pathname === "/api/deals") return handleDeals(res, rawLang);
  if (url.pathname === "/api/search") {
    return handleSearch(res, url.searchParams.get("term"), rawLang);
  }

  let filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
