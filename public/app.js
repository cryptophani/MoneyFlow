const fallbackSnapshot = {
  updatedAt: "May 01, 2026, 10:40 UTC",
  threshold: "7.00%",
  balance: "$100.00",
  bestEdge: "8.40%",
  avgEdge: "7.27%",
  signalCount: 3,
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
      side: "YES",
      edge: 0.084,
      size_usdc: 25,
      expiry: "Aug 20, 2026",
      category: "macro",
      strategy: "consensus-fade",
      rationale: "Macro | consensus fade | fading an over-extended rates narrative",
    },
    {
      market: "Will Gavin Newsom enter the 2028 race before Labor Day?",
      side: "NO",
      edge: 0.071,
      size_usdc: 18.5,
      expiry: "Sep 08, 2026",
      category: "politics",
      strategy: "consensus-fade",
      rationale: "Politics | consensus fade | procedural reality lags headline momentum",
    },
    {
      market: "Will Cannes Palme d'Or go to a first-time winner?",
      side: "YES",
      edge: 0.063,
      size_usdc: 14,
      expiry: "May 24, 2026",
      category: "awards",
      strategy: "event-specialist",
      rationale: "Awards | event specialist | specialist information edge around festival reactions",
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

function renderSnapshot(snapshot) {
  text("[data-updated]", `Updated ${snapshot.updatedAt}`);
  text("[data-updated-inline]", snapshot.updatedAt);
  text("[data-pill]", snapshot.pill);
  text("[data-best-edge]", snapshot.bestEdge ?? percent(snapshot.signals?.[0]?.edge ?? 0));
  text("[data-average-edge]", snapshot.avgEdge);
  text("[data-signal-count]", String(snapshot.signalCount));
  text("[data-market-count]", String(snapshot.marketCount));
  text("[data-confidence]", snapshot.confidence);
  text("[data-max-position]", snapshot.maxPosition);
  text("[data-threshold]", snapshot.threshold);
  text("[data-balance]", snapshot.balance);

  const banner = document.getElementById("banner-text");
  if (banner) {
    banner.textContent = snapshot.demoMode
      ? "Serving seeded demo data while the live scan or research layer warms up."
      : snapshot.stale
        ? "Serving the last successful stored snapshot while live upstream data recovers."
        : "Live scan complete. Signals are filtered to politics, macro, and awards only.";
  }

  const signalsBody = document.getElementById("signals-body");
  if (!signalsBody) return;

  if (!snapshot.signals?.length) {
    signalsBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No paper trade is above threshold right now. The desk is still useful because the research board and focused market list stay live.
        </td>
      </tr>
    `;
  } else {
    signalsBody.innerHTML = snapshot.signals
      .map(
        (signal) => `
        <tr>
          <td>${escapeHtml(signal.market)}</td>
          <td><span class="cell-chip">${escapeHtml(signal.category)}</span></td>
          <td>${escapeHtml(signal.strategy)}</td>
          <td class="${signal.side === "YES" ? "side-yes" : "side-no"}">${escapeHtml(signal.side)}</td>
          <td>${percent(signal.edge)}</td>
          <td>${money(signal.size_usdc)}</td>
          <td>${escapeHtml(signal.expiry)}</td>
          <td>${escapeHtml(signal.rationale ?? "—")}</td>
        </tr>
      `
      )
      .join("");
  }

  const scannerList = document.getElementById("scanner-list");
  if (scannerList) {
    scannerList.innerHTML = (snapshot.markets ?? [])
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
      `
      )
      .join("");
  }

  const activityList = document.getElementById("activity-list");
  if (activityList) {
    activityList.innerHTML = (snapshot.activity ?? [])
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
      `
      )
      .join("");
  }
}

function renderResearch(research) {
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
              <a href="${escapeHtml(citation.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(citation.source)}
              </a>
            `
            )
            .join("")}
        </div>
      </article>
    `
    )
    .join("");

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
    `
    )
    .join("");
}

function renderHistory(history) {
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
    `
    )
    .join("");
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
    const [snapshot, historyPayload, research] = await Promise.all([
      fetchJson("/api/snapshot"),
      fetchJson("/api/history"),
      fetchJson("/api/research"),
    ]);

    renderSnapshot(snapshot);
    renderHistory(historyPayload.history ?? []);
    renderResearch(research);
  } catch {
    renderSnapshot(fallbackSnapshot);
    renderHistory([]);
    renderResearch(fallbackResearch);
  }
}

document.getElementById("refresh-scan")?.addEventListener("click", async () => {
  try {
    const payload = await fetchJson("/api/scan");
    renderSnapshot(payload.snapshot ?? fallbackSnapshot);
    renderResearch(payload.research ?? fallbackResearch);
    const history = await fetchJson("/api/history");
    renderHistory(history.history ?? []);
  } catch {
    renderSnapshot(fallbackSnapshot);
    renderResearch(fallbackResearch);
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

renderSnapshot(fallbackSnapshot);
renderResearch(fallbackResearch);
renderHistory([]);
loadAll();
