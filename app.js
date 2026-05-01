const dashboardData = {
  updatedAt: "May 01, 2026 09:09 UTC",
  threshold: "7.00%",
  balance: "$100.00",
  bestEdge: "8.40%",
  avgEdge: "7.27%",
  signalCount: 3,
  marketCount: 3,
  confidence: "73/99",
  maxPosition: "$25.00",
  pill: "Netlify deployment preview",
  signals: [
    {
      market: "Will the Fed cut rates before September?",
      side: "YES",
      edge: "8.40%",
      confidence: 84,
      entry: "0.528",
      size: "$25.00",
      expiry: "Aug 20, 2026",
      status: "Demo",
    },
    {
      market: "Will ETH ETF flows stay positive this week?",
      side: "NO",
      edge: "7.10%",
      confidence: 71,
      entry: "0.621",
      size: "$18.50",
      expiry: "May 08, 2026",
      status: "Demo",
    },
    {
      market: "Will CPI print below consensus next release?",
      side: "YES",
      edge: "6.30%",
      confidence: 63,
      entry: "0.524",
      size: "$14.00",
      expiry: "May 14, 2026",
      status: "Demo",
    },
  ],
  markets: [
    {
      title: "Will the Fed cut rates before September?",
      volume: "$240,000",
      yes: "YES 0.53",
    },
    {
      title: "Will ETH ETF flows stay positive this week?",
      volume: "$175,000",
      yes: "YES 0.38",
    },
    {
      title: "Will CPI print below consensus next release?",
      volume: "$132,000",
      yes: "YES 0.52",
    },
  ],
  activity: [
    {
      time: "09:09 UTC",
      title: "Static deploy mode enabled",
      detail: "This site is meant to render in Netlify without the local Python process.",
    },
    {
      time: "09:09 UTC",
      title: "Signal deck seeded",
      detail: "Representative paper-trading opportunities are shown for UI review.",
    },
    {
      time: "09:09 UTC",
      title: "Local bot still supported",
      detail: "Run the Streamlit or Python bot locally for live scanning and execution logs.",
    },
  ],
};

function fillText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function renderSignals() {
  const tbody = document.getElementById("signals-table");
  tbody.innerHTML = dashboardData.signals
    .map(
      (signal) => `
      <tr>
        <td>${signal.market}</td>
        <td class="${signal.side === "YES" ? "direction-yes" : "direction-no"}">${signal.side}</td>
        <td>${signal.edge}</td>
        <td>${signal.confidence}</td>
        <td>${signal.entry}</td>
        <td>${signal.size}</td>
        <td>${signal.expiry}</td>
        <td><span class="status demo">${signal.status}</span></td>
      </tr>
    `
    )
    .join("");
}

function renderMarkets() {
  const container = document.getElementById("scanner-list");
  container.innerHTML = dashboardData.markets
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
}

function renderActivity() {
  const container = document.getElementById("activity-list");
  container.innerHTML = dashboardData.activity
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

fillText("[data-updated]", `Updated ${dashboardData.updatedAt}`);
fillText("[data-best-edge]", dashboardData.bestEdge);
fillText("[data-average-edge]", dashboardData.avgEdge);
fillText("[data-signal-count]", String(dashboardData.signalCount));
fillText("[data-market-count]", String(dashboardData.marketCount));
fillText("[data-confidence]", dashboardData.confidence);
fillText("[data-max-position]", dashboardData.maxPosition);
fillText("[data-threshold]", dashboardData.threshold);
fillText("[data-balance]", dashboardData.balance);
fillText("[data-pill]", dashboardData.pill);

renderSignals();
renderMarkets();
renderActivity();
