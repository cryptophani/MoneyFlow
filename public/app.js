const fallbackSnapshot = {
  updatedAt: "May 01, 2026 09:09 UTC",
  threshold: "7.00%",
  balance: "$100.00",
  bestEdge: "8.40%",
  avgEdge: "7.27%",
  signalCount: 3,
  marketCount: 3,
  confidence: "73/99",
  maxPosition: "$25.00",
  pill: "Fallback preview snapshot",
  source: "demo",
  demoMode: true,
  stale: false,
  signals: [
    {
      market: "Will the Fed cut rates before September?",
      side: "YES",
      edge: 0.084,
      confidence: 84,
      entry_price: 0.528,
      size_usdc: 25,
      expiry: "Aug 20, 2026",
      status: "Demo",
    },
    {
      market: "Will ETH ETF flows stay positive this week?",
      side: "NO",
      edge: 0.071,
      confidence: 71,
      entry_price: 0.621,
      size_usdc: 18.5,
      expiry: "May 08, 2026",
      status: "Demo",
    },
    {
      market: "Will CPI print below consensus next release?",
      side: "YES",
      edge: 0.063,
      confidence: 63,
      entry_price: 0.524,
      size_usdc: 14,
      expiry: "May 14, 2026",
      status: "Demo",
    },
  ],
  markets: [
    { title: "Will the Fed cut rates before September?", volume: "$240,000", yes: "YES 0.53" },
    { title: "Will ETH ETF flows stay positive this week?", volume: "$175,000", yes: "YES 0.38" },
    { title: "Will CPI print below consensus next release?", volume: "$132,000", yes: "YES 0.52" },
  ],
  activity: [
    {
      time: "09:09 UTC",
      title: "Fallback data loaded",
      detail: "The frontend is operational even before the Worker API is deployed.",
    },
    {
      time: "09:09 UTC",
      title: "Cloudflare API pending",
      detail: "Deploy the Worker to start serving live snapshots from /api/snapshot.",
    },
  ],
};

function money(value) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : value;
}

function percent(value) {
  return typeof value === "number" ? `${(value * 100).toFixed(2)}%` : value;
}

function text(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function renderSnapshot(snapshot) {
  text("[data-updated]", `Updated ${snapshot.updatedAt}`);
  text("[data-best-edge]", snapshot.bestEdge ?? percent(snapshot.signals?.[0]?.edge ?? 0));
  text("[data-average-edge]", snapshot.avgEdge);
  text("[data-signal-count]", String(snapshot.signalCount));
  text("[data-market-count]", String(snapshot.marketCount));
  text("[data-confidence]", snapshot.confidence);
  text("[data-max-position]", snapshot.maxPosition);
  text("[data-threshold]", snapshot.threshold);
  text("[data-balance]", snapshot.balance);
  text("[data-pill]", snapshot.pill);

  const banner = document.getElementById("banner-text");
  if (banner) {
    banner.textContent = snapshot.demoMode
      ? "Worker is serving demo or fallback data. Deploy and enable scheduled scans for live snapshots."
      : snapshot.stale
        ? "Serving the last successful stored snapshot. A fresh live scan was not available."
        : `Cloudflare Worker is serving ${snapshot.source} snapshot data from the live scan pipeline.`;
  }

  const signalsTable = document.getElementById("signals-table");
  signalsTable.innerHTML = (snapshot.signals ?? [])
    .map(
      (signal) => `
      <tr>
        <td>${signal.market}</td>
        <td class="${signal.side === "YES" ? "direction-yes" : "direction-no"}">${signal.side}</td>
        <td>${percent(signal.edge)}</td>
        <td>${signal.confidence}</td>
        <td>${Number(signal.entry_price).toFixed(3)}</td>
        <td>${money(signal.size_usdc)}</td>
        <td>${signal.expiry}</td>
        <td><span class="status ${String(signal.status).toLowerCase()}">${signal.status}</span></td>
      </tr>
    `
    )
    .join("");

  const scanner = document.getElementById("scanner-list");
  scanner.innerHTML = (snapshot.markets ?? [])
    .map(
      (market) => `
      <div class="stack-item">
        <p class="stack-title">${market.title}</p>
        <p class="stack-meta">${market.volume}</p>
        <p class="stack-detail">${market.yes}</p>
      </div>
    `
    )
    .join("");

  const activity = document.getElementById("activity-list");
  activity.innerHTML = (snapshot.activity ?? [])
    .map(
      (event) => `
      <div class="stack-item">
        <p class="stack-meta">${event.time}</p>
        <p class="stack-title">${event.title}</p>
        <p class="stack-detail">${event.detail}</p>
      </div>
    `
    )
    .join("");
}

function renderHistory(history) {
  const historyTable = document.getElementById("history-table");
  historyTable.innerHTML = history
    .map(
      (item) => `
      <tr>
        <td>${item.createdAt}</td>
        <td>${item.source}</td>
        <td>${item.signalCount}</td>
        <td>${item.marketCount}</td>
        <td>${item.demoMode ? "Demo" : "Live"}</td>
      </tr>
    `
    )
    .join("");
}

async function loadHistory() {
  try {
    const response = await fetch("/api/history");
    if (!response.ok) return;
    const payload = await response.json();
    renderHistory(payload.history ?? []);
  } catch {
    renderHistory([]);
  }
}

async function loadSnapshot(path = "/api/snapshot") {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Snapshot request failed: ${response.status}`);
    }
    const snapshot = await response.json();
    renderSnapshot(snapshot);
  } catch {
    renderSnapshot(fallbackSnapshot);
  }
}

document.getElementById("refresh-button")?.addEventListener("click", () => {
  loadSnapshot("/api/scan");
  loadHistory();
});

renderSnapshot(fallbackSnapshot);
loadSnapshot();
loadHistory();
