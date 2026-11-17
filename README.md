# Steam Deals — عروض ستيم

موقع ثنائي اللغة (عربي / English) يعرض عروض وتخفيضات متجر ستيم الحقيقية، مع بحث وفلتر ميزانية وروابط شراء مباشرة إلى ستيم.

## Features | المميزات

- 🔥 **Current Deals** — live discount data from the official Steam store
- 🔎 **Search** — find any game with localized names (Arabic/English)
- 💰 **Budget filter** — show only games within your budget
- 🌐 **Bilingual** — full Arabic (RTL) / English (LTR) toggle, saved in localStorage
- 💵 Real USD prices from Steam, with original vs. discounted price and Metascore
- 🔗 Every card links directly to the official Steam store page

## Requirements

- Node.js 18+ (no external packages)

## Run

```bash
node server.js
```

Then open <http://localhost:3000>

To use a different port:

```bash
PORT=8080 node server.js
```

## How it works

The Node server acts as a proxy to two public Steam store endpoints (no API key needed):

| Endpoint | Steam API |
|---|---|
| `/api/deals?lang=ar\|en` | `store.steampowered.com/api/featuredcategories` (specials) |
| `/api/search?term=...&lang=ar\|en` | `store.steampowered.com/api/storesearch` |

The browser never talks to Steam directly, so there are no CORS issues.

## Project structure

```
steam-deals-site/
├── server.js          # Node proxy server (zero dependencies)
└── public/
    ├── index.html     # Bilingual UI (AR/EN)
    ├── style.css      # Steam-style dark theme
    └── app.js         # i18n, tabs, budget filter, rendering
```

## Notes

- Prices are shown in USD (`cc=us`). Change `cc` in `server.js` for another region.
- All purchases happen on Steam itself — the site only displays deals and links.
