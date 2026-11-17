const I18N = {
  ar: {
    siteTitle: "عروض ستيم",
    tagline: "اكتشف أفضل التخفيضات على متجر ستيم — أسعار حقيقية وروابط شراء مباشرة",
    tabDeals: "🔥 العروض الحالية",
    tabSearch: "🔎 البحث عن لعبة",
    searchPlaceholder: "اكتب اسم اللعبة...",
    searchBtn: "بحث",
    budgetLabel: "الميزانية ($):",
    loading: "جارٍ جلب البيانات من ستيم...",
    noResults: "لا توجد نتائج مطابقة.",
    free: "مجانية",
    footer: "الأسعار من متجر ستيم الرسمي بالدولار الأمريكي — الشراء يتم مباشرة عبر ستيم",
    errorFetch: "تعذر جلب البيانات. حاول مرة أخرى.",
    errorServer: "تعذر الاتصال بالسيرفر. تأكد أنه يعمل.",
  },
  en: {
    siteTitle: "Steam Deals",
    tagline: "Discover the best discounts on the Steam store — real prices, direct buy links",
    tabDeals: "🔥 Current Deals",
    tabSearch: "🔎 Search a Game",
    searchPlaceholder: "Type a game name...",
    searchBtn: "Search",
    budgetLabel: "Budget ($):",
    loading: "Fetching data from Steam...",
    noResults: "No matching results.",
    free: "Free",
    footer: "Prices from the official Steam store in USD — purchases happen directly on Steam",
    errorFetch: "Failed to fetch data. Try again.",
    errorServer: "Cannot reach the server. Make sure it is running.",
  },
};

let lang = localStorage.getItem("lang") || "ar";
let currentGames = [];

const el = (id) => document.getElementById(id);
const statusEl = el("status");
const gamesSection = el("games-section");
const gamesGrid = el("games-grid");

function t(key) {
  return I18N[lang][key] || key;
}

function applyLanguage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = lang === "ar" ? "عروض ستيم" : "Steam Deals";

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  el("lang-toggle").textContent = lang === "ar" ? "English" : "العربية";
  localStorage.setItem("lang", lang);
}

function showStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.classList.remove("hidden", "error");
  if (isError) statusEl.classList.add("error");
  gamesSection.classList.add("hidden");
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function passesBudget(game) {
  const budget = parseFloat(el("budget").value);
  if (isNaN(budget) || budget <= 0) return true;
  if (game.finalPrice == null) return game.initialPrice != null && game.initialPrice <= budget;
  return game.finalPrice <= budget;
}

function renderGames() {
  const visible = currentGames.filter(passesBudget);
  gamesGrid.innerHTML = "";

  if (visible.length === 0) {
    showStatus(t("noResults"), false);
    return;
  }

  statusEl.classList.add("hidden");
  gamesSection.classList.remove("hidden");

  for (const game of visible) {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `https://store.steampowered.com/app/${game.appid}/?l=${lang === "ar" ? "arabic" : "english"}`;
    card.target = "_blank";
    card.rel = "noopener";

    if (game.image) {
      const img = document.createElement("img");
      img.src = game.image;
      img.alt = game.name;
      img.loading = "lazy";
      card.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "game-info";

    const name = document.createElement("div");
    name.className = "game-name";
    name.textContent = game.name;
    name.title = game.name;
    info.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "game-meta";
    if (game.discountPercent > 0) {
      const badge = document.createElement("span");
      badge.className = "discount-badge";
      badge.textContent = `-${game.discountPercent}%`;
      meta.appendChild(badge);
    }
    if (game.metascore) {
      const score = document.createElement("span");
      score.className = "metascore";
      score.textContent = `Metascore ${game.metascore}`;
      meta.appendChild(score);
    }
    info.appendChild(meta);

    const price = document.createElement("div");
    price.className = "price";
    if (game.finalPrice === 0) {
      const free = document.createElement("span");
      free.className = "free";
      free.textContent = t("free");
      price.appendChild(free);
    } else if (game.finalPrice != null) {
      if (game.discountPercent > 0 && game.initialPrice != null) {
        const original = document.createElement("span");
        original.className = "original";
        original.textContent = formatPrice(game.initialPrice);
        price.appendChild(original);
      }
      const final = document.createElement("span");
      final.className = "final";
      final.textContent = formatPrice(game.finalPrice);
      price.appendChild(final);
    }
    info.appendChild(price);

    card.appendChild(info);
    gamesGrid.appendChild(card);
  }
}

async function loadDeals() {
  showStatus(t("loading"), false);
  try {
    const res = await fetch(`/api/deals?lang=${lang}`);
    const data = await res.json();
    if (!res.ok) {
      showStatus(data.error || t("errorFetch"), true);
      return;
    }
    currentGames = data.games;
    renderGames();
  } catch {
    showStatus(t("errorServer"), true);
  }
}

async function loadSearch() {
  const term = el("search-input").value.trim();
  if (term.length < 2) return;

  showStatus(t("loading"), false);
  try {
    const res = await fetch(`/api/search?term=${encodeURIComponent(term)}&lang=${lang}`);
    const data = await res.json();
    if (!res.ok) {
      showStatus(data.error || t("errorFetch"), true);
      return;
    }
    currentGames = data.games;
    renderGames();
  } catch {
    showStatus(t("errorServer"), true);
  }
}

function switchTab(activeTab) {
  const isDeals = activeTab === "deals";
  el("tab-deals").classList.toggle("active", isDeals);
  el("tab-search").classList.toggle("active", !isDeals);
  el("search-box").classList.toggle("hidden", isDeals);
  if (isDeals) loadDeals();
  else {
    currentGames = [];
    gamesSection.classList.add("hidden");
    statusEl.classList.add("hidden");
  }
}

el("lang-toggle").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLanguage();
  if (!el("tab-deals").classList.contains("active")) return;
  loadDeals();
});

el("tab-deals").addEventListener("click", () => switchTab("deals"));
el("tab-search").addEventListener("click", () => switchTab("search"));
el("search-btn").addEventListener("click", loadSearch);
el("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadSearch();
});
el("budget").addEventListener("input", () => {
  if (currentGames.length > 0) renderGames();
});

applyLanguage();
loadDeals();
