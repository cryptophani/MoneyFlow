type MarketCategory = "politics" | "macro" | "awards" | "sports" | "crypto" | "other";
type StrategyMode = "consensus-fade" | "event-specialist" | "liquidity-reversion";
type Conviction = "Monitor" | "Prepare" | "Active";

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

type ResearchCitation = {
  title: string;
  url: string;
  source: string;
  publishedDate?: string;
};

type ResearchBrief = {
  category: MarketCategory;
  strategy: StrategyMode;
  conviction: Conviction;
  impactScore: number;
  updatedAtTs: number;
  updatedAt: string;
  headline: string;
  thesis: string;
  risk: string;
  watchSignals: string[];
  citations: ResearchCitation[];
  source: "live" | "cache" | "demo";
  stale: boolean;
};

type ResearchState = {
  updatedAt: string;
  source: "live" | "cache" | "demo";
  stale: boolean;
  demoMode: boolean;
  briefs: ResearchBrief[];
};

type ExaAnswerResponse = {
  answer?: {
    headline?: string;
    thesis?: string;
    risk?: string;
    conviction?: string;
    impactScore?: number;
    watchSignals?: string[];
    strategy?: string;
  } | string;
  citations?: Array<{
    title?: string;
    url?: string;
    publishedDate?: string;
  }>;
};

type WorkerEnv = Cloudflare.Env & {
  ASSETS: Fetcher;
  SNAPSHOT_CACHE: KVNamespace;
  DB: D1Database;
  CONVEX_CLOUD_URL: string;
  CONVEX_SITE_URL: string;
  CONVEX_INGEST_SECRET?: string;
  EXA_API_KEY?: string;
  MIN_VOLUME: string;
  MIN_LIQUIDITY: string;
  KELLY_FRACTION: string;
  MAX_TRADE_USDC: string;
  EDGE_THRESHOLD: string;
  SNAPSHOT_LIMIT: string;
};

const GAMMA_URL = "https://gamma-api.polymarket.com";
const CLOB_URL = "https://clob.polymarket.com";
const EXA_ANSWER_URL = "https://api.exa.ai/answer";
const SNAPSHOT_CACHE_KEY = "snapshot:latest";
const RESEARCH_CACHE_KEY = "research:latest";
const SNAPSHOT_CACHE_TTL_SECONDS = 60 * 30;
const RESEARCH_CACHE_TTL_SECONDS = 60 * 60 * 6;
const FOCUS_CATEGORIES: MarketCategory[] = ["politics", "macro", "awards"];

const CATEGORY_RESEARCH_PLAN: Array<{
  category: MarketCategory;
  strategy: StrategyMode;
  query: string;
}> = [
  {
    category: "politics",
    strategy: "consensus-fade",
    query:
      "Find the most important developments in the next 7 to 21 days that could reprice US national or state election prediction markets. Focus on contrarian angles where public consensus may be too strong. Return a concise thesis for a paper-trading desk.",
  },
  {
    category: "macro",
    strategy: "consensus-fade",
    query:
      "Find the most important developments in the next 7 to 21 days that could reprice Fed, inflation, labor, or growth prediction markets. Focus on crowded narratives and what would surprise the market.",
  },
  {
    category: "awards",
    strategy: "event-specialist",
    query:
      "Find the most important developments in the next 14 to 45 days that could reprice entertainment awards prediction markets. Focus on campaign momentum, festival reactions, juries, critics, and overlooked catalysts.",
  },
];

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const [snapshot, research] = await Promise.all([getSnapshot(env), getResearch(env)]);
      return json({
        ok: true,
        service: "moneyflow-worker",
        timestamp: new Date().toISOString(),
        storage: {
          convexConfigured: Boolean(env.CONVEX_SITE_URL && env.CONVEX_CLOUD_URL),
          researchConfigured: Boolean(env.EXA_API_KEY),
        },
        focusCategories: FOCUS_CATEGORIES,
        signalCount: snapshot.signalCount,
        researchBriefs: research.briefs.length,
      });
    }

    if (url.pathname === "/api/history") {
      const history = await getHistory(env);
      return json({ history });
    }

    if (url.pathname === "/api/research") {
      ctx.waitUntil(refreshResearchIfStale(env));
      const research = await getResearch(env);
      return json(research);
    }

    if (url.pathname === "/api/research/refresh") {
      const research = await refreshResearch(env);
      return json(research);
    }

    if (url.pathname === "/api/scan") {
      const [snapshot, research] = await Promise.all([refreshSnapshot(env), refreshResearch(env)]);
      return json({ snapshot, research });
    }

    if (url.pathname === "/api/snapshot") {
      ctx.waitUntil(refreshResearchIfStale(env));
      const snapshot = await getSnapshot(env);
      return json(snapshot);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(Promise.all([refreshSnapshot(env), refreshResearch(env)]));
  },
} satisfies ExportedHandler<WorkerEnv>;

async function getSnapshot(env: WorkerEnv): Promise<Snapshot> {
  await ensureSchema(env);
  const cached = await env.SNAPSHOT_CACHE.get(SNAPSHOT_CACHE_KEY, "json");
  if (cached) {
    return cached as Snapshot;
  }

  const convexSnapshot = await getLatestConvexSnapshot(env);
  if (convexSnapshot) {
    await cacheJson(env.SNAPSHOT_CACHE, SNAPSHOT_CACHE_KEY, convexSnapshot, SNAPSHOT_CACHE_TTL_SECONDS);
    return convexSnapshot;
  }

  const stored = await getLatestStoredSnapshot(env);
  if (stored) {
    return {
      ...stored,
      source: "cache",
      stale: true,
      pill: "Serving last successful snapshot",
    };
  }

  return refreshSnapshot(env);
}

async function refreshSnapshot(env: WorkerEnv): Promise<Snapshot> {
  await ensureSchema(env);
  try {
    const snapshot = await collectLiveSnapshot(env);
    await persistSnapshot(env, snapshot);
    return snapshot;
  } catch {
    const fallback = (await getLatestConvexSnapshot(env)) ?? (await getLatestStoredSnapshot(env));
    if (fallback) {
      const cached = {
        ...fallback,
        source: "cache",
        stale: true,
        pill: "Serving the last successful scan while live data recovers",
      } satisfies Snapshot;
      await cacheJson(env.SNAPSHOT_CACHE, SNAPSHOT_CACHE_KEY, cached, SNAPSHOT_CACHE_TTL_SECONDS);
      return cached;
    }

    const snapshot = demoSnapshot("Live scan failed. Serving seeded review data.");
    await persistSnapshot(env, snapshot);
    return snapshot;
  }
}

async function collectLiveSnapshot(env: WorkerEnv): Promise<Snapshot> {
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
  const focusMarkets = markets.filter((market) => FOCUS_CATEGORIES.includes(classifyCategory(market.question)));
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
    marketCount: focusMarkets.length,
    confidence: `${avgConfidence}/99`,
    maxPosition: usd(maxPosition),
    pill: "Focused on politics, macro, and awards",
    source: "live",
    demoMode: false,
    stale: false,
    signals,
    markets: focusMarkets.slice(0, 8).map((market) => ({
      title: market.question,
      volume: usd(market.volume),
      yes: `YES ${market.yes_price.toFixed(2)}`,
      category: classifyCategory(market.question),
    })),
    activity: buildActivity(signals, now, false),
  };
}

async function getResearch(env: WorkerEnv): Promise<ResearchState> {
  const cached = await env.SNAPSHOT_CACHE.get(RESEARCH_CACHE_KEY, "json");
  if (cached) {
    const cachedState = cached as ResearchState;
    if (!cachedState.demoMode) {
      return cachedState;
    }
  }

  const convexResearch = await getLatestConvexResearch(env);
  if (convexResearch.briefs.length) {
    await cacheJson(env.SNAPSHOT_CACHE, RESEARCH_CACHE_KEY, convexResearch, RESEARCH_CACHE_TTL_SECONDS);
    return convexResearch;
  }

  return demoResearchState("Research queue is running in seeded mode.");
}

async function refreshResearchIfStale(env: WorkerEnv): Promise<void> {
  const current = await getResearch(env);
  const age = Date.now() - Date.parse(current.updatedAt);
  if (current.demoMode || !Number.isFinite(age) || age > RESEARCH_CACHE_TTL_SECONDS * 1000) {
    await refreshResearch(env);
  }
}

async function refreshResearch(env: WorkerEnv): Promise<ResearchState> {
  if (!env.EXA_API_KEY) {
    const seeded = demoResearchState("Exa API key is not configured. Serving seeded research briefs.");
    await cacheJson(env.SNAPSHOT_CACHE, RESEARCH_CACHE_KEY, seeded, RESEARCH_CACHE_TTL_SECONDS);
    return seeded;
  }

  try {
    const briefs = await Promise.all(CATEGORY_RESEARCH_PLAN.map((plan) => fetchResearchBrief(plan, env)));
    const live: ResearchState = {
      updatedAt: formatTimestamp(new Date()),
      source: "live",
      stale: false,
      demoMode: false,
      briefs: briefs.sort((a, b) => b.impactScore - a.impactScore),
    };
    await persistResearch(env, live);
    return live;
  } catch {
    const fallback = await getLatestConvexResearch(env);
    if (fallback.briefs.length) {
      const cached = { ...fallback, source: "cache", stale: true, demoMode: false } satisfies ResearchState;
      await cacheJson(env.SNAPSHOT_CACHE, RESEARCH_CACHE_KEY, cached, RESEARCH_CACHE_TTL_SECONDS);
      return cached;
    }

    const seeded = demoResearchState("Live research failed. Serving seeded category briefs.");
    await cacheJson(env.SNAPSHOT_CACHE, RESEARCH_CACHE_KEY, seeded, RESEARCH_CACHE_TTL_SECONDS);
    return seeded;
  }
}

async function fetchResearchBrief(
  plan: { category: MarketCategory; strategy: StrategyMode; query: string },
  env: WorkerEnv,
): Promise<ResearchBrief> {
  const response = await fetch(EXA_ANSWER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.EXA_API_KEY!,
    },
    body: JSON.stringify({
      query: `${plan.query} Today is ${new Date().toISOString()}. Use recent reporting and primary sources. Do not cite prediction-market listing pages. Respond like a disciplined prediction-market analyst. Keep it practical, specific, and concise.`,
      text: true,
      outputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          thesis: { type: "string" },
          risk: { type: "string" },
          conviction: { type: "string", enum: ["Monitor", "Prepare", "Active"] },
          impactScore: { type: "number" },
          watchSignals: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
          strategy: { type: "string", enum: ["consensus-fade", "event-specialist", "liquidity-reversion"] },
        },
        required: ["headline", "thesis", "risk", "conviction", "impactScore", "watchSignals", "strategy"],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa research failed for ${plan.category}: ${response.status}`);
  }

  const payload = (await response.json()) as ExaAnswerResponse;
  const answer = typeof payload.answer === "object" && payload.answer ? payload.answer : {};
  const rawCitations = (payload.citations ?? [])
    .filter((item) => item.url && item.title)
    .map((item) => ({
      title: item.title ?? "Untitled source",
      url: item.url ?? "#",
      source: sourceHost(item.url),
      publishedDate: item.publishedDate,
    }));
  const citations = rawCitations
    .filter((item) => !["polymarket.com", "kalshi.com"].includes(item.source))
    .slice(0, 3);
  const finalCitations = (citations.length ? citations : rawCitations.slice(0, 3))
    .map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      publishedDate: item.publishedDate,
    }));
  const rawImpactScore = Number(answer.impactScore ?? 60);

  return {
    category: plan.category,
    strategy: plan.strategy,
    conviction: normalizeConviction(answer.conviction),
    impactScore: clamp(Math.round(rawImpactScore <= 10 ? rawImpactScore * 10 : rawImpactScore), 1, 99),
    updatedAtTs: Date.now(),
    updatedAt: formatTimestamp(new Date()),
    headline: cleanText(answer.headline, `${capitalize(plan.category)} setup in focus`),
    thesis: cleanText(answer.thesis, "Research feed did not return a thesis."),
    risk: cleanText(answer.risk, "Evidence is thin and should be monitored before sizing."),
    watchSignals: Array.isArray(answer.watchSignals)
      ? answer.watchSignals.slice(0, 5).map((item) => normalizeWatchSignal(cleanText(item, ""))).filter(Boolean)
      : [],
    citations: finalCitations,
    source: "live",
    stale: false,
  };
}

async function fetchActiveMarkets(env: WorkerEnv, limit: number): Promise<Market[]> {
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
  env: WorkerEnv,
): Signal | null {
  const category = classifyCategory(market.question);
  if (!FOCUS_CATEGORIES.includes(category)) {
    return null;
  }

  const strategy = chooseStrategy(category, ob.imbalance);
  const expiryRaw = market.end_date_iso ?? market.end_date;

  if (!passesTimeWindow(category, expiryRaw)) {
    return null;
  }

  if (market.yes_price < 0.04 || market.yes_price > 0.96) {
    return null;
  }

  if (market.volume < Number.parseFloat(env.MIN_VOLUME) || ob.liquidity < Number.parseFloat(env.MIN_LIQUIDITY)) {
    return null;
  }

  const modelProb = estimateModelProbability(category, strategy, market.yes_price, ob.imbalance, ob.spread);
  const yesEdge = modelProb - market.yes_price;
  const noEdge = (1 - modelProb) - market.no_price;
  const edge = Math.max(yesEdge, noEdge);
  const threshold = Number.parseFloat(env.EDGE_THRESHOLD);

  if (edge < threshold || edge > 0.2) {
    return null;
  }

  const side = yesEdge >= noEdge ? "YES" : "NO";
  const entryPrice = side === "YES" ? market.yes_price : market.no_price;
  const confidence = Math.min(99, Math.max(15, Math.round(edge * 1000 + categoryConfidenceBoost(category))));
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

function estimateModelProbability(
  category: MarketCategory,
  strategy: StrategyMode,
  marketPrice: number,
  imbalance: number,
  spread: number,
): number {
  const categoryBias =
    category === "macro" ? 0.24 :
    category === "politics" ? 0.18 :
    category === "awards" ? 0.14 :
    0.1;
  const strategyBias =
    strategy === "consensus-fade" ? 0.3 :
    strategy === "event-specialist" ? 0.2 :
    0.12;

  const fadeTerm = (0.5 - marketPrice) * categoryBias;
  const orderBookTerm = imbalance * (0.025 + strategyBias / 10);
  const spreadPenalty = spread * 0.25;

  return clamp(marketPrice + fadeTerm + orderBookTerm - spreadPenalty, 0.05, 0.95);
}

function computeKellySize(modelProb: number, marketPrice: number, side: "YES" | "NO", walletBalance: number, env: WorkerEnv): number {
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

async function persistSnapshot(env: WorkerEnv, snapshot: Snapshot): Promise<void> {
  await ensureSchema(env);
  await cacheJson(env.SNAPSHOT_CACHE, SNAPSHOT_CACHE_KEY, snapshot, SNAPSHOT_CACHE_TTL_SECONDS);
  await env.DB.prepare(
    "INSERT INTO snapshots (created_at, source, demo_mode, signal_count, market_count, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  )
    .bind(snapshot.updatedAt, snapshot.source, snapshot.demoMode ? 1 : 0, snapshot.signalCount, snapshot.marketCount, JSON.stringify(snapshot))
    .run();

  if (env.CONVEX_SITE_URL && env.CONVEX_INGEST_SECRET) {
    await fetch(`${env.CONVEX_SITE_URL}/ingest/snapshot`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ingest-secret": env.CONVEX_INGEST_SECRET,
      },
      body: JSON.stringify(snapshot),
    });
  }
}

async function persistResearch(env: WorkerEnv, research: ResearchState): Promise<void> {
  await cacheJson(env.SNAPSHOT_CACHE, RESEARCH_CACHE_KEY, research, RESEARCH_CACHE_TTL_SECONDS);
  if (!env.CONVEX_SITE_URL || !env.CONVEX_INGEST_SECRET) {
    return;
  }

  await fetch(`${env.CONVEX_SITE_URL}/ingest/research`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": env.CONVEX_INGEST_SECRET,
    },
    body: JSON.stringify({ briefs: research.briefs }),
  });
}

async function getLatestStoredSnapshot(env: WorkerEnv): Promise<Snapshot | null> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT payload FROM snapshots ORDER BY id DESC LIMIT 1").first<{ payload: string }>();
  return row ? (JSON.parse(row.payload) as Snapshot) : null;
}

async function getLatestConvexSnapshot(env: WorkerEnv): Promise<Snapshot | null> {
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

async function getLatestConvexResearch(env: WorkerEnv): Promise<ResearchState> {
  if (!env.CONVEX_SITE_URL) {
    return { updatedAt: formatTimestamp(new Date()), source: "demo", stale: true, demoMode: true, briefs: [] };
  }

  try {
    const response = await fetch(`${env.CONVEX_SITE_URL}/research`);
    if (!response.ok) {
      return { updatedAt: formatTimestamp(new Date()), source: "demo", stale: true, demoMode: true, briefs: [] };
    }
    const payload = (await response.json()) as { research?: ResearchBrief[] };
    const briefs = payload.research ?? [];
    const updatedAt = briefs[0]?.updatedAt ?? formatTimestamp(new Date());
    return {
      updatedAt,
      source: "live",
      stale: false,
      demoMode: false,
      briefs,
    };
  } catch {
    return { updatedAt: formatTimestamp(new Date()), source: "demo", stale: true, demoMode: true, briefs: [] };
  }
}

async function getHistory(env: WorkerEnv): Promise<SnapshotHistoryItem[]> {
  if (env.CONVEX_SITE_URL) {
    try {
      const response = await fetch(`${env.CONVEX_SITE_URL}/history?limit=12`);
      if (response.ok) {
        const payload = (await response.json()) as { history?: SnapshotHistoryItem[] };
        if (payload.history?.length) {
          return payload.history;
        }
      }
    } catch {
      // fall through to D1
    }
  }

  await ensureSchema(env);
  const rows = await env.DB.prepare(
    "SELECT id, created_at, source, demo_mode, signal_count, market_count FROM snapshots ORDER BY id DESC LIMIT 12",
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

async function ensureSchema(env: WorkerEnv): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, source TEXT NOT NULL, demo_mode INTEGER NOT NULL, signal_count INTEGER NOT NULL, market_count INTEGER NOT NULL, payload TEXT NOT NULL)",
    ),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at DESC)"),
  ]);
}

function passesTimeWindow(category: MarketCategory, raw?: string): boolean {
  if (!raw) {
    return true;
  }
  const expiry = new Date(raw);
  if (Number.isNaN(expiry.getTime())) {
    return true;
  }

  const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const maxDays =
    category === "macro" ? 45 :
    category === "awards" ? 180 :
    category === "politics" ? 180 :
    30;
  return daysLeft > 0 && daysLeft <= maxDays;
}

function classifyCategory(question: string): MarketCategory {
  const value = question.toLowerCase();
  if (/(election|president|senate|house|governor|minister|prime minister|nominee|vote|campaign|democratic|republican|mayor|ballot)/.test(value)) {
    return "politics";
  }
  if (/(fed|rate|cpi|inflation|gdp|recession|jobs|payroll|unemployment|treasury|tariff|pce)/.test(value)) {
    return "macro";
  }
  if (/(oscar|emmy|grammy|golden globe|award|festival|palme|cannes|tony)/.test(value)) {
    return "awards";
  }
  if (/(nba|nfl|mlb|nhl|wimbledon|open|cup|final|match|game|championship|playoff|team|eurovision)/.test(value)) {
    return "sports";
  }
  if (/(btc|bitcoin|eth|ethereum|sol|solana|crypto)/.test(value)) {
    return "crypto";
  }
  return "other";
}

function chooseStrategy(category: MarketCategory, imbalance: number): StrategyMode {
  if (category === "awards") {
    return "event-specialist";
  }
  if (Math.abs(imbalance) > 0.18) {
    return "liquidity-reversion";
  }
  return "consensus-fade";
}

function categoryConfidenceBoost(category: MarketCategory): number {
  return category === "macro" ? 10 : category === "politics" ? 8 : category === "awards" ? 6 : 0;
}

function describeRationale(
  category: MarketCategory,
  strategy: StrategyMode,
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  edge: number,
): string {
  return [
    capitalize(category),
    strategy.replace("-", " "),
    `edge ${pct(edge)}`,
    `imbalance ${round(ob.imbalance, 3)}`,
    `spread ${round(ob.spread, 3)}`,
    `vol ${usd(market.volume)}`,
  ].join(" | ");
}

function normalizeConviction(value: unknown): Conviction {
  return value === "Active" || value === "Prepare" ? value : "Monitor";
}

function normalizeStrategy(value: unknown, fallback: StrategyMode): StrategyMode {
  return value === "event-specialist" || value === "liquidity-reversion" || value === "consensus-fade" ? value : fallback;
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
      rationale: "Macro | consensus fade | seeded review data",
    },
    {
      market: "Will Gavin Newsom enter the 2028 race before Labor Day?",
      slug: "newsom-2028-before-labor-day",
      side: "NO",
      edge: 0.071,
      model_prob: 0.433,
      entry_price: 0.621,
      size_usdc: 18.5,
      expiry: "Sep 08, 2026",
      confidence: 71,
      status: "Demo",
      volume: 175000,
      liquidity: 42000,
      imbalance: -0.241,
      spread: 0.009,
      category: "politics",
      strategy: "consensus-fade",
      rationale: "Politics | consensus fade | seeded review data",
    },
    {
      market: "Will Cannes Palme d'Or go to a first-time winner?",
      slug: "cannes-palme-first-time-winner",
      side: "YES",
      edge: 0.063,
      model_prob: 0.587,
      entry_price: 0.524,
      size_usdc: 14,
      expiry: "May 24, 2026",
      confidence: 63,
      status: "Demo",
      volume: 132000,
      liquidity: 35800,
      imbalance: 0.226,
      spread: 0.015,
      category: "awards",
      strategy: "event-specialist",
      rationale: "Awards | event specialist | seeded review data",
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
    pill: "Minimal paper-trading desk in demo mode",
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
      { time: shortTime(new Date()), title: "Focused scanner", detail: "The desk only ranks politics, macro, and awards markets." },
      { time: shortTime(new Date()), title: "Paper trading only", detail: "No live orders are placed from the deployed Worker." },
    ],
  };
}

function demoResearchState(detail: string): ResearchState {
  const updatedAt = formatTimestamp(new Date());
  return {
    updatedAt,
    source: "demo",
    stale: false,
    demoMode: true,
    briefs: [
      {
        category: "macro",
        strategy: "consensus-fade",
        conviction: "Active",
        impactScore: 84,
        updatedAtTs: Date.now(),
        updatedAt,
        headline: "Fed path looks cleaner than the market narrative suggests",
        thesis: "Short-dated rates markets tend to overreact to one labor or inflation print. The better setup is often to fade abrupt consensus swings and wait for repricing into the next macro release.",
        risk: "A genuine break in inflation or labor trends can invalidate the fade quickly.",
        watchSignals: ["CPI surprise vs consensus", "Fed speaker tone shift", "2Y Treasury move after the release"],
        citations: [
          { title: "Federal Reserve", url: "https://www.federalreserve.gov/", source: "federalreserve.gov" },
          { title: "Bureau of Labor Statistics", url: "https://www.bls.gov/", source: "bls.gov" },
        ],
        source: "demo",
        stale: false,
      },
      {
        category: "politics",
        strategy: "consensus-fade",
        conviction: "Prepare",
        impactScore: 71,
        updatedAtTs: Date.now(),
        updatedAt,
        headline: "The crowded lane is often the wrong lane in narrative-heavy races",
        thesis: "Politics markets frequently price headlines faster than procedural reality. Candidate filing dates, delegate math, and donor constraints matter more than the loudest daily narrative.",
        risk: "A sudden endorsement cascade or legal shock can justify the consensus move.",
        watchSignals: ["Official filing deadlines", "Delegate or primary rules changes", "Large donor and endorsement moves"],
        citations: [
          { title: "FiveThirtyEight", url: "https://abcnews.go.com/538", source: "abcnews.go.com" },
          { title: "AP News Politics", url: "https://apnews.com/politics", source: "apnews.com" },
        ],
        source: "demo",
        stale: false,
      },
      {
        category: "awards",
        strategy: "event-specialist",
        conviction: "Monitor",
        impactScore: 63,
        updatedAtTs: Date.now(),
        updatedAt,
        headline: "Awards edges come from information timing, not broad market activity",
        thesis: "Festival reactions, guild momentum, and campaign sequencing usually matter before mass-market narratives catch up. The edge is narrow but real when category specialization is disciplined.",
        risk: "Seasonal markets can stay illiquid and noisy for long stretches.",
        watchSignals: ["Festival jury reactions", "Guild nomination surprises", "Distributor campaign changes"],
        citations: [
          { title: "Variety Awards", url: "https://variety.com/v/awards/", source: "variety.com" },
          { title: "The Hollywood Reporter Awards", url: "https://www.hollywoodreporter.com/c/awards/", source: "hollywoodreporter.com" },
        ],
        source: "demo",
        stale: false,
      },
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
          title: `${capitalize(top.category)} idea ready`,
          detail: `${top.side} ${top.slug} | ${top.strategy} | edge ${top.edge.toFixed(3)} | size ${usd(top.size_usdc)}.`,
        }
      : { time, title: "No active signals", detail: "The latest focused scan did not return any opportunities above the edge threshold." },
    { time, title: `Scanner focused on ${FOCUS_CATEGORIES.join(", ")}`, detail: "The desk ignores general-purpose markets and favors specialized categories only." },
    { time, title: demoMode ? "Demo mode active" : "Cloudflare cron enabled", detail: demoMode ? "Serving fallback data." : "Worker cron refreshes scans and research on a schedule." },
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

function sourceHost(url?: string): string {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "source";
  } catch {
    return "source";
  }
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeWatchSignal(value: string): string {
  return value
    .replace(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*\)/g, "")
    .trim();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

async function cacheJson(store: KVNamespace, key: string, payload: unknown, ttlSeconds: number): Promise<void> {
  await store.put(key, JSON.stringify(payload), { expirationTtl: ttlSeconds });
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
