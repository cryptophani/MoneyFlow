type MarketCategory = "politics" | "macro" | "awards" | "sports" | "crypto" | "other";
type StrategyMode = "consensus-fade" | "event-specialist" | "liquidity-reversion";

type Market = {
  condition_id: string;
  question: string;
  slug: string;
  yes_token_id: string;
  no_token_id: string;
  yes_price: number;
  no_price: number;
  volume: number;
  liquidity: number;
  end_date?: string;
  end_date_iso?: string;
};

type Signal = {
  market: string;
  slug: string;
  side: "YES" | "NO";
  edge: number;
  model_prob: number;
  entry_price: number;
  size_usdc: number;
  expiry: string;
  confidence: number;
  status: string;
  volume: number;
  liquidity: number;
  imbalance: number;
  spread: number;
  category: MarketCategory;
  strategy: StrategyMode;
  rationale: string;
};

type Snapshot = {
  updatedAt: string;
  threshold: string;
  balance: string;
  bestEdge: string;
  avgEdge: string;
  signalCount: number;
  marketCount: number;
  confidence: string;
  maxPosition: string;
  pill: string;
  source: "live" | "cache" | "demo";
  demoMode: boolean;
  stale: boolean;
  signals: Signal[];
  markets: Array<{ title: string; volume: string; yes: string; category: string }>;
  activity: Array<{ time: string; title: string; detail: string }>;
};

type SnapshotHistoryItem = {
  id?: number | string;
  createdAt: string;
  source: string;
  demoMode: boolean;
  signalCount: number;
  marketCount: number;
};

interface Env {
  ASSETS: Fetcher;
  SNAPSHOT_CACHE: KVNamespace;
  DB: D1Database;
  CONVEX_CLOUD_URL: string;
  CONVEX_SITE_URL: string;
  CONVEX_INGEST_SECRET?: string;
  MIN_VOLUME: string;
  MIN_LIQUIDITY: string;
  KELLY_FRACTION: string;
  MAX_TRADE_USDC: string;
  EDGE_THRESHOLD: string;
  SNAPSHOT_LIMIT: string;
}

const GAMMA_URL = "https://gamma-api.polymarket.com";
const CLOB_URL = "https://clob.polymarket.com";
const CACHE_TTL_SECONDS = 60 * 30;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const storage = await getStorageHealth(env);
      return json({
        ok: true,
        service: "moneyflow-worker",
        timestamp: new Date().toISOString(),
        storage,
      });
    }

    if (url.pathname === "/api/history") {
      const history = await getHistory(env);
      return json({ history });
    }

    if (url.pathname === "/api/scan") {
      const snapshot = await refreshSnapshot(env);
      return json(snapshot);
    }

    if (url.pathname === "/api/snapshot") {
      const snapshot = await getSnapshot(env);
      return json(snapshot);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await refreshSnapshot(env);
  },
};

async function getStorageHealth(env: Env): Promise<Record<string, unknown>> {
  const convexReachable = await convexHealth(env);
  return {
    convex: {
      configured: Boolean(env.CONVEX_SITE_URL && env.CONVEX_CLOUD_URL),
      reachable: convexReachable,
      siteUrl: env.CONVEX_SITE_URL,
      cloudUrl: env.CONVEX_CLOUD_URL,
    },
    cache: { kv: true, d1Fallback: true },
  };
}

async function getSnapshot(env: Env): Promise<Snapshot> {
  await ensureSchema(env);

  const cached = await env.SNAPSHOT_CACHE.get("latest", "json");
  if (cached) {
    return cached as Snapshot;
  }

  const convexSnapshot = await getLatestConvexSnapshot(env);
  if (convexSnapshot) {
    await cacheSnapshot(env, convexSnapshot);
    return convexSnapshot;
  }

  const stored = await getLatestStoredSnapshot(env);
  if (stored) {
    return {
      ...stored,
      source: stored.source === "live" ? "cache" : stored.source,
      stale: true,
      pill: "Serving last successful fallback snapshot",
    };
  }

  return refreshSnapshot(env);
}

async function refreshSnapshot(env: Env): Promise<Snapshot> {
  await ensureSchema(env);
  try {
    const snapshot = await collectLiveSnapshot(env);
    await persistSnapshot(env, snapshot);
    return snapshot;
  } catch {
    const stored = await getLatestConvexSnapshot(env) ?? (await getLatestStoredSnapshot(env));
    if (stored) {
      const fallback = {
        ...stored,
        source: stored.source === "live" ? "cache" : stored.source,
        stale: true,
        pill: "Serving last successful snapshot while live scan recovers",
      } satisfies Snapshot;
      await cacheSnapshot(env, fallback);
      return fallback;
    }

    const snapshot = demoSnapshot("Live scan failed. Serving seeded review data.");
    await persistSnapshot(env, snapshot);
    return snapshot;
  }
}

async function collectLiveSnapshot(env: Env): Promise<Snapshot> {
  const limit = Number.parseInt(env.SNAPSHOT_LIMIT, 10) || 60;
  const markets = await fetchActiveMarkets(env, limit);
  if (!markets.length) {
    return demoSnapshot("No live markets available. Serving seeded review data.");
  }

  const walletBalance = Math.max(Number.parseFloat(env.MAX_TRADE_USDC) * 10, 100);
  const signals: Signal[] = [];

  for (const market of markets) {
    const ob = await fetchOrderBookFeatures(market.yes_token_id);
    const signal = generateSignal(market, ob, walletBalance, env);
    if (signal) {
      signals.push(signal);
    }
  }

  signals.sort((a, b) => b.edge - a.edge);
  const bestEdge = signals[0]?.edge ?? 0;
  const avgEdge = signals.length ? signals.reduce((sum, signal) => sum + signal.edge, 0) / signals.length : 0;
  const avgConfidence = signals.length
    ? Math.round(signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length)
    : 0;
  const maxPosition = signals.reduce((max, signal) => Math.max(max, signal.size_usdc), 0);
  const now = new Date();

  return {
    updatedAt: formatTimestamp(now),
    threshold: pct(Number.parseFloat(env.EDGE_THRESHOLD)),
    balance: usd(walletBalance),
    bestEdge: pct(bestEdge),
    avgEdge: pct(avgEdge),
    signalCount: signals.length,
    marketCount: markets.length,
    confidence: `${avgConfidence}/99`,
    maxPosition: usd(maxPosition),
    pill: "Live snapshot with Convex-backed history",
    source: "live",
    demoMode: false,
    stale: false,
    signals,
    markets: markets.slice(0, 8).map((market) => ({
      title: market.question,
      volume: usd(market.volume),
      yes: `YES ${market.yes_price.toFixed(2)}`,
      category: classifyCategory(market.question),
    })),
    activity: buildActivity(signals, now, false),
  };
}

async function fetchActiveMarkets(env: Env, limit: number): Promise<Market[]> {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    archived: "false",
    enableOrderBook: "true",
    limit: String(limit),
    order: "volume",
    ascending: "false",
  });
  const response = await fetch(`${GAMMA_URL}/markets?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Gamma market fetch failed: ${response.status}`);
  }

  const raw = (await response.json()) as Array<Record<string, unknown>>;
  const minVolume = Number.parseFloat(env.MIN_VOLUME);
  const minLiquidity = Number.parseFloat(env.MIN_LIQUIDITY);

  return raw.flatMap((market) => {
    try {
      const volume = Number(market.volume ?? 0);
      const liquidity = Number(market.liquidity ?? 0);
      if (volume < minVolume || liquidity < minLiquidity) {
        return [];
      }

      const outcomes = JSON.parse(String(market.outcomes ?? "[\"Yes\",\"No\"]")) as string[];
      const prices = JSON.parse(String(market.outcomePrices ?? "[0.5,0.5]")) as number[];
      const tokenIdsRaw = market.clobTokenIds;
      const tokenIds = typeof tokenIdsRaw === "string" ? (JSON.parse(tokenIdsRaw) as string[]) : (tokenIdsRaw as string[]);
      if (!tokenIds?.length || tokenIds.length < 2) {
        return [];
      }

      const yesIndex = outcomes.findIndex((outcome) => ["yes", "true"].includes(outcome.toLowerCase()));
      const resolvedYesIndex = yesIndex >= 0 ? yesIndex : 0;

      return [
        {
          condition_id: String(market.conditionId ?? ""),
          question: String(market.question ?? ""),
          slug: String(market.slug ?? ""),
          yes_token_id: String(tokenIds[resolvedYesIndex]),
          no_token_id: String(tokenIds[1 - resolvedYesIndex]),
          yes_price: Number(prices[resolvedYesIndex] ?? 0.5),
          no_price: Number(prices[1 - resolvedYesIndex] ?? 0.5),
          volume,
          liquidity,
          end_date: market.endDate ? String(market.endDate) : undefined,
          end_date_iso: market.endDateIso ? String(market.endDateIso) : undefined,
        } satisfies Market,
      ];
    } catch {
      return [];
    }
  });
}

async function fetchOrderBookFeatures(tokenId: string): Promise<{ imbalance: number; liquidity: number; spread: number }> {
  const response = await fetch(`${CLOB_URL}/book?token_id=${encodeURIComponent(tokenId)}`);
  if (!response.ok) {
    return { imbalance: 0, liquidity: 0, spread: 0 };
  }

  const data = (await response.json()) as { bids?: Array<{ price: string; size: string }>; asks?: Array<{ price: string; size: string }> };
  const bids = data.bids ?? [];
  const asks = data.asks ?? [];
  const bidVol = bids.slice(0, 5).reduce((sum, bid) => sum + Number(bid.price) * Number(bid.size), 0);
  const askVol = asks.slice(0, 5).reduce((sum, ask) => sum + Number(ask.price) * Number(ask.size), 0);
  const total = bidVol + askVol;
  const imbalance = total > 0 ? (bidVol - askVol) / total : 0;
  const bestBid = bids[0] ? Number(bids[0].price) : 0;
  const bestAsk = asks[0] ? Number(asks[0].price) : 0;

  return {
    imbalance,
    liquidity: total,
    spread: bestAsk && bestBid ? Math.max(0, bestAsk - bestBid) : 0,
  };
}

function generateSignal(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  walletBalance: number,
  env: Env,
): Signal | null {
  const question = market.question.toLowerCase();
  const category = classifyCategory(market.question);
  const strategy = chooseStrategy(category, ob.imbalance);

  if (category === "crypto" || ["temperature", "weather", "hit", "reach", "price"].some((word) => question.includes(word))) {
    return null;
  }

  const expiryRaw = market.end_date_iso ?? market.end_date;
  if (expiryRaw) {
    const expiry = new Date(expiryRaw);
    const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft > 10) {
      return null;
    }
  }

  if (market.yes_price < 0.03 || market.yes_price > 0.97) {
    return null;
  }

  if (market.volume < Number.parseFloat(env.MIN_VOLUME) || ob.liquidity < Number.parseFloat(env.MIN_LIQUIDITY)) {
    return null;
  }

  const strategyBias = strategy === "consensus-fade" ? (0.5 - market.yes_price) * 0.28 : strategy === "event-specialist" ? (0.5 - market.yes_price) * 0.18 : (0.5 - market.yes_price) * 0.1;
  const orderBookBias = ob.imbalance * (strategy === "liquidity-reversion" ? 0.05 : 0.03);
  const spreadPenalty = ob.spread * 0.2;
  const modelProb = clamp(market.yes_price + strategyBias + orderBookBias - spreadPenalty, 0.05, 0.95);
  const yesEdge = modelProb - market.yes_price;
  const noEdge = (1 - modelProb) - market.no_price;
  const edge = Math.max(yesEdge, noEdge);
  const threshold = Number.parseFloat(env.EDGE_THRESHOLD);

  if (edge < threshold || edge > 0.18) {
    return null;
  }

  const side = yesEdge >= noEdge ? "YES" : "NO";
  const entryPrice = side === "YES" ? market.yes_price : market.no_price;
  const confidence = Math.min(99, Math.max(5, Math.round(Math.abs(edge) * 1000)));
  const sizeUsdc = computeKellySize(modelProb, market.yes_price, side, walletBalance, env);

  return {
    market: market.question,
    slug: market.slug,
    side,
    edge: round(edge, 4),
    model_prob: round(modelProb, 4),
    entry_price: round(entryPrice, 3),
    size_usdc: sizeUsdc,
    expiry: formatExpiry(expiryRaw),
    confidence,
    status: "Active",
    volume: market.volume,
    liquidity: market.liquidity,
    imbalance: round(ob.imbalance, 4),
    spread: round(ob.spread, 4),
    category,
    strategy,
    rationale: describeRationale(category, strategy, market, ob, edge),
  };
}

function computeKellySize(modelProb: number, marketPrice: number, side: "YES" | "NO", walletBalance: number, env: Env): number {
  if (walletBalance <= 0) {
    return 5;
  }

  const p = side === "YES" ? modelProb : 1 - modelProb;
  const price = side === "YES" ? marketPrice : 1 - marketPrice;
  if (price <= 0 || price >= 1) {
    return 5;
  }

  const b = 1 / price - 1;
  const q = 1 - p;
  const f = (p * b - q) / b;
  if (f <= 0) {
    return 5;
  }

  const sized = f * Number.parseFloat(env.KELLY_FRACTION) * walletBalance;
  return round(Math.min(sized, Number.parseFloat(env.MAX_TRADE_USDC)), 2);
}

async function persistSnapshot(env: Env, snapshot: Snapshot): Promise<void> {
  await ensureSchema(env);
  await cacheSnapshot(env, snapshot);
  await persistD1Snapshot(env, snapshot);
  await persistConvexSnapshot(env, snapshot);
}

async function cacheSnapshot(env: Env, snapshot: Snapshot): Promise<void> {
  await env.SNAPSHOT_CACHE.put("latest", JSON.stringify(snapshot), { expirationTtl: CACHE_TTL_SECONDS });
}

async function persistD1Snapshot(env: Env, snapshot: Snapshot): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO snapshots (created_at, source, demo_mode, signal_count, market_count, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  )
    .bind(snapshot.updatedAt, snapshot.source, snapshot.demoMode ? 1 : 0, snapshot.signalCount, snapshot.marketCount, JSON.stringify(snapshot))
    .run();
}

async function persistConvexSnapshot(env: Env, snapshot: Snapshot): Promise<void> {
  if (!env.CONVEX_SITE_URL || !env.CONVEX_INGEST_SECRET) {
    return;
  }

  const response = await fetch(`${env.CONVEX_SITE_URL}/ingest/snapshot`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": env.CONVEX_INGEST_SECRET,
    },
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    throw new Error(`Convex snapshot persist failed: ${response.status}`);
  }
}

async function getLatestConvexSnapshot(env: Env): Promise<Snapshot | null> {
  if (!env.CONVEX_SITE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${env.CONVEX_SITE_URL}/snapshot`);
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { snapshot?: Snapshot | null };
    return payload.snapshot ?? null;
  } catch {
    return null;
  }
}

async function getLatestStoredSnapshot(env: Env): Promise<Snapshot | null> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT payload FROM snapshots ORDER BY id DESC LIMIT 1").first<{ payload: string }>();
  return row ? (JSON.parse(row.payload) as Snapshot) : null;
}

async function getHistory(env: Env): Promise<SnapshotHistoryItem[]> {
  const convexHistory = await getConvexHistory(env);
  if (convexHistory.length) {
    return convexHistory;
  }

  await ensureSchema(env);
  const rows = await env.DB.prepare(
    "SELECT id, created_at, source, demo_mode, signal_count, market_count FROM snapshots ORDER BY id DESC LIMIT 10",
  ).all<{
    id: number;
    created_at: string;
    source: string;
    demo_mode: number;
    signal_count: number;
    market_count: number;
  }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    demoMode: Boolean(row.demo_mode),
    signalCount: row.signal_count,
    marketCount: row.market_count,
  }));
}

async function getConvexHistory(env: Env): Promise<SnapshotHistoryItem[]> {
  if (!env.CONVEX_SITE_URL) {
    return [];
  }

  try {
    const response = await fetch(`${env.CONVEX_SITE_URL}/history?limit=10`);
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as { history?: SnapshotHistoryItem[] };
    return payload.history ?? [];
  } catch {
    return [];
  }
}

async function convexHealth(env: Env): Promise<boolean> {
  if (!env.CONVEX_SITE_URL) {
    return false;
  }

  try {
    const response = await fetch(`${env.CONVEX_SITE_URL}/health`);
    if (!response.ok) {
      return false;
    }
    const payload = (await response.json()) as { ok?: boolean };
    return Boolean(payload.ok);
  } catch {
    return false;
  }
}

async function ensureSchema(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, source TEXT NOT NULL, demo_mode INTEGER NOT NULL, signal_count INTEGER NOT NULL, market_count INTEGER NOT NULL, payload TEXT NOT NULL)",
    ),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at DESC)"),
  ]);
}

function classifyCategory(question: string): MarketCategory {
  const value = question.toLowerCase();
  if (/(election|president|senate|house|governor|minister|prime minister|nominee|vote|campaign)/.test(value)) {
    return "politics";
  }
  if (/(fed|rate|cpi|inflation|gdp|recession|jobs|payroll|unemployment|treasury|tariff)/.test(value)) {
    return "macro";
  }
  if (/(oscar|emmy|grammy|golden globe|award|festival|palme)/.test(value)) {
    return "awards";
  }
  if (/(nba|nfl|mlb|nhl|wimbledon|open|cup|final|match|game|championship|playoff|team)/.test(value)) {
    return "sports";
  }
  if (/(btc|bitcoin|eth|ethereum|sol|solana|crypto)/.test(value)) {
    return "crypto";
  }
  return "other";
}

function chooseStrategy(category: MarketCategory, imbalance: number): StrategyMode {
  if (category === "politics" || category === "macro" || category === "awards") {
    return "consensus-fade";
  }
  if (category === "sports") {
    return "event-specialist";
  }
  return Math.abs(imbalance) > 0.12 ? "liquidity-reversion" : "consensus-fade";
}

function describeRationale(
  category: MarketCategory,
  strategy: StrategyMode,
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  edge: number,
): string {
  return [
    `${category} setup`,
    `${strategy} bias`,
    `edge ${pct(edge)}`,
    `imbalance ${round(ob.imbalance, 3)}`,
    `spread ${round(ob.spread, 3)}`,
    `vol ${usd(market.volume)}`,
  ].join(" | ");
}

function demoSnapshot(detail: string): Snapshot {
  const updatedAt = formatTimestamp(new Date());
  const signals: Signal[] = [
    {
      market: "Will the Fed cut rates before September?",
      slug: "fed-cut-before-september",
      side: "YES",
      edge: 0.084,
      model_prob: 0.612,
      entry_price: 0.528,
      size_usdc: 25,
      expiry: "Aug 20, 2026",
      confidence: 84,
      status: "Demo",
      volume: 240000,
      liquidity: 68000,
      imbalance: 0.312,
      spread: 0.012,
      category: "macro",
      strategy: "consensus-fade",
      rationale: "macro setup | consensus-fade bias | seeded review data",
    },
    {
      market: "Will Cannes Palme d'Or go to a first-time winner?",
      slug: "cannes-palme-first-time-winner",
      side: "NO",
      edge: 0.071,
      model_prob: 0.433,
      entry_price: 0.621,
      size_usdc: 18.5,
      expiry: "May 18, 2026",
      confidence: 71,
      status: "Demo",
      volume: 175000,
      liquidity: 42000,
      imbalance: -0.241,
      spread: 0.009,
      category: "awards",
      strategy: "consensus-fade",
      rationale: "awards setup | consensus-fade bias | seeded review data",
    },
    {
      market: "Will the Celtics reach the NBA Finals?",
      slug: "celtics-nba-finals",
      side: "YES",
      edge: 0.063,
      model_prob: 0.587,
      entry_price: 0.524,
      size_usdc: 14,
      expiry: "May 14, 2026",
      confidence: 63,
      status: "Demo",
      volume: 132000,
      liquidity: 35800,
      imbalance: 0.226,
      spread: 0.015,
      category: "sports",
      strategy: "event-specialist",
      rationale: "sports setup | event-specialist bias | seeded review data",
    },
  ];

  return {
    updatedAt,
    threshold: "7.00%",
    balance: "$100.00",
    bestEdge: "8.40%",
    avgEdge: "7.27%",
    signalCount: signals.length,
    marketCount: 3,
    confidence: "73/99",
    maxPosition: "$25.00",
    pill: "Convex + Cloudflare demo snapshot",
    source: "demo",
    demoMode: true,
    stale: false,
    signals,
    markets: signals.map((signal) => ({
      title: signal.market,
      volume: usd(signal.volume),
      yes: `YES ${signal.entry_price.toFixed(2)}`,
      category: signal.category,
    })),
    activity: [
      { time: shortTime(new Date()), title: "Demo mode enabled", detail },
      { time: shortTime(new Date()), title: "Convex persistence enabled", detail: "Snapshots and history are written to Convex and cached on Cloudflare." },
      { time: shortTime(new Date()), title: "Paper trading only", detail: "No live orders are placed from the Cloudflare deployment." },
    ],
  };
}

function buildActivity(signals: Signal[], now: Date, demoMode: boolean): Array<{ time: string; title: string; detail: string }> {
  const time = shortTime(now);
  const top = signals[0];
  return [
    top
      ? {
          time,
          title: `Signal ready: ${top.side} ${top.slug}`,
          detail: `${top.category} | ${top.strategy} | edge ${top.edge.toFixed(3)} | size ${usd(top.size_usdc)}.`,
        }
      : { time, title: "No active signals", detail: "The latest scan did not return any opportunities above the edge threshold." },
    { time, title: `Scanned ${signals.length} qualified opportunities`, detail: "Markets filtered by liquidity, pricing bands, time to resolution, and category heuristics." },
    {
      time,
      title: demoMode ? "Demo mode active" : "Cloudflare cron enabled",
      detail: demoMode ? "Serving fallback data." : "Worker cron refreshes snapshots every 10 minutes and persists them to Convex.",
    },
  ];
}

function formatExpiry(raw?: string): string {
  if (!raw) return "Open";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }) + " UTC";
}

function shortTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) + " UTC";
}

function pct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision: number): number {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}
