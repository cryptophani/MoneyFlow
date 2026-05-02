const STORAGE_KEYS = {
  preset: "moneyflow:preset",
  minQuality: "moneyflow:minQuality",
  approved: "moneyflow:approved",
  muted: "moneyflow:muted",
};

const appState = {
  preset: loadString(STORAGE_KEYS.preset, "discovery"),
  minQuality: loadNumber(STORAGE_KEYS.minQuality, 25),
  approved: new Set(loadArray(STORAGE_KEYS.approved)),
  muted: new Set(loadArray(STORAGE_KEYS.muted)),
  snapshot: null,
  history: [],
  research: null,
  results: null,
  analytics: null,
  discovery: null,
  fallbackSnapshot: null,
};

const fallbackSnapshot = {
  updatedAt: "May 01, 2026, 10:40 UTC",
  preset: "discovery",
  threshold: "7.00%",
  balance: "$100.00",
  bestEdge: "8.40%",
  avgEdge: "7.27%",
  signalCount: 3,
  strictSignalCount: 3,
  probeSignalCount: 0,
  marketCount: 3,
  confidence: "73/99",
  maxPosition: "$25.00",
  pill: "Minimal paper-trading desk in demo mode",
  source: "demo",
  demoMode: true,
  stale: false,
  signals: [
    {
      market: "Will the Fed cut rates before September?",
      slug: "fed-cut-before-september",
      side: "YES",
      edge: 0.084,
      size_usdc: 25,
      expiry: "Aug 20, 2026",
      category: "macro",
      strategy: "consensus-fade",
      rationale: "Macro | consensus fade | fading an over-extended rates narrative",
      quality_score: 82,
      market_quality: 76,
      setup_quality: 88,
      trade_tier: "A",
      flags: [],
      is_probe: false,
    },
    {
      market: "Will Gavin Newsom enter the 2028 race before Labor Day?",
      slug: "newsom-2028-before-labor-day",
      side: "NO",
      edge: 0.071,
      size_usdc: 18.5,
      expiry: "Sep 08, 2026",
      category: "politics",
      strategy: "consensus-fade",
      rationale: "Politics | consensus fade | procedural reality lags headline momentum",
      quality_score: 71,
      market_quality: 69,
      setup_quality: 74,
      trade_tier: "B",
      flags: ["Headline risk"],
      is_probe: false,
    },
    {
      market: "Will Cannes Palme d'Or go to a first-time winner?",
      slug: "cannes-palme-first-time-winner",
      side: "YES",
      edge: 0.063,
      size_usdc: 14,
      expiry: "May 24, 2026",
      category: "awards",
      strategy: "event-specialist",
      rationale: "Awards | event specialist | specialist information edge around festival reactions",
      quality_score: 64,
      market_quality: 62,
      setup_quality: 66,
      trade_tier: "C",
      flags: ["Seasonal liquidity"],
      is_probe: false,
    },
  ],
  markets: [
    { title: "Will the Fed cut rates before September?", volume: "$240,000", yes: "YES 0.53", category: "macro" },
    { title: "Will Gavin Newsom enter the 2028 race before Labor Day?", volume: "$175,000", yes: "YES 0.38", category: "politics" },
    { title: "Will Cannes Palme d'Or go to a first-time winner?", volume: "$132,000", yes: "YES 0.52", category: "awards" },
  ],
  activity: [
    { time: "10:40 UTC", title: "Focused desk loaded", detail: "Scanner is limited to politics, macro, and awards." },
    { time: "10:40 UTC", title: "Research queue seeded", detail: "Demo data is available even before live Exa research resolves." },
    { time: "10:40 UTC", title: "Paper trading only", detail: "This deploy does not place live orders." },
  ],
};

const fallbackResearch = {
  updatedAt: "May 01, 2026, 10:40 UTC",
  source: "demo",
  stale: false,
  demoMode: true,
  briefs: [
    {
      category: "macro",
      strategy: "consensus-fade",
      conviction: "Active",
      impactScore: 84,
      updatedAt: "May 01, 2026, 10:40 UTC",
      headline: "Fed path looks cleaner than the crowd narrative suggests",
      thesis:
        "Short-dated rates markets often overshoot after one loud print. The better setup is usually to wait for the crowd to over-commit, then fade into the next catalyst.",
      risk: "A genuine regime break in inflation or labor data can invalidate the fade immediately.",
      watchSignals: ["CPI surprise versus consensus", "Fed speaker tone shift", "2Y Treasury move after the release"],
      citations: [{ title: "Federal Reserve", url: "https://www.federalreserve.gov/", source: "federalreserve.gov" }],
    },
    {
      category: "politics",
      strategy: "consensus-fade",
      conviction: "Prepare",
      impactScore: 71,
      updatedAt: "May 01, 2026, 10:40 UTC",
      headline: "Narrative-heavy races are usually mispriced before procedural dates",
      thesis:
        "Politics markets move fast on headlines and much slower on filing deadlines, ballot mechanics, and donor constraints. The edge is usually in respecting the process more than the noise.",
      risk: "A sudden endorsement cascade or legal shock can justify the consensus move.",
      watchSignals: ["Official filing deadlines", "Delegate math changes", "Large donor and endorsement moves"],
      citations: [{ title: "AP News Politics", url: "https://apnews.com/politics", source: "apnews.com" }],
    },
    {
      category: "awards",
      strategy: "event-specialist",
      conviction: "Monitor",
      impactScore: 63,
      updatedAt: "May 01, 2026, 10:40 UTC",
      headline: "Awards edges come from information timing, not broad market activity",
      thesis:
        "Festival reactions, guild momentum, and campaign sequencing matter before public narratives catch up. The edge is small but real if the category is treated as a specialist lane.",
      risk: "Seasonal markets can stay noisy and illiquid for long stretches.",
      watchSignals: ["Festival jury reactions", "Guild nomination surprises", "Distributor campaign shifts"],
      citations: [{ title: "Variety Awards", url: "https://variety.com/v/awards/", source: "variety.com" }],
    },
  ],
};

const fallbackResults = {
  summary: {
    totalBets: 12,
    openBets: 4,
    resolvedBets: 8,
    wins: 5,
    winRate: 0.625,
    totalPnl: 18.4,
  },
  recent: [
    {
      openedAt: "May 01, 2026, 09:20 UTC",
      market: "Will the Fed cut rates before September?",
      side: "YES",
      category: "macro",
      strategy: "consensus-fade",
      edge: 0.084,
      entryPrice: 0.53,
      sizeUsdc: 25,
      status: "resolved",
      pnl: 6.1,
      confidence: 84,
    },
    {
      openedAt: "Apr 28, 2026, 14:05 UTC",
      market: "Will Gavin Newsom enter the 2028 race before Labor Day?",
      side: "NO",
      category: "politics",
      strategy: "consensus-fade",
      edge: 0.071,
      entryPrice: 0.62,
      sizeUsdc: 18.5,
      status: "open",
      pnl: 0,
      confidence: 71,
    },
  ],
  open: [],
};

const fallbackAnalytics = {
  updatedAt: "May 01, 2026, 10:40 UTC",
  summary: {
    totalBets: 12,
    resolvedBets: 8,
    openBets: 4,
    openExposure: 43.5,
    avgOpenEdge: 0.071,
    avgResolvedPnl: 2.3,
    strictOpenCount: 3,
    probeOpenCount: 1,
  },
  byCategory: [
    { key: "macro", totalBets: 5, openBets: 1, resolvedBets: 4, wins: 3, winRate: 0.75, totalPnl: 9.8, exposure: 25, avgEdge: 0.082 },
    { key: "politics", totalBets: 4, openBets: 2, resolvedBets: 2, wins: 1, winRate: 0.5, totalPnl: 4.1, exposure: 18.5, avgEdge: 0.071 },
    { key: "awards", totalBets: 3, openBets: 1, resolvedBets: 2, wins: 1, winRate: 0.5, totalPnl: 4.5, exposure: 0, avgEdge: 0.063 },
  ],
  byStrategy: [
    { key: "consensus-fade", totalBets: 8, openBets: 3, resolvedBets: 5, wins: 4, winRate: 0.8, totalPnl: 13.9, exposure: 31, avgEdge: 0.079 },
    { key: "event-specialist", totalBets: 3, openBets: 1, resolvedBets: 2, wins: 1, winRate: 0.5, totalPnl: 4.5, exposure: 12.5, avgEdge: 0.063 },
    { key: "liquidity-reversion", totalBets: 1, openBets: 0, resolvedBets: 1, wins: 0, winRate: 0, totalPnl: 0, exposure: 0, avgEdge: 0.03 },
  ],
  byPriceBand: [],
  insights: [
    "Open exposure is capped while resolved history is still thin.",
    "Macro is leading the current book quality.",
    "Consensus-fade is the strongest lane so far.",
    "The desk should still size cautiously until more bets resolve.",
  ],
};

const fallbackDiscovery = {
  query: "election",
  updatedAt: "May 02, 2026, 09:00 UTC",
  source: "demo",
  results: [],
};

const fallbackSourcePreview = {
  title: "Source preview unavailable",
  host: "moneyflow-desk.everyai-com.workers.dev",
  description: "Select a citation from the research queue to inspect the linked source directly.",
  excerpt: "",
};

function loadString(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadNumber(key, fallback) {
  const value = Number.parseInt(loadString(key, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function loadArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function saveArray(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {}
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function text(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function money(value) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : value;
}

function percent(value) {
  return typeof value === "number" ? `${(value * 100).toFixed(2)}%` : value;
}

function signalKey(signal) {
  return `${signal.slug ?? signal.market}:${signal.side}:${signal.strategy}`;
}

function isApproved(signal) {
  return appState.approved.has(signalKey(signal));
}

function isMuted(signal) {
  return appState.muted.has(signalKey(signal));
}

function filteredSignals(snapshot) {
  return (snapshot?.signals ?? []).filter((signal) => !isMuted(signal) && (signal.quality_score ?? 0) >= appState.minQuality);
}

function renderOperatorState(snapshot) {
  const approvedVisible = (snapshot?.signals ?? []).filter(isApproved).length;
  const mutedVisible = (snapshot?.signals ?? []).filter(isMuted).length;
  text("[data-current-preset]", capitalize(appState.preset));
  text("[data-quality-value]", String(appState.minQuality));
  text("[data-approved-count]", `${approvedVisible} approved`);
  text("[data-muted-count]", `${mutedVisible} muted`);
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.classList.toggle("preset-active", button.getAttribute("data-preset") === appState.preset);
  });
}

function renderSnapshot(snapshot) {
  const activeSnapshot =
    snapshot?.signalCount === 0 && appState.preset !== "discovery" && appState.fallbackSnapshot?.signalCount > 0
      ? {
          ...appState.fallbackSnapshot,
          pill: `${capitalize(appState.preset)} is quiet. Showing discovery probes so the desk stays usable.`,
        }
      : snapshot;

  appState.snapshot = activeSnapshot;
  let visibleSignals = filteredSignals(activeSnapshot);
  const relaxedProbeFallback =
    !visibleSignals.length &&
    (activeSnapshot?.signals?.length ?? 0) > 0 &&
    (activeSnapshot?.preset === "discovery" || activeSnapshot?.signals?.every((signal) => signal.is_probe));
  if (relaxedProbeFallback) {
    visibleSignals = activeSnapshot.signals.slice(0, 6);
  }
  text("[data-updated]", `Updated ${activeSnapshot.updatedAt}`);
  text("[data-updated-inline]", activeSnapshot.updatedAt);
  text("[data-pill]", activeSnapshot.pill);
  text("[data-best-edge]", activeSnapshot.bestEdge ?? percent(activeSnapshot.signals?.[0]?.edge ?? 0));
  text("[data-average-edge]", activeSnapshot.avgEdge);
  text("[data-signal-count]", String(visibleSignals.length));
  text("[data-strict-probe]", `${activeSnapshot.strictSignalCount ?? 0} / ${activeSnapshot.probeSignalCount ?? 0}`);
  text("[data-market-count]", String(activeSnapshot.marketCount));
  text("[data-confidence]", activeSnapshot.confidence);
  text("[data-max-position]", activeSnapshot.maxPosition);
  text("[data-threshold]", activeSnapshot.threshold);
  text("[data-balance]", activeSnapshot.balance);
  renderOperatorState(activeSnapshot);

  const banner = document.getElementById("banner-text");
  if (banner) {
    banner.textContent = activeSnapshot.demoMode
      ? "Serving seeded demo data while the live scan or research layer warms up."
      : activeSnapshot.stale
        ? "Serving the last successful stored snapshot while live upstream data recovers."
        : snapshot?.signalCount === 0 && appState.preset !== "discovery" && appState.fallbackSnapshot?.signalCount > 0
          ? `Live ${capitalize(appState.preset)} scan found no qualified ideas, so discovery probes are shown instead.`
          : relaxedProbeFallback
            ? "Discovery probes are shown even though they sit below your current quality floor, so the desk does not appear empty."
          : `Live ${capitalize(appState.preset)} scan complete. Visible rows are filtered by your quality floor and mute list.`;
  }

  const signalsBody = document.getElementById("signals-body");
  if (!signalsBody) return;

  if (!visibleSignals.length) {
    signalsBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          No visible idea clears your current quality floor in ${escapeHtml(appState.preset)} mode. That is acceptable if the desk is protecting capital.
        </td>
      </tr>
    `;
  } else {
    signalsBody.innerHTML = visibleSignals
      .map(
        (signal) => `
        <tr>
          <td>${escapeHtml(signal.market)}</td>
          <td><span class="cell-chip">${escapeHtml(signal.category)}</span></td>
          <td>${escapeHtml(signal.strategy)}</td>
          <td class="${signal.side === "YES" ? "side-yes" : "side-no"}">${escapeHtml(signal.side)}</td>
          <td><span class="tier tier-${String(signal.trade_tier).toLowerCase()}">${escapeHtml(signal.trade_tier)}</span></td>
          <td>${percent(signal.edge)}</td>
          <td>
            <strong>${escapeHtml(String(signal.quality_score ?? "—"))}</strong>
            <div class="quality-breakdown">M ${escapeHtml(String(signal.market_quality ?? "—"))} / S ${escapeHtml(String(signal.setup_quality ?? "—"))}</div>
          </td>
          <td>${money(signal.size_usdc)}</td>
          <td>${escapeHtml(signal.expiry)}</td>
          <td>
            <div>${escapeHtml(signal.rationale ?? "—")}</div>
            <div class="flag-list">${(signal.flags ?? []).map((flag) => `<span class="watch-chip">${escapeHtml(flag)}</span>`).join("")}</div>
          </td>
          <td>
            <div class="action-stack">
              <button class="mini-button ${isApproved(signal) ? "mini-active" : ""}" type="button" data-approve="${escapeHtml(signalKey(signal))}">
                ${isApproved(signal) ? "Approved" : "Approve"}
              </button>
              <button class="mini-button" type="button" data-mute="${escapeHtml(signalKey(signal))}">Mute</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("");
  }

  document.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => toggleApproval(button.getAttribute("data-approve")));
  });
  document.querySelectorAll("[data-mute]").forEach((button) => {
    button.addEventListener("click", () => muteSignal(button.getAttribute("data-mute")));
  });

  const scannerList = document.getElementById("scanner-list");
  if (scannerList) {
    scannerList.innerHTML = (activeSnapshot.markets ?? [])
      .map(
        (market) => `
        <article class="stack-item">
          <div>
            <p class="stack-title">${escapeHtml(market.title)}</p>
            <p class="stack-detail">${escapeHtml(market.yes)}</p>
          </div>
          <div class="stack-meta">
            <span>${escapeHtml(market.category ?? "other")}</span>
            <strong>${escapeHtml(market.volume)}</strong>
          </div>
        </article>
      `,
      )
      .join("");
  }

  const activityList = document.getElementById("activity-list");
  if (activityList) {
    activityList.innerHTML = (activeSnapshot.activity ?? [])
      .map(
        (event) => `
        <article class="stack-item">
          <div>
            <p class="stack-title">${escapeHtml(event.title)}</p>
            <p class="stack-detail">${escapeHtml(event.detail)}</p>
          </div>
          <div class="stack-meta">
            <span>${escapeHtml(event.time)}</span>
          </div>
        </article>
      `,
      )
      .join("");
  }
}

function renderResearch(research) {
  appState.research = research;
  text("[data-research-updated]", research.updatedAt ?? "—");

  const researchFeed = document.getElementById("research-feed");
  const strategyCards = document.getElementById("strategy-cards");
  if (!researchFeed || !strategyCards) return;

  const briefs = research.briefs ?? [];

  researchFeed.innerHTML = briefs
    .map(
      (brief) => `
      <article class="research-card">
        <div class="research-card-head">
          <span class="cell-chip">${escapeHtml(brief.category)}</span>
          <span class="impact-score">${escapeHtml(String(brief.impactScore))}</span>
        </div>
        <h4>${escapeHtml(brief.headline)}</h4>
        <p class="research-thesis">${escapeHtml(brief.thesis)}</p>
        <p class="research-risk"><strong>Risk:</strong> ${escapeHtml(brief.risk)}</p>
        <div class="watch-list">
          ${(brief.watchSignals ?? []).map((signal) => `<span class="watch-chip">${escapeHtml(signal)}</span>`).join("")}
        </div>
        <div class="citation-list">
          ${(brief.citations ?? [])
            .map(
              (citation) => `
              <button
                type="button"
                class="citation-button"
                data-source-url="${escapeHtml(citation.url)}"
                data-source-label="${escapeHtml(citation.source)}"
              >
                ${escapeHtml(citation.source)}
              </button>
            `,
            )
            .join("")}
        </div>
      </article>
    `,
    )
    .join("");

  document.querySelectorAll("[data-source-url]").forEach((button) => {
    button.addEventListener("click", async () => {
      const url = button.getAttribute("data-source-url");
      const label = button.getAttribute("data-source-label") ?? "source";
      if (!url) return;
      await loadSourcePreview(url, label);
    });
  });

  strategyCards.innerHTML = briefs
    .map(
      (brief) => `
      <article class="strategy-card">
        <div class="strategy-topline">
          <span class="cell-chip">${escapeHtml(brief.strategy)}</span>
          <span class="strategy-conviction strategy-${String(brief.conviction).toLowerCase()}">${escapeHtml(brief.conviction)}</span>
        </div>
        <h4>${escapeHtml(brief.category)}</h4>
        <p class="strategy-score">${escapeHtml(String(brief.impactScore))}<span>/99</span></p>
        <p class="strategy-copy">${escapeHtml(brief.headline)}</p>
        <p class="strategy-risk">${escapeHtml(brief.risk)}</p>
      </article>
    `,
    )
    .join("");
}

function renderHistory(history) {
  appState.history = history;
  const historyTable = document.getElementById("history-table");
  if (!historyTable) return;
  historyTable.innerHTML = (history ?? [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.createdAt)}</td>
        <td>${escapeHtml(item.source)}</td>
        <td>${escapeHtml(String(item.signalCount))}</td>
        <td>${escapeHtml(String(item.marketCount))}</td>
        <td>${item.demoMode ? "Demo" : "Live"}</td>
      </tr>
    `,
    )
    .join("");
}

function renderResults(results) {
  appState.results = results;
  const summary = results?.summary ?? fallbackResults.summary;
  text("[data-total-bets]", String(summary.totalBets ?? 0));
  text("[data-resolved-bets]", String(summary.resolvedBets ?? 0));
  text("[data-win-rate]", percent(summary.winRate ?? 0));
  text("[data-total-pnl]", money(summary.totalPnl ?? 0));

  const resultsTable = document.getElementById("results-table");
  if (!resultsTable) return;

  const rows = [...(results?.recent ?? []), ...(results?.open ?? [])].slice(0, 20);
  if (!rows.length) {
    resultsTable.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No paper bets have been captured yet. Run a few live scans and the results book will populate automatically.
        </td>
      </tr>
    `;
    return;
  }

  resultsTable.innerHTML = rows
    .map(
      (bet) => `
      <tr>
        <td>${escapeHtml(bet.openedAt ?? "—")}</td>
        <td>${escapeHtml(bet.market ?? "—")}</td>
        <td class="${bet.side === "YES" ? "side-yes" : "side-no"}">${escapeHtml(bet.side ?? "—")}</td>
        <td><span class="cell-chip">${escapeHtml(bet.category ?? "other")}</span></td>
        <td>${typeof bet.entryPrice === "number" ? bet.entryPrice.toFixed(3) : "—"}</td>
        <td>${money(bet.sizeUsdc ?? 0)}</td>
        <td>${escapeHtml(bet.status ?? "open")}</td>
        <td class="${(bet.pnl ?? 0) >= 0 ? "pnl-positive" : "pnl-negative"}">${money(bet.pnl ?? 0)}</td>
      </tr>
    `,
    )
    .join("");
}

function renderAnalytics(analytics) {
  appState.analytics = analytics;
  const summary = analytics?.summary ?? fallbackAnalytics.summary;
  const summaryNode = document.getElementById("analytics-summary");
  if (summaryNode) {
    summaryNode.innerHTML = `
      <article class="mini-stat"><span class="metric-label">Open exposure</span><strong>${money(summary.openExposure ?? 0)}</strong></article>
      <article class="mini-stat"><span class="metric-label">Avg open edge</span><strong>${percent(summary.avgOpenEdge ?? 0)}</strong></article>
      <article class="mini-stat"><span class="metric-label">Avg resolved P&amp;L</span><strong>${money(summary.avgResolvedPnl ?? 0)}</strong></article>
      <article class="mini-stat"><span class="metric-label">Strict / Probe open</span><strong>${summary.strictOpenCount ?? 0} / ${summary.probeOpenCount ?? 0}</strong></article>
    `;
  }

  const insights = document.getElementById("insight-list");
  if (insights) {
    insights.innerHTML = (analytics?.insights ?? fallbackAnalytics.insights)
      .map((item) => `<article class="insight-item">${escapeHtml(item)}</article>`)
      .join("");
  }

  renderBucketTable("analytics-category-table", analytics?.byCategory ?? fallbackAnalytics.byCategory);
  renderBucketTable("analytics-strategy-table", analytics?.byStrategy ?? fallbackAnalytics.byStrategy);
}

function renderDiscovery(discovery) {
  appState.discovery = discovery;
  const node = document.getElementById("discovery-results");
  if (!node) return;

  const rows = discovery?.results ?? [];
  if (!rows.length) {
    node.innerHTML = `
      <article class="stack-item">
        <div>
          <p class="stack-title">No discovery results</p>
          <p class="stack-detail">Gamma public search did not return active events for this query.</p>
        </div>
        <div class="stack-meta">
          <span>${escapeHtml(discovery?.query ?? "search")}</span>
        </div>
      </article>
    `;
    return;
  }

  node.innerHTML = rows
    .map(
      (item) => `
      <article class="stack-item discovery-item">
        <div>
          <p class="stack-title">${escapeHtml(item.title)}</p>
          <p class="stack-detail">${escapeHtml((item.context || item.description || "").slice(0, 220))}</p>
          <div class="flag-list">
            ${(item.tags ?? []).slice(0, 4).map((tag) => `<span class="watch-chip">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
        <div class="stack-meta">
          <span>${money(item.volume24hr ?? 0)} 24h</span>
          <strong>${money(item.volume ?? 0)} vol</strong>
          <a href="${escapeHtml(item.eventUrl)}" target="_blank" rel="noreferrer">Open</a>
        </div>
      </article>
    `,
    )
    .join("");
}

function renderBucketTable(id, rows) {
  const table = document.getElementById(id);
  if (!table) return;
  table.innerHTML = (rows ?? [])
    .slice(0, 6)
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.key)}</td>
        <td>${escapeHtml(String(row.totalBets))}</td>
        <td>${escapeHtml(String(row.openBets))}</td>
        <td>${percent(row.winRate ?? 0)}</td>
        <td class="${(row.totalPnl ?? 0) >= 0 ? "pnl-positive" : "pnl-negative"}">${money(row.totalPnl ?? 0)}</td>
      </tr>
    `,
    )
    .join("");
}

function renderSourcePreview(preview, label) {
  const statusNode = document.querySelector("[data-source-status]");
  if (statusNode) {
    statusNode.textContent = label ? `Inspecting ${label}` : "Source preview loaded";
  }

  const container = document.getElementById("source-preview");
  if (!container) return;

  container.classList.remove("empty-state");
  container.innerHTML = `
    <div class="source-preview-head">
      <p class="metric-label">${escapeHtml(preview.host ?? fallbackSourcePreview.host)}</p>
      <a href="${escapeHtml(preview.url ?? "#")}" target="_blank" rel="noreferrer">Open source</a>
    </div>
    <h4>${escapeHtml(preview.title ?? fallbackSourcePreview.title)}</h4>
    <p class="source-preview-copy">${escapeHtml(preview.description ?? fallbackSourcePreview.description)}</p>
    ${
      preview.publishedAt
        ? `<p class="source-preview-meta">Published ${escapeHtml(preview.publishedAt)}</p>`
        : ""
    }
    ${
      preview.excerpt
        ? `<p class="source-preview-excerpt">${escapeHtml(preview.excerpt)}</p>`
        : ""
    }
  `;
}

async function loadSourcePreview(url, label) {
  const statusNode = document.querySelector("[data-source-status]");
  if (statusNode) {
    statusNode.textContent = `Loading ${label}…`;
  }

  try {
    const preview = await fetchJson(`/api/source-preview?url=${encodeURIComponent(url)}`);
    renderSourcePreview(preview, label);
  } catch {
    renderSourcePreview(
      {
        ...fallbackSourcePreview,
        url,
        host: label,
        description: "The linked page could not be previewed from the Worker, but the direct link is still available.",
      },
      label,
    );
  }
}

function toggleApproval(key) {
  if (!key) return;
  if (appState.approved.has(key)) {
    appState.approved.delete(key);
  } else {
    appState.approved.add(key);
  }
  saveArray(STORAGE_KEYS.approved, appState.approved);
  renderSnapshot(appState.snapshot ?? fallbackSnapshot);
}

function muteSignal(key) {
  if (!key) return;
  appState.muted.add(key);
  saveArray(STORAGE_KEYS.muted, appState.muted);
  renderSnapshot(appState.snapshot ?? fallbackSnapshot);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }
  return response.json();
}

async function loadAll() {
  try {
    const discoveryQuery = document.getElementById("discovery-query")?.value?.trim() || "election";
    const [snapshot, fallbackSnapshot, historyPayload, research, results, analytics, discovery] = await Promise.all([
      fetchJson(`/api/snapshot?preset=${encodeURIComponent(appState.preset)}`),
      appState.preset === "discovery" ? Promise.resolve(null) : fetchJson("/api/snapshot?preset=discovery"),
      fetchJson("/api/history"),
      fetchJson("/api/research"),
      fetchJson("/api/results"),
      fetchJson("/api/analytics"),
      fetchJson(`/api/discovery?q=${encodeURIComponent(discoveryQuery)}`),
    ]);

    appState.fallbackSnapshot = fallbackSnapshot;
    renderSnapshot(snapshot);
    renderHistory(historyPayload.history ?? []);
    renderResearch(research);
    renderResults(results);
    renderAnalytics(analytics);
    renderDiscovery(discovery);
  } catch {
    appState.fallbackSnapshot = null;
    renderSnapshot(fallbackSnapshot);
    renderHistory([]);
    renderResearch(fallbackResearch);
    renderResults(fallbackResults);
    renderAnalytics(fallbackAnalytics);
    renderDiscovery(fallbackDiscovery);
  }
}

document.getElementById("refresh-scan")?.addEventListener("click", async () => {
  try {
    const [payload, fallbackSnapshot] = await Promise.all([
      fetchJson(`/api/scan?preset=${encodeURIComponent(appState.preset)}`),
      appState.preset === "discovery" ? Promise.resolve(null) : fetchJson("/api/snapshot?preset=discovery"),
    ]);
    appState.fallbackSnapshot = fallbackSnapshot;
    renderSnapshot(payload.snapshot ?? fallbackSnapshot);
    renderResearch(payload.research ?? fallbackResearch);
    renderResults(payload.results ?? fallbackResults);
    renderAnalytics(payload.analytics ?? fallbackAnalytics);
    const history = await fetchJson("/api/history");
    renderHistory(history.history ?? []);
  } catch {
    appState.fallbackSnapshot = null;
    renderSnapshot(fallbackSnapshot);
    renderResearch(fallbackResearch);
    renderResults(fallbackResults);
    renderAnalytics(fallbackAnalytics);
  }
});

document.getElementById("refresh-research")?.addEventListener("click", async () => {
  try {
    const research = await fetchJson("/api/research/refresh");
    renderResearch(research);
  } catch {
    renderResearch(fallbackResearch);
  }
});

document.getElementById("run-discovery")?.addEventListener("click", async () => {
  const query = document.getElementById("discovery-query")?.value?.trim() || "election";
  try {
    const discovery = await fetchJson(`/api/discovery?q=${encodeURIComponent(query)}`);
    renderDiscovery(discovery);
  } catch {
    renderDiscovery({ ...fallbackDiscovery, query });
  }
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", async () => {
    appState.preset = button.getAttribute("data-preset") ?? "strict";
    saveString(STORAGE_KEYS.preset, appState.preset);
    await loadAll();
  });
});

document.getElementById("quality-filter")?.addEventListener("input", (event) => {
  const value = Number.parseInt(event.target.value, 10);
  appState.minQuality = Number.isFinite(value) ? value : 60;
  saveString(STORAGE_KEYS.minQuality, String(appState.minQuality));
  renderSnapshot(appState.snapshot ?? fallbackSnapshot);
});

renderSnapshot(fallbackSnapshot);
renderResearch(fallbackResearch);
renderHistory([]);
renderResults(fallbackResults);
renderAnalytics(fallbackAnalytics);
renderDiscovery(fallbackDiscovery);
renderSourcePreview({ ...fallbackSourcePreview, url: "#" });
loadAll();

function capitalize(value) {
  return String(value ?? "").charAt(0).toUpperCase() + String(value ?? "").slice(1);
}
