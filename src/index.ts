type MarketCategory = "politics" | "macro" | "awards" | "sports" | "crypto" | "other";
type StrategyMode = "consensus-fade" | "event-specialist" | "liquidity-reversion";
type Conviction = "Monitor" | "Prepare" | "Active";
type ScanPreset = "strict" | "balanced" | "discovery";
type TradeTier = "A" | "B" | "C" | "Probe";

type Market = {
  condition_id: string;
  gamma_id: string;
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
  condition_id: string;
  market: string;
  slug: string;
  side: "YES" | "NO";
  edge: number;
  market_prob: number;
  expected_value: number;
  odds_movement: number;
  entry_timing: string;
  model_prob: number;
  entry_price: number;
  execution_book: string;
  best_available_price: number;
  price_improvement: number;
  book_count: number;
  size_usdc: number;
  expiry: string;
  hours_to_expiry: number;
  confidence: number;
  status: string;
  volume: number;
  liquidity: number;
  imbalance: number;
  spread: number;
  category: MarketCategory;
  strategy: StrategyMode;
  rationale: string;
  quality_score: number;
  market_quality: number;
  setup_quality: number;
  trade_tier: TradeTier;
  flags: string[];
  is_probe: boolean;
  risk_score: number;
  risk_flags: string[];
};

type Snapshot = {
  updatedAt: string;
  preset: ScanPreset;
  threshold: string;
  balance: string;
  bestEdge: string;
  avgEdge: string;
  signalCount: number;
  strictSignalCount: number;
  probeSignalCount: number;
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

type AnalyticsBucket = {
  key: string;
  totalBets: number;
  openBets: number;
  resolvedBets: number;
  wins: number;
  winRate: number;
  totalPnl: number;
  exposure: number;
  avgEdge: number;
};

type AnalyticsState = {
  updatedAt: string;
  summary: {
    totalBets: number;
    resolvedBets: number;
    openBets: number;
    openExposure: number;
    avgOpenEdge: number;
    avgResolvedPnl: number;
    roi: number;
    maxDrawdown: number;
    avgClv: number;
    clvWinRate: number;
    avgExpectedValue: number;
    calibrationError: number;
    stopLossActive: boolean;
    largestCorrelationGroup: number;
    strictOpenCount: number;
    probeOpenCount: number;
  };
  byCategory: AnalyticsBucket[];
  byStrategy: AnalyticsBucket[];
  byPriceBand: AnalyticsBucket[];
  byTimeToExpiry: AnalyticsBucket[];
  insights: string[];
};

type BacktestThreshold = {
  minEdge: number;
  bets: number;
  roi: number;
  winRate: number;
  totalPnl: number;
  maxDrawdown: number;
};

type StrategyBacktest = {
  strategy: string;
  bestMinEdge: number;
  recommendedKellyFraction: number;
  driftStatus: "insufficient-data" | "stable" | "watch" | "drift";
  calibrationError: number;
  recentRoi: number;
  baselineRoi: number;
  thresholds: BacktestThreshold[];
};

type BacktestState = {
  updatedAt: string;
  resolvedBets: number;
  strategies: StrategyBacktest[];
  recommendations: string[];
};

type BookQuote = {
  book: string;
  slug: string;
  side: "YES" | "NO";
  price: number;
  deepLink?: string;
  updatedAt?: string;
};

type BookMarketState = {
  updatedAt: string;
  source: "live" | "default";
  quoteCount: number;
  books: string[];
  quotes: BookQuote[];
};

type ModelState = {
  version: string;
  trainedAt: string;
  resolvedBets: number;
  source: "trained" | "default";
  categoryAdjustments: Partial<Record<MarketCategory, number>>;
  strategyAdjustments: Partial<Record<StrategyMode, number>>;
  edgeFloorAdjustments: Partial<Record<StrategyMode, number>>;
  kellyFraction: number;
  driftStatus: "insufficient-data" | "stable" | "watch" | "drift";
  recommendations: string[];
};

type PortfolioGuard = {
  allowNewBets: boolean;
  severity: "clear" | "watch" | "blocked";
  reasons: string[];
  exposureMultiplier: number;
};

type DiscoveryResult = {
  title: string;
  slug: string;
  eventUrl: string;
  description: string;
  volume: number;
  openInterest: number;
  liquidity: number;
  volume24hr: number;
  tags: string[];
  context: string;
  topMarket?: string;
};

type DiscoveryState = {
  query: string;
  updatedAt: string;
  source: "live" | "cache" | "demo";
  results: DiscoveryResult[];
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

type SourcePreview = {
  url: string;
  host: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt?: string;
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

type PaperBet = {
  betKey: string;
  conditionId: string;
  slug: string;
  market: string;
  category: MarketCategory;
  strategy: StrategyMode;
  side: "YES" | "NO";
  status: "open" | "resolved";
  confidence: number;
  edge: number;
  marketProb?: number;
  expectedValue?: number;
  oddsMovement?: number;
  entryTiming?: string;
  modelProb: number;
  entryPrice: number;
  executionBook?: string;
  bestAvailablePrice?: number;
  priceImprovement?: number;
  bookCount?: number;
  sizeUsdc: number;
  expiry: string;
  hoursToExpiry?: number;
  riskScore?: number;
  riskFlags?: string[];
  openedAtTs: number;
  openedAt: string;
  resolvedAtTs?: number;
  resolvedAt?: string;
  result?: 0 | 0.5 | 1;
  pnl?: number;
  closingPrice?: number;
  clv?: number;
  resolutionSource?: string;
};

type ResultsState = {
  summary: {
    totalBets: number;
    openBets: number;
    resolvedBets: number;
    wins: number;
    winRate: number;
    totalPnl: number;
  };
  recent: PaperBet[];
  open: PaperBet[];
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
  EXTERNAL_ODDS_URL?: string;
  KALSHI_MARKETS_ENABLED?: string;
  MIN_VOLUME: string;
  MIN_LIQUIDITY: string;
  KELLY_FRACTION: string;
  MAX_TRADE_USDC: string;
  EDGE_THRESHOLD: string;
  SNAPSHOT_LIMIT: string;
};

const GAMMA_URL = "https://gamma-api.polymarket.com";
const CLOB_URL = "https://clob.polymarket.com";
const DATA_URL = "https://data-api.polymarket.com";
const KALSHI_URL = "https://external-api.kalshi.com/trade-api/v2";
const EXA_ANSWER_URL = "https://api.exa.ai/answer";
const SNAPSHOT_CACHE_KEY = "snapshot:latest";
const RESEARCH_CACHE_KEY = "research:latest";
const RESULTS_CACHE_KEY = "results:latest";
const ANALYTICS_CACHE_KEY = "analytics:latest";
const MODEL_STATE_KEY = "model:state";
const DISCOVERY_CACHE_PREFIX = "discovery:";
const SNAPSHOT_CACHE_TTL_SECONDS = 60 * 30;
const RESEARCH_CACHE_TTL_SECONDS = 60 * 60 * 6;
const RESULTS_CACHE_TTL_SECONDS = 60 * 10;
const ANALYTICS_CACHE_TTL_SECONDS = 60 * 10;
const FOCUS_CATEGORIES: MarketCategory[] = ["politics", "macro", "awards", "sports"];

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
    const preset = parsePreset(url.searchParams.get("preset"));

    if (url.pathname === "/api/health") {
      const [snapshot, research, results] = await Promise.all([getSnapshot(env), getResearch(env), getResults(env)]);
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
        totalPaperBets: results.summary.totalBets,
        resolvedPaperBets: results.summary.resolvedBets,
      });
    }

    if (url.pathname === "/api/history") {
      const history = await getHistory(env);
      return json({ history });
    }

    if (url.pathname === "/api/discovery") {
      const query = (url.searchParams.get("q") ?? "election").trim();
      const discovery = await getDiscovery(env, query || "election");
      return json(discovery);
    }

    if (url.pathname === "/api/analytics") {
      const analytics = await getAnalytics(env);
      return json(analytics);
    }

    if (url.pathname === "/api/backtest") {
      const backtest = await getBacktest(env);
      return json(backtest);
    }

    if (url.pathname === "/api/model") {
      const model = await getModelState(env);
      return json(model);
    }

    if (url.pathname === "/api/model/retrain") {
      const model = await retrainModel(env);
      return json(model);
    }

    if (url.pathname === "/api/books") {
      const books = await getBookMarketState(env);
      return json(books);
    }

    if (url.pathname === "/api/source-preview") {
      const target = url.searchParams.get("url");
      if (!target) {
        return json({ error: "url query parameter is required" }, { status: 400 });
      }
      try {
        const preview = await fetchSourcePreview(target);
        return json(preview);
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "Failed to fetch source preview" },
          { status: 502 },
        );
      }
    }

    if (url.pathname === "/api/results") {
      ctx.waitUntil(resolveOpenPaperBets(env));
      const results = await getResults(env);
      return json(results);
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
      const [snapshot, research] = await Promise.all([
        preset === "balanced" ? refreshSnapshot(env) : previewSnapshot(env, preset),
        refreshResearch(env),
      ]);
      if (preset === "balanced") {
        await resolveOpenPaperBets(env);
      }
      const results = await getResults(env);
      const analytics = await getAnalytics(env);
      return json({ snapshot, research, results, analytics });
    }

    if (url.pathname === "/api/snapshot") {
      ctx.waitUntil(Promise.all([refreshResearchIfStale(env), resolveOpenPaperBets(env)]));
      const snapshot = preset === "balanced" ? await getSnapshot(env) : await previewSnapshot(env, preset);
      return json(snapshot);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(Promise.all([refreshSnapshot(env), refreshResearch(env), resolveOpenPaperBets(env), retrainModel(env)]));
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
    const snapshot = await collectLiveSnapshot(env, "balanced");
    await persistSnapshot(env, snapshot);
    await persistPaperBetsFromSnapshot(env, snapshot);
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

async function previewSnapshot(env: WorkerEnv, preset: ScanPreset): Promise<Snapshot> {
  try {
    return await collectLiveSnapshot(env, preset);
  } catch {
    const base = await getSnapshot(env);
    return { ...base, preset, pill: `Serving cached balanced snapshot while ${preset} preview recovers`, stale: true };
  }
}

async function collectLiveSnapshot(env: WorkerEnv, preset: ScanPreset): Promise<Snapshot> {
  const limit = Math.max(Number.parseInt(env.SNAPSHOT_LIMIT, 10) || 60, 120);
  const markets = await fetchActiveMarkets(env, limit);
  if (!markets.length) {
    return demoSnapshot("No live markets available. Serving seeded review data.");
  }

  const walletBalance = Math.max(Number.parseFloat(env.MAX_TRADE_USDC) * 10, 100);
  const modelState = await getModelState(env);
  const portfolioGuard = await getPortfolioGuard(env, modelState);
  const bookState = await getBookMarketState(env);
  const scanned = await Promise.all(markets.map(async (market) => {
    const ob = await fetchOrderBookFeatures(market.yes_token_id);
    const signal = generateSignal(market, ob, walletBalance, env, preset, modelState, bookState);
    if (signal) {
      return { kind: "signal" as const, value: await enrichSignalWithTiming(signal, market) };
    }
    const probe = generateProbeSignal(market, ob, walletBalance, preset, modelState, bookState);
    return probe ? { kind: "probe" as const, value: await enrichSignalWithTiming(probe, market) } : null;
  }));
  const signals = scanned.filter((item): item is { kind: "signal"; value: Signal } => item?.kind === "signal").map((item) => item.value);
  const probes = scanned.filter((item): item is { kind: "probe"; value: Signal } => item?.kind === "probe").map((item) => item.value);

  signals.sort((a, b) => b.edge - a.edge);
  probes.sort((a, b) => b.edge - a.edge);
  const riskFilteredSignals = portfolioGuard.allowNewBets ? applyPortfolioRiskControls(signals, walletBalance * portfolioGuard.exposureMultiplier) : [];
  const riskFilteredProbes = portfolioGuard.allowNewBets ? applyPortfolioRiskControls(probes, walletBalance * 0.35 * portfolioGuard.exposureMultiplier) : [];
  const displayedSignals = portfolioGuard.allowNewBets ? (riskFilteredSignals.length ? riskFilteredSignals : riskFilteredProbes.slice(0, 6)) : [];
  const focusMarkets = markets.filter((market) => FOCUS_CATEGORIES.includes(classifyCategory(market.question)));
  const bestEdge = displayedSignals[0]?.edge ?? 0;
  const avgEdge = displayedSignals.length ? displayedSignals.reduce((sum, signal) => sum + signal.edge, 0) / displayedSignals.length : 0;
  const avgConfidence = displayedSignals.length
    ? Math.round(displayedSignals.reduce((sum, signal) => sum + signal.confidence, 0) / displayedSignals.length)
    : 0;
  const maxPosition = displayedSignals.reduce((max, signal) => Math.max(max, signal.size_usdc), 0);
  const now = new Date();

  return {
    updatedAt: formatTimestamp(now),
    preset,
    threshold: pct(Number.parseFloat(env.EDGE_THRESHOLD)),
    balance: usd(walletBalance),
    bestEdge: pct(bestEdge),
    avgEdge: pct(avgEdge),
    signalCount: displayedSignals.length,
    strictSignalCount: signals.length,
    probeSignalCount: probes.length,
    marketCount: focusMarkets.length,
    confidence: `${avgConfidence}/99`,
    maxPosition: usd(maxPosition),
    pill:
      !portfolioGuard.allowNewBets
        ? `Risk guard blocked new entries: ${portfolioGuard.reasons.join(", ")}`
        : riskFilteredSignals.length
        ? `${capitalize(preset)} mode surfaced ${riskFilteredSignals.length} risk-approved ideas`
        : riskFilteredProbes.length
          ? `${capitalize(preset)} mode is showing probe ideas only`
          : `${capitalize(preset)} mode is preserving capital and passing on weak setups`,
    source: "live",
    demoMode: false,
    stale: false,
    signals: displayedSignals,
    markets: focusMarkets.slice(0, 8).map((market) => ({
      title: market.question,
      volume: usd(market.volume),
      yes: `YES ${market.yes_price.toFixed(2)}`,
      category: `${classifyCategory(market.question)} · ${bookState.books.length || 1} book${(bookState.books.length || 1) === 1 ? "" : "s"}`,
    })),
    activity: buildActivity(displayedSignals, now, false),
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
    .filter((item) => !/(^|\.)polymarket\.com$/.test(item.source))
    .filter((item) => !/(^|\.)kalshi\.com$/.test(item.source))
    .filter((item) => !/(^|\.)predictit\.org$/.test(item.source))
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
  const raw = (await fetchJsonCached(`${GAMMA_URL}/markets?${params.toString()}`, 90)) as Array<Record<string, unknown>>;
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
          gamma_id: String(market.id ?? ""),
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
  const response = await fetchCached(`${CLOB_URL}/book?token_id=${encodeURIComponent(tokenId)}`, 20);
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

async function fetchPriceHistory(gammaId: string, fidelity = 60): Promise<number[]> {
  if (!gammaId) {
    return [];
  }
  try {
    const params = new URLSearchParams({ market: gammaId, fidelity: String(fidelity) });
    const payload = (await fetchJsonCached(`${DATA_URL}/prices-history?${params.toString()}`, 60 * 5)) as { history?: Array<{ p?: number | string }> };
    return (payload.history ?? [])
      .map((point) => Number(point.p))
      .filter((price) => Number.isFinite(price) && price > 0 && price < 1);
  } catch {
    return [];
  }
}

async function enrichSignalWithTiming(signal: Signal, market: Market): Promise<Signal> {
  const history = await fetchPriceHistory(market.gamma_id);
  if (history.length < 2) {
    return signal;
  }
  const first = history[0];
  const last = history[history.length - 1];
  const yesMovement = last - first;
  const oddsMovement = signal.side === "YES" ? yesMovement : -yesMovement;
  return {
    ...signal,
    odds_movement: round(oddsMovement, 4),
    entry_timing: entryTimingFor(oddsMovement),
  };
}

function generateSignal(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  walletBalance: number,
  env: WorkerEnv,
  preset: ScanPreset,
  modelState: ModelState,
  bookState: BookMarketState,
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

  if (market.yes_price < 0.02 || market.yes_price > 0.98) {
    return null;
  }

  if (market.volume < Number.parseFloat(env.MIN_VOLUME) || ob.liquidity < Number.parseFloat(env.MIN_LIQUIDITY)) {
    return null;
  }

  const quality = assessSignalQuality(market, ob, category, preset, false);
  const config = presetConfig(preset);
  if (ob.spread > config.maxSpread || quality.marketQuality < config.minMarketQuality) {
    return null;
  }

  const modelProb = estimateModelProbability(category, strategy, market.yes_price, ob.imbalance, ob.spread, modelState);
  const yesEdge = modelProb - market.yes_price;
  const noEdge = (1 - modelProb) - market.no_price;
  const edge = Math.max(yesEdge, noEdge);
  const threshold = effectiveThreshold(category, Number.parseFloat(env.EDGE_THRESHOLD), preset) + (modelState.edgeFloorAdjustments[strategy] ?? 0);

  if (edge < threshold || edge > config.maxEdge) {
    return null;
  }

  const side = yesEdge >= noEdge ? "YES" : "NO";
  const baseEntryPrice = side === "YES" ? market.yes_price : market.no_price;
  const execution = findBestExecution(market, side, baseEntryPrice, bookState);
  const entryPrice = execution.price;
  const sideModelProb = side === "YES" ? modelProb : 1 - modelProb;
  const marketProb = entryPrice;
  const confidence = Math.min(99, Math.max(15, Math.round(edge * 1000 + categoryConfidenceBoost(category))));
  const sizeUsdc = computeKellySize(modelProb, market.yes_price, side, walletBalance, env, modelState);
  const setupQuality = computeSetupQuality(edge, confidence, strategy, quality.flags, false);
  const qualityScore = clamp(Math.round((quality.marketQuality * 0.55) + (setupQuality * 0.45)), 1, 99);
  const tradeTier = determineTradeTier(qualityScore, false);
  const risk = assessExecutionRisk(market, ob, sizeUsdc, walletBalance, quality.flags, false);
  if (risk.blocked) {
    return null;
  }

  return {
    condition_id: market.condition_id,
    market: market.question,
    slug: market.slug,
    side,
    edge: round(edge, 4),
    market_prob: round(marketProb, 4),
    expected_value: round(computeExpectedValue(sizeUsdc, sideModelProb, marketProb), 2),
    odds_movement: 0,
    entry_timing: "untracked",
    model_prob: round(modelProb, 4),
    entry_price: round(entryPrice, 3),
    execution_book: execution.book,
    best_available_price: round(execution.price, 3),
    price_improvement: round(baseEntryPrice - execution.price, 4),
    book_count: execution.bookCount,
    size_usdc: sizeUsdc,
    expiry: formatExpiry(expiryRaw),
    hours_to_expiry: round(hoursUntil(expiryRaw), 1),
    confidence,
    status: "Active",
    volume: market.volume,
    liquidity: market.liquidity,
    imbalance: round(ob.imbalance, 4),
    spread: round(ob.spread, 4),
    category,
    strategy,
    rationale: describeRationale(category, strategy, market, ob, edge, quality.flags, qualityScore),
    quality_score: qualityScore,
    market_quality: quality.marketQuality,
    setup_quality: setupQuality,
    trade_tier: tradeTier,
    flags: quality.flags,
    is_probe: false,
    risk_score: risk.score,
    risk_flags: risk.flags,
  };
}

function estimateModelProbability(
  category: MarketCategory,
  strategy: StrategyMode,
  marketPrice: number,
  imbalance: number,
  spread: number,
  modelState?: ModelState,
): number {
  const categoryBias =
    category === "macro" ? 0.24 :
    category === "politics" ? 0.18 :
    category === "awards" ? 0.14 :
    category === "sports" ? 0.08 :
    0.1;
  const strategyBias =
    strategy === "consensus-fade" ? 0.3 :
    strategy === "event-specialist" ? 0.2 :
    0.12;

  const fadeTerm = (0.5 - marketPrice) * categoryBias;
  const orderBookTerm = imbalance * (0.025 + strategyBias / 10);
  const spreadPenalty = spread * 0.25;
  const learnedAdjustment = (modelState?.categoryAdjustments[category] ?? 0) + (modelState?.strategyAdjustments[strategy] ?? 0);

  return clamp(marketPrice + fadeTerm + orderBookTerm - spreadPenalty + learnedAdjustment, 0.05, 0.95);
}

function computeKellySize(
  modelProb: number,
  marketPrice: number,
  side: "YES" | "NO",
  walletBalance: number,
  env: WorkerEnv,
  modelState?: ModelState,
): number {
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

  const liveKellyFraction = modelState?.kellyFraction ?? Number.parseFloat(env.KELLY_FRACTION);
  const sized = f * liveKellyFraction * walletBalance;
  return round(Math.min(sized, Number.parseFloat(env.MAX_TRADE_USDC)), 2);
}

function computeExpectedValue(stake: number, winProb: number, price: number): number {
  if (stake <= 0 || price <= 0 || price >= 1) {
    return 0;
  }
  const expectedReturnPerDollar = (winProb - price) / price;
  return stake * expectedReturnPerDollar;
}

function assessExecutionRisk(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  sizeUsdc: number,
  walletBalance: number,
  qualityFlags: string[],
  isProbe: boolean,
): { score: number; flags: string[]; blocked: boolean } {
  const flags = [...qualityFlags];
  const positionPct = walletBalance > 0 ? sizeUsdc / walletBalance : 1;
  const bookImpact = ob.liquidity > 0 ? sizeUsdc / ob.liquidity : 1;
  const daysLeft = daysUntil(market.end_date_iso ?? market.end_date);

  if (positionPct > 0.12) flags.push("Position cap pressure");
  if (bookImpact > 0.015) flags.push("Slippage risk");
  if (ob.spread > 0.1) flags.push("Execution spread risk");
  if (Number.isFinite(daysLeft) && daysLeft < 0.25) flags.push("Resolution timing risk");

  const riskScore = clamp(
    Math.round(
      positionPct * 260 +
        bookImpact * 2400 +
        ob.spread * 180 +
        Math.abs(ob.imbalance) * 18 +
        (isProbe ? 10 : 0) +
        flags.length * 4,
    ),
    1,
    99,
  );

  return {
    score: riskScore,
    flags: [...new Set(flags)].slice(0, 6),
    blocked: !isProbe && (positionPct > 0.18 || bookImpact > 0.04 || ob.spread > 0.2),
  };
}

function applyPortfolioRiskControls(signals: Signal[], walletBalance: number): Signal[] {
  const maxTotalExposure = Math.max(walletBalance * 0.35, 25);
  const maxCategoryExposure = Math.max(walletBalance * 0.18, 15);
  const maxCorrelatedPositions = 3;
  const categoryExposure = new Map<MarketCategory, number>();
  const correlationCounts = new Map<string, number>();
  let totalExposure = 0;
  const approved: Signal[] = [];

  for (const signal of signals) {
    const nextTotalExposure = totalExposure + signal.size_usdc;
    const nextCategoryExposure = (categoryExposure.get(signal.category) ?? 0) + signal.size_usdc;
    const correlationKey = `${signal.category}:${signal.strategy}`;
    const nextCorrelationCount = (correlationCounts.get(correlationKey) ?? 0) + 1;

    if (nextTotalExposure > maxTotalExposure || nextCategoryExposure > maxCategoryExposure || nextCorrelationCount > maxCorrelatedPositions) {
      continue;
    }

    approved.push(signal);
    totalExposure = nextTotalExposure;
    categoryExposure.set(signal.category, nextCategoryExposure);
    correlationCounts.set(correlationKey, nextCorrelationCount);
  }

  return approved;
}

function findBestExecution(
  market: Market,
  side: "YES" | "NO",
  fallbackPrice: number,
  bookState: BookMarketState,
): { book: string; price: number; bookCount: number } {
  const normalizedSlug = market.slug.toLowerCase();
  const sideQuotes = bookState.quotes.filter((quote) => quote.slug.toLowerCase() === normalizedSlug && quote.side === side);
  const polymarketQuote = { book: "Polymarket", slug: market.slug, side, price: fallbackPrice } satisfies BookQuote;
  const quotes = [polymarketQuote, ...sideQuotes].filter((quote) => quote.price > 0 && quote.price < 1);
  const best = quotes.sort((a, b) => a.price - b.price)[0] ?? polymarketQuote;
  return {
    book: best.book,
    price: best.price,
    bookCount: new Set(quotes.map((quote) => quote.book)).size,
  };
}

function generateProbeSignal(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  walletBalance: number,
  preset: ScanPreset,
  modelState: ModelState,
  bookState: BookMarketState,
): Signal | null {
  const config = presetConfig(preset);
  if (!config.allowProbes) {
    return null;
  }
  const category = classifyCategory(market.question);
  if (!FOCUS_CATEGORIES.includes(category)) {
    return null;
  }

  const strategy = chooseStrategy(category, ob.imbalance);
  const expiryRaw = market.end_date_iso ?? market.end_date;
  if (!passesTimeWindow(category, expiryRaw)) {
    return null;
  }

  if (market.yes_price < 0.01 || market.yes_price > 0.99) {
    return null;
  }

  const side = market.yes_price <= 0.18 ? "YES" : market.yes_price >= 0.82 ? "NO" : null;
  if (!side) {
    return null;
  }

  const quality = assessSignalQuality(market, ob, category, preset, true);
  if (ob.spread > config.maxProbeSpread || quality.marketQuality < config.minProbeMarketQuality) {
    return null;
  }

  const learnedAdjustment = (modelState.categoryAdjustments[category] ?? 0) + (modelState.strategyAdjustments[strategy] ?? 0);
  const modelProb = side === "YES"
    ? clamp(market.yes_price + 0.03 + learnedAdjustment, 0.03, 0.97)
    : clamp(market.yes_price - 0.03 + learnedAdjustment, 0.03, 0.97);
  const edge = Math.abs(modelProb - market.yes_price);
  const baseEntryPrice = side === "YES" ? market.yes_price : market.no_price;
  const execution = findBestExecution(market, side, baseEntryPrice, bookState);
  const entryPrice = execution.price;
  const sideModelProb = side === "YES" ? modelProb : 1 - modelProb;
  const marketProb = entryPrice;
  const setupQuality = computeSetupQuality(edge, 38, strategy, quality.flags, true);
  const qualityScore = clamp(Math.round((quality.marketQuality * 0.6) + (setupQuality * 0.4)), 1, 99);
  const sizeUsdc = round(Math.min(walletBalance * 0.02, 8), 2);
  const risk = assessExecutionRisk(market, ob, sizeUsdc, walletBalance, quality.flags, true);

  return {
    condition_id: market.condition_id,
    market: market.question,
    slug: market.slug,
    side,
    edge: round(edge, 4),
    market_prob: round(marketProb, 4),
    expected_value: round(computeExpectedValue(sizeUsdc, sideModelProb, marketProb), 2),
    odds_movement: 0,
    entry_timing: "untracked",
    model_prob: round(modelProb, 4),
    entry_price: round(entryPrice, 3),
    execution_book: execution.book,
    best_available_price: round(execution.price, 3),
    price_improvement: round(baseEntryPrice - execution.price, 4),
    book_count: execution.bookCount,
    size_usdc: sizeUsdc,
    expiry: formatExpiry(expiryRaw),
    hours_to_expiry: round(hoursUntil(expiryRaw), 1),
    confidence: 38,
    status: "Probe",
    volume: market.volume,
    liquidity: market.liquidity,
    imbalance: round(ob.imbalance, 4),
    spread: round(ob.spread, 4),
    category,
    strategy,
    rationale: describeRationale(category, strategy, market, ob, edge, quality.flags, qualityScore),
    quality_score: qualityScore,
    market_quality: quality.marketQuality,
    setup_quality: setupQuality,
    trade_tier: "Probe",
    flags: quality.flags,
    is_probe: true,
    risk_score: risk.score,
    risk_flags: risk.flags,
  };
}

function signalToPaperBet(signal: Signal, openedAt: string): PaperBet {
  const openedAtTs = Date.parse(openedAt);
  return {
    betKey: `${signal.slug}:${signal.side}:${signal.entry_price}:${openedAt}`,
    conditionId: signal.condition_id,
    slug: signal.slug,
    market: signal.market,
    category: signal.category,
    strategy: signal.strategy,
    side: signal.side,
    status: "open",
    confidence: signal.confidence,
    edge: signal.edge,
    marketProb: signal.market_prob,
    expectedValue: signal.expected_value,
    oddsMovement: signal.odds_movement,
    entryTiming: signal.entry_timing,
    modelProb: signal.model_prob,
    entryPrice: signal.entry_price,
    executionBook: signal.execution_book,
    bestAvailablePrice: signal.best_available_price,
    priceImprovement: signal.price_improvement,
    bookCount: signal.book_count,
    sizeUsdc: signal.size_usdc,
    expiry: signal.expiry,
    hoursToExpiry: signal.hours_to_expiry,
    riskScore: signal.risk_score,
    riskFlags: signal.risk_flags,
    openedAtTs: Number.isFinite(openedAtTs) ? openedAtTs : Date.now(),
    openedAt,
  };
}

async function fetchMarketResolution(
  slug: string,
  conditionId: string,
): Promise<{ result: 0 | 0.5 | 1 | null; source: string; yesPrice?: number; noPrice?: number } | null> {
  const endpoints = [
    `${GAMMA_URL}/markets?slug=${encodeURIComponent(slug)}`,
    `${GAMMA_URL}/markets?condition_id=${encodeURIComponent(conditionId)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetchCached(endpoint, 120);
      if (!response.ok) {
        continue;
      }
      const payload = (await response.json()) as Array<Record<string, unknown>>;
      const market = payload?.[0];
      if (!market) {
        continue;
      }

      if (!market.resolved) {
        return { result: null, source: "unresolved" };
      }
      const closing = extractClosingPrices(market);

      const resolution = String(market.resolution ?? "").toLowerCase();
      if (resolution === "yes" || resolution === "1") {
        return { result: 1, source: "resolution", ...closing };
      }
      if (resolution === "no" || resolution === "0") {
        return { result: 0, source: "resolution", ...closing };
      }
      if (["push", "void", "draw", "cancelled", "canceled", "50/50"].includes(resolution)) {
        return { result: 0.5, source: "push", yesPrice: 0.5, noPrice: 0.5 };
      }

      const tokens = Array.isArray(market.tokens) ? (market.tokens as Array<Record<string, unknown>>) : [];
      for (const token of tokens) {
        const outcome = String(token.outcome ?? "").toLowerCase();
        const price = Number(token.price ?? 0);
        if (price >= 0.99) {
          return { result: outcome === "yes" ? 1 : 0, source: "token-price", ...closing };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractClosingPrices(market: Record<string, unknown>): { yesPrice?: number; noPrice?: number } {
  const tokens = Array.isArray(market.tokens) ? (market.tokens as Array<Record<string, unknown>>) : [];
  const yesToken = tokens.find((token) => String(token.outcome ?? "").toLowerCase() === "yes");
  const noToken = tokens.find((token) => String(token.outcome ?? "").toLowerCase() === "no");
  const yesPrice = Number(yesToken?.price);
  const noPrice = Number(noToken?.price);
  return {
    yesPrice: Number.isFinite(yesPrice) ? yesPrice : undefined,
    noPrice: Number.isFinite(noPrice) ? noPrice : undefined,
  };
}

async function fetchSourcePreview(url: string): Promise<SourcePreview> {
  assertPreviewUrl(url);
  const response = await fetchCached(url, 60 * 30, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "MoneyFlowDesk/1.0 (+https://moneyflow-desk.everyai-com.workers.dev)",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch source preview: ${response.status}`);
  }
  const html = await response.text();
  return {
    url,
    host: sourceHost(url),
    title: extractTagContent(html, "title") ?? sourceHost(url),
    description: extractMetaContent(html, "description") ?? extractMetaProperty(html, "og:description") ?? "",
    excerpt: extractBodyExcerpt(html),
    publishedAt:
      extractMetaProperty(html, "article:published_time") ??
      extractMetaProperty(html, "og:updated_time") ??
      undefined,
  };
}

function computePaperPnl(bet: PaperBet, result: 0 | 0.5 | 1): number {
  if (result === 0.5) {
    return 0;
  }
  const shares = bet.entryPrice > 0 ? bet.sizeUsdc / bet.entryPrice : 0;
  const won = (bet.side === "YES" && result === 1) || (bet.side === "NO" && result === 0);
  return round(won ? shares * (1 - bet.entryPrice) : -shares * bet.entryPrice, 2);
}

function closingPriceForBet(bet: PaperBet, resolution: { result: 0 | 0.5 | 1; yesPrice?: number; noPrice?: number }): number {
  const observed = bet.side === "YES" ? resolution.yesPrice : resolution.noPrice;
  if (typeof observed === "number" && Number.isFinite(observed)) {
    return round(observed, 4);
  }
  if (resolution.result === 0.5) {
    return 0.5;
  }
  const won = (bet.side === "YES" && resolution.result === 1) || (bet.side === "NO" && resolution.result === 0);
  return won ? 1 : 0;
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

async function getResults(env: WorkerEnv): Promise<ResultsState> {
  const cached = await env.SNAPSHOT_CACHE.get(RESULTS_CACHE_KEY, "json");
  if (cached) {
    return cached as ResultsState;
  }

  if (env.CONVEX_SITE_URL) {
    try {
      const response = await fetch(`${env.CONVEX_SITE_URL}/results?limit=20`);
      if (response.ok) {
        const payload = (await response.json()) as ResultsState;
        await cacheJson(env.SNAPSHOT_CACHE, RESULTS_CACHE_KEY, payload, RESULTS_CACHE_TTL_SECONDS);
        return payload;
      }
    } catch {
      // ignore and fall back
    }
  }

  const empty = emptyResultsState();
  await cacheJson(env.SNAPSHOT_CACHE, RESULTS_CACHE_KEY, empty, RESULTS_CACHE_TTL_SECONDS);
  return empty;
}

async function getAnalytics(env: WorkerEnv): Promise<AnalyticsState> {
  const cached = await env.SNAPSHOT_CACHE.get(ANALYTICS_CACHE_KEY, "json");
  if (cached) {
    return cached as AnalyticsState;
  }

  const results = await fetchResultsForAnalytics(env);
  const analytics = buildAnalytics(results);
  await cacheJson(env.SNAPSHOT_CACHE, ANALYTICS_CACHE_KEY, analytics, ANALYTICS_CACHE_TTL_SECONDS);
  return analytics;
}

async function getPortfolioGuard(env: WorkerEnv, modelState?: ModelState): Promise<PortfolioGuard> {
  const activeModelState = modelState ?? await getModelState(env);
  const analytics = await getAnalytics(env);
  const reasons: string[] = [];
  if (analytics.summary.stopLossActive) {
    reasons.push("stop-loss");
  }
  if (activeModelState.driftStatus === "drift") {
    reasons.push("model-drift");
  }
  if (analytics.summary.largestCorrelationGroup >= 4) {
    reasons.push("correlation-cap");
  }
  if (analytics.summary.openExposure > Number.parseFloat(env.MAX_TRADE_USDC) * 6) {
    reasons.push("exposure-cap");
  }

  const blocked = reasons.includes("stop-loss") || reasons.includes("model-drift") || reasons.includes("exposure-cap");
  const watch = activeModelState.driftStatus === "watch" || analytics.summary.largestCorrelationGroup >= 3;
  return {
    allowNewBets: !blocked,
    severity: blocked ? "blocked" : watch ? "watch" : "clear",
    reasons: reasons.length ? reasons : ["clear"],
    exposureMultiplier: watch ? 0.5 : 1,
  };
}

async function getBacktest(env: WorkerEnv): Promise<BacktestState> {
  const results = await fetchResultsForAnalytics(env);
  return buildBacktest(results);
}

async function getModelState(env: WorkerEnv): Promise<ModelState> {
  const cached = await env.SNAPSHOT_CACHE.get(MODEL_STATE_KEY, "json");
  if (cached) {
    return cached as ModelState;
  }
  const model = defaultModelState();
  await cacheJson(env.SNAPSHOT_CACHE, MODEL_STATE_KEY, model, 60 * 60 * 24);
  return model;
}

async function getBookMarketState(env: WorkerEnv): Promise<BookMarketState> {
  const fallback: BookMarketState = {
    updatedAt: formatTimestamp(new Date()),
    source: "default",
    quoteCount: 0,
    books: ["Polymarket"],
    quotes: [],
  };
  const quoteSources = await Promise.all([
    env.EXTERNAL_ODDS_URL ? fetchExternalBookQuotes(env.EXTERNAL_ODDS_URL) : Promise.resolve([]),
    env.KALSHI_MARKETS_ENABLED === "true" ? fetchKalshiBookQuotes() : Promise.resolve([]),
  ]);
  const quotes = quoteSources.flat();
  if (!quotes.length) {
    return fallback;
  }

  const books = [...new Set(["Polymarket", ...quotes.map((quote) => quote.book)])];
  return {
    updatedAt: formatTimestamp(new Date()),
    source: "live",
    quoteCount: quotes.length,
    books,
    quotes,
  };
}

async function fetchExternalBookQuotes(url: string): Promise<BookQuote[]> {
  try {
    return normalizeExternalQuotes(await fetchJsonCached(url, 30));
  } catch {
    return [];
  }
}

async function fetchKalshiBookQuotes(): Promise<BookQuote[]> {
  try {
    const payload = (await fetchJsonCached(`${KALSHI_URL}/markets?limit=200&status=open`, 60)) as { markets?: Array<Record<string, unknown>> };
    return normalizeKalshiQuotes(payload.markets ?? []);
  } catch {
    return [];
  }
}

function normalizeExternalQuotes(payload: unknown): BookQuote[] {
  const rows =
    Array.isArray(payload) ? payload :
    payload && typeof payload === "object" && Array.isArray((payload as { quotes?: unknown[] }).quotes) ? (payload as { quotes: unknown[] }).quotes :
    [];

  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const side = String(record.side ?? "").toUpperCase();
    const price = Number(record.price ?? record.decimalPrice ?? record.probability);
    const slug = String(record.slug ?? record.marketSlug ?? "").trim();
    const book = String(record.book ?? record.source ?? "").trim();
    if ((side !== "YES" && side !== "NO") || !slug || !book || !Number.isFinite(price) || price <= 0 || price >= 1) {
      return [];
    }
    return [{
      book,
      slug,
      side,
      price,
      deepLink: typeof record.deepLink === "string" ? record.deepLink : undefined,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    } satisfies BookQuote];
  });
}

function normalizeKalshiQuotes(markets: Array<Record<string, unknown>>): BookQuote[] {
  return markets.flatMap((market) => {
    const title = String(market.title ?? market.ticker ?? "").trim();
    const ticker = String(market.ticker ?? "").trim();
    const yesAsk = Number(market.yes_ask_dollars);
    const noAsk = Number(market.no_ask_dollars);
    const slug = slugifyMarketTitle(title || ticker);
    const quotes: BookQuote[] = [];

    if (slug && Number.isFinite(yesAsk) && yesAsk > 0 && yesAsk < 1) {
      quotes.push({
        book: "Kalshi",
        slug,
        side: "YES",
        price: yesAsk,
        deepLink: ticker ? `https://kalshi.com/markets/${ticker}` : undefined,
      });
    }
    if (slug && Number.isFinite(noAsk) && noAsk > 0 && noAsk < 1) {
      quotes.push({
        book: "Kalshi",
        slug,
        side: "NO",
        price: noAsk,
        deepLink: ticker ? `https://kalshi.com/markets/${ticker}` : undefined,
      });
    }
    return quotes;
  });
}

function slugifyMarketTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

async function retrainModel(env: WorkerEnv): Promise<ModelState> {
  const results = await fetchResultsForAnalytics(env);
  const backtest = buildBacktest(results);
  const model = trainModelFromResults(results, backtest);
  await cacheJson(env.SNAPSHOT_CACHE, MODEL_STATE_KEY, model, 60 * 60 * 24 * 7);
  await env.SNAPSHOT_CACHE.delete(SNAPSHOT_CACHE_KEY);
  await env.SNAPSHOT_CACHE.delete(ANALYTICS_CACHE_KEY);
  return model;
}

async function getDiscovery(env: WorkerEnv, query: string): Promise<DiscoveryState> {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `${DISCOVERY_CACHE_PREFIX}${normalizedQuery}`;
  const cached = await env.SNAPSHOT_CACHE.get(cacheKey, "json");
  if (cached) {
    return cached as DiscoveryState;
  }

  try {
    const params = new URLSearchParams({
      q: normalizedQuery,
      page: "1",
      limit_per_type: "10",
      type: "events",
      events_status: "active",
      presets: "Events",
    });
    const response = await fetchJsonCached(`${GAMMA_URL}/public-search?${params.toString()}`, 60 * 15);
    const discovery = {
      query: normalizedQuery,
      updatedAt: formatTimestamp(new Date()),
      source: "live",
      results: normalizeDiscoveryPayload(response),
    } satisfies DiscoveryState;
    await cacheJson(env.SNAPSHOT_CACHE, cacheKey, discovery, 60 * 15);
    return discovery;
  } catch {
    return {
      query: normalizedQuery,
      updatedAt: formatTimestamp(new Date()),
      source: "demo",
      results: [],
    };
  }
}

async function fetchResultsForAnalytics(env: WorkerEnv): Promise<ResultsState> {
  if (!env.CONVEX_SITE_URL) {
    return emptyResultsState();
  }

  try {
    const response = await fetch(`${env.CONVEX_SITE_URL}/results?limit=500`);
    if (!response.ok) {
      return emptyResultsState();
    }
    return (await response.json()) as ResultsState;
  } catch {
    return emptyResultsState();
  }
}

async function persistPaperBetsFromSnapshot(env: WorkerEnv, snapshot: Snapshot): Promise<void> {
  if (!env.CONVEX_SITE_URL || !env.CONVEX_INGEST_SECRET || !snapshot.signals.length) {
    return;
  }
  const guard = await getPortfolioGuard(env);
  if (!guard.allowNewBets) {
    return;
  }

  const bets = snapshot.signals.slice(0, 8).map((signal) => signalToPaperBet(signal, snapshot.updatedAt));
  await fetch(`${env.CONVEX_SITE_URL}/ingest/paper-bets`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": env.CONVEX_INGEST_SECRET,
    },
    body: JSON.stringify({ bets }),
  });
  await fetch(`${env.CONVEX_SITE_URL}/maintenance/dedupe-paper-bets`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": env.CONVEX_INGEST_SECRET,
    },
  });
  await env.SNAPSHOT_CACHE.delete(RESULTS_CACHE_KEY);
  await env.SNAPSHOT_CACHE.delete(ANALYTICS_CACHE_KEY);
}

async function resolveOpenPaperBets(env: WorkerEnv): Promise<void> {
  if (!env.CONVEX_SITE_URL || !env.CONVEX_INGEST_SECRET) {
    return;
  }

  const response = await fetch(`${env.CONVEX_SITE_URL}/results?limit=80`);
  if (!response.ok) {
    return;
  }
  const results = (await response.json()) as ResultsState;
  const open = results.open ?? [];
  if (!open.length) {
    await cacheJson(env.SNAPSHOT_CACHE, RESULTS_CACHE_KEY, results, RESULTS_CACHE_TTL_SECONDS);
    return;
  }

  const updates: Array<{
    betKey: string;
    status: "resolved";
    resolvedAtTs: number;
    resolvedAt: string;
    result: 0 | 0.5 | 1;
    pnl: number;
    closingPrice?: number;
    clv?: number;
    resolutionSource: string;
  }> = [];

  for (const bet of open.slice(0, 40)) {
    const resolution = await fetchMarketResolution(bet.slug, bet.conditionId);
    if (!resolution || resolution.result === null) {
      continue;
    }
    const resolved = { ...resolution, result: resolution.result };
    const closingPrice = closingPriceForBet(bet, resolved);

    updates.push({
      betKey: bet.betKey,
      status: "resolved",
      resolvedAtTs: Date.now(),
      resolvedAt: formatTimestamp(new Date()),
      result: resolved.result,
      pnl: computePaperPnl(bet, resolved.result),
      closingPrice,
      clv: closingPrice === undefined ? undefined : round(closingPrice - bet.entryPrice, 4),
      resolutionSource: resolution.source,
    });
  }

  if (!updates.length) {
    await cacheJson(env.SNAPSHOT_CACHE, RESULTS_CACHE_KEY, results, RESULTS_CACHE_TTL_SECONDS);
    return;
  }

  await fetch(`${env.CONVEX_SITE_URL}/resolve/paper-bets`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": env.CONVEX_INGEST_SECRET,
    },
    body: JSON.stringify({ updates }),
  });

  await env.SNAPSHOT_CACHE.delete(RESULTS_CACHE_KEY);
  await env.SNAPSHOT_CACHE.delete(ANALYTICS_CACHE_KEY);
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
    category === "sports" ? 14 :
    category === "macro" ? 120 :
    category === "awards" ? 365 :
    category === "politics" ? 365 :
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

function presetConfig(preset: ScanPreset): {
  allowProbes: boolean;
  thresholdDelta: number;
  maxSpread: number;
  maxProbeSpread: number;
  minMarketQuality: number;
  minProbeMarketQuality: number;
  maxEdge: number;
} {
  if (preset === "strict") {
    return {
      allowProbes: false,
      thresholdDelta: 0.02,
      maxSpread: 0.08,
      maxProbeSpread: 0.12,
      minMarketQuality: 72,
      minProbeMarketQuality: 80,
      maxEdge: 0.18,
    };
  }
  if (preset === "discovery") {
    return {
      allowProbes: true,
      thresholdDelta: -0.015,
      maxSpread: 0.18,
      maxProbeSpread: 0.999,
      minMarketQuality: 45,
      minProbeMarketQuality: 12,
      maxEdge: 0.3,
    };
  }
  return {
    allowProbes: true,
    thresholdDelta: 0,
    maxSpread: 0.12,
    maxProbeSpread: 0.35,
    minMarketQuality: 58,
    minProbeMarketQuality: 28,
    maxEdge: 0.24,
  };
}

function effectiveThreshold(category: MarketCategory, baseThreshold: number, preset: ScanPreset): number {
  const config = presetConfig(preset);
  const adjusted =
    category === "macro" ? baseThreshold - 0.045 :
    category === "politics" ? baseThreshold - 0.04 :
    category === "awards" ? baseThreshold - 0.05 :
    baseThreshold;
  return clamp(adjusted + config.thresholdDelta, 0.015, 0.2);
}

function categoryConfidenceBoost(category: MarketCategory): number {
  return category === "macro" ? 10 : category === "politics" ? 8 : category === "awards" ? 6 : category === "sports" ? 4 : 0;
}

function assessSignalQuality(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  category: MarketCategory,
  preset: ScanPreset,
  isProbe: boolean,
): { marketQuality: number; flags: string[] } {
  const daysLeft = daysUntil(market.end_date_iso ?? market.end_date);
  const volumeScore = clamp(Math.round(Math.log10(Math.max(market.volume, 1)) * 18 - 58), 5, 99);
  const liquidityScore = clamp(Math.round(Math.log10(Math.max(ob.liquidity, 1)) * 24 - 36), 5, 99);
  const spreadScore = clamp(Math.round(99 - ob.spread * 220), 0, 99);
  const timeScore = !Number.isFinite(daysLeft) ? 65 : clamp(Math.round(95 - Math.abs(daysLeft - 35)), 18, 95);
  const categoryScore = category === "macro" ? 90 : category === "politics" ? 84 : category === "awards" ? 78 : category === "sports" ? 72 : 60;
  const presetPenalty = preset === "strict" && isProbe ? 25 : 0;
  const marketQuality = clamp(
    Math.round(volumeScore * 0.22 + liquidityScore * 0.26 + spreadScore * 0.28 + timeScore * 0.12 + categoryScore * 0.12 - presetPenalty),
    1,
    99,
  );

  const flags: string[] = [];
  if (ob.spread > 0.12) flags.push("Wide spread");
  if (ob.liquidity < 10000) flags.push("Thin order book");
  if (market.yes_price < 0.05 || market.yes_price > 0.95) flags.push("Tail pricing");
  if (Number.isFinite(daysLeft) && daysLeft > 120) flags.push("Long-dated");
  if (isProbe) flags.push("Probe only");

  return { marketQuality, flags };
}

function computeSetupQuality(
  edge: number,
  confidence: number,
  strategy: StrategyMode,
  flags: string[],
  isProbe: boolean,
): number {
  const edgeScore = clamp(Math.round(edge * 1400), 8, 99);
  const confidenceScore = clamp(confidence, 1, 99);
  const strategyScore = strategy === "event-specialist" ? 78 : strategy === "consensus-fade" ? 74 : 66;
  const flagPenalty = flags.length * 6 + (isProbe ? 10 : 0);
  return clamp(Math.round(edgeScore * 0.4 + confidenceScore * 0.35 + strategyScore * 0.25 - flagPenalty), 1, 99);
}

function determineTradeTier(qualityScore: number, isProbe: boolean): TradeTier {
  if (isProbe) return "Probe";
  if (qualityScore >= 80) return "A";
  if (qualityScore >= 66) return "B";
  return "C";
}

function describeRationale(
  category: MarketCategory,
  strategy: StrategyMode,
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  edge: number,
  flags: string[],
  qualityScore: number,
): string {
  return [
    capitalize(category),
    strategy.replace("-", " "),
    `edge ${pct(edge)}`,
    `quality ${qualityScore}`,
    `imbalance ${round(ob.imbalance, 3)}`,
    `spread ${round(ob.spread, 3)}`,
    `vol ${usd(market.volume)}`,
    flags[0] ? `flag ${flags[0].toLowerCase()}` : null,
  ].filter(Boolean).join(" | ");
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
      condition_id: "fed-cut-before-september",
      market: "Will the Fed cut rates before September?",
      slug: "fed-cut-before-september",
      side: "YES",
      edge: 0.084,
      market_prob: 0.528,
      expected_value: 3.98,
      odds_movement: -0.014,
      entry_timing: "buying-dip",
      model_prob: 0.612,
      entry_price: 0.528,
      execution_book: "Polymarket",
      best_available_price: 0.528,
      price_improvement: 0,
      book_count: 1,
      size_usdc: 25,
      expiry: "Aug 20, 2026",
      hours_to_expiry: 2510,
      confidence: 84,
      status: "Demo",
      volume: 240000,
      liquidity: 68000,
      imbalance: 0.312,
      spread: 0.012,
      category: "macro",
      strategy: "consensus-fade",
      rationale: "Macro | consensus fade | seeded review data",
      quality_score: 82,
      market_quality: 76,
      setup_quality: 88,
      trade_tier: "A",
      flags: [],
      is_probe: false,
      risk_score: 18,
      risk_flags: [],
    },
    {
      condition_id: "newsom-2028-before-labor-day",
      market: "Will Gavin Newsom enter the 2028 race before Labor Day?",
      slug: "newsom-2028-before-labor-day",
      side: "NO",
      edge: 0.071,
      market_prob: 0.621,
      expected_value: 2.12,
      odds_movement: 0.006,
      entry_timing: "stable-entry",
      model_prob: 0.433,
      entry_price: 0.621,
      execution_book: "Polymarket",
      best_available_price: 0.621,
      price_improvement: 0,
      book_count: 1,
      size_usdc: 18.5,
      expiry: "Sep 08, 2026",
      hours_to_expiry: 2950,
      confidence: 71,
      status: "Demo",
      volume: 175000,
      liquidity: 42000,
      imbalance: -0.241,
      spread: 0.009,
      category: "politics",
      strategy: "consensus-fade",
      rationale: "Politics | consensus fade | seeded review data",
      quality_score: 71,
      market_quality: 69,
      setup_quality: 74,
      trade_tier: "B",
      flags: ["Headline risk"],
      is_probe: false,
      risk_score: 24,
      risk_flags: ["Headline risk"],
    },
    {
      condition_id: "cannes-palme-first-time-winner",
      market: "Will Cannes Palme d'Or go to a first-time winner?",
      slug: "cannes-palme-first-time-winner",
      side: "YES",
      edge: 0.063,
      market_prob: 0.524,
      expected_value: 1.68,
      odds_movement: 0.024,
      entry_timing: "chasing-move",
      model_prob: 0.587,
      entry_price: 0.524,
      execution_book: "Polymarket",
      best_available_price: 0.524,
      price_improvement: 0,
      book_count: 1,
      size_usdc: 14,
      expiry: "May 24, 2026",
      hours_to_expiry: 400,
      confidence: 63,
      status: "Demo",
      volume: 132000,
      liquidity: 35800,
      imbalance: 0.226,
      spread: 0.015,
      category: "awards",
      strategy: "event-specialist",
      rationale: "Awards | event specialist | seeded review data",
      quality_score: 64,
      market_quality: 62,
      setup_quality: 66,
      trade_tier: "C",
      flags: ["Seasonal liquidity"],
      is_probe: false,
      risk_score: 29,
      risk_flags: ["Seasonal liquidity"],
    },
  ];

  return {
    updatedAt,
    preset: "balanced",
    threshold: "7.00%",
    balance: "$100.00",
    bestEdge: "8.40%",
    avgEdge: "7.27%",
    signalCount: signals.length,
    strictSignalCount: signals.length,
    probeSignalCount: 0,
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

function emptyResultsState(): ResultsState {
  return {
    summary: {
      totalBets: 0,
      openBets: 0,
      resolvedBets: 0,
      wins: 0,
      winRate: 0,
      totalPnl: 0,
    },
    recent: [],
    open: [],
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

function parsePreset(value: string | null): ScanPreset {
  return value === "strict" || value === "discovery" ? value : "balanced";
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

function daysUntil(raw?: string): number {
  if (!raw) return Number.NaN;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return Number.NaN;
  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

function hoursUntil(raw?: string): number {
  if (!raw) return 0;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (date.getTime() - Date.now()) / (1000 * 60 * 60));
}

function buildAnalytics(results: ResultsState): AnalyticsState {
  const allBets = [...(results.recent ?? []), ...(results.open ?? [])];
  const open = allBets.filter((bet) => bet.status === "open");
  const resolved = allBets.filter((bet) => bet.status === "resolved");
  const probeOpenCount = open.filter((bet) => (bet.confidence ?? 0) <= 40).length;
  const totalResolvedStake = resolved.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0);
  const totalPnl = resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0);
  const clvRows = resolved.filter((bet) => typeof bet.clv === "number");
  const expectedValueRows = allBets.filter((bet) => typeof bet.expectedValue === "number");
  const calibrationRows = resolved.filter((bet) => typeof bet.modelProb === "number" && typeof bet.result === "number");
  const maxDrawdown = computeMaxDrawdown(resolved);
  const correlationGroups = summarizeBuckets(open, (bet) => `${bet.category ?? "other"}:${bet.strategy ?? "unknown"}`);
  const largestCorrelationGroup = correlationGroups.reduce((max, bucket) => Math.max(max, bucket.openBets), 0);

  return {
    updatedAt: formatTimestamp(new Date()),
    summary: {
      totalBets: allBets.length,
      resolvedBets: resolved.length,
      openBets: open.length,
      openExposure: round(open.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0), 2),
      avgOpenEdge: round(open.length ? open.reduce((sum, bet) => sum + (bet.edge ?? 0), 0) / open.length : 0, 4),
      avgResolvedPnl: round(resolved.length ? resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0) / resolved.length : 0, 2),
      roi: round(totalResolvedStake ? totalPnl / totalResolvedStake : 0, 4),
      maxDrawdown: round(maxDrawdown, 2),
      avgClv: round(clvRows.length ? clvRows.reduce((sum, bet) => sum + (bet.clv ?? 0), 0) / clvRows.length : 0, 4),
      clvWinRate: round(clvRows.length ? clvRows.filter((bet) => (bet.clv ?? 0) > 0).length / clvRows.length : 0, 4),
      avgExpectedValue: round(
        expectedValueRows.length
          ? expectedValueRows.reduce((sum, bet) => sum + (bet.expectedValue ?? 0), 0) / expectedValueRows.length
          : 0,
        2,
      ),
      calibrationError: round(
        calibrationRows.length
          ? calibrationRows.reduce((sum, bet) => sum + Math.abs((bet.modelProb ?? 0.5) - (bet.result ?? 0)), 0) / calibrationRows.length
          : 0,
        4,
      ),
      stopLossActive: totalPnl < -Math.max(totalResolvedStake * 0.08, 25) || maxDrawdown > Math.max(totalResolvedStake * 0.12, 30),
      largestCorrelationGroup,
      strictOpenCount: open.length - probeOpenCount,
      probeOpenCount,
    },
    byCategory: summarizeBuckets(allBets, (bet) => bet.category ?? "other"),
    byStrategy: summarizeBuckets(allBets, (bet) => bet.strategy ?? "unknown"),
    byPriceBand: summarizeBuckets(allBets, (bet) => priceBandFor(bet.entryPrice ?? 0)),
    byTimeToExpiry: summarizeBuckets(allBets, (bet) => timeBucketFor(bet.hoursToExpiry ?? 0)),
    insights: buildInsights(allBets, open, resolved),
  };
}

function buildBacktest(results: ResultsState): BacktestState {
  const resolved = [...(results.recent ?? [])]
    .filter((bet) => bet.status === "resolved")
    .sort((a, b) => (a.resolvedAtTs ?? a.openedAtTs ?? 0) - (b.resolvedAtTs ?? b.openedAtTs ?? 0));
  const strategies = [...new Set(resolved.map((bet) => bet.strategy ?? "unknown"))]
    .map((strategy) => buildStrategyBacktest(strategy, resolved.filter((bet) => (bet.strategy ?? "unknown") === strategy)))
    .sort((a, b) => b.recentRoi - a.recentRoi || b.thresholds[0]?.bets - a.thresholds[0]?.bets);

  return {
    updatedAt: formatTimestamp(new Date()),
    resolvedBets: resolved.length,
    strategies,
    recommendations: buildBacktestRecommendations(strategies),
  };
}

function defaultModelState(): ModelState {
  return {
    version: "moneyflow-v1",
    trainedAt: formatTimestamp(new Date()),
    resolvedBets: 0,
    source: "default",
    categoryAdjustments: {},
    strategyAdjustments: {},
    edgeFloorAdjustments: {},
    kellyFraction: 0.25,
    driftStatus: "insufficient-data",
    recommendations: ["Model is using default priors until resolved bet history is deep enough."],
  };
}

function trainModelFromResults(results: ResultsState, backtest: BacktestState): ModelState {
  const resolved = [...(results.recent ?? [])].filter((bet) => bet.status === "resolved" && typeof bet.result === "number");
  if (resolved.length < 5) {
    return { ...defaultModelState(), resolvedBets: resolved.length };
  }

  const categoryAdjustments = trainGroupAdjustments(resolved, (bet) => bet.category ?? "other") as Partial<Record<MarketCategory, number>>;
  const strategyAdjustments = trainGroupAdjustments(resolved, (bet) => bet.strategy ?? "consensus-fade") as Partial<Record<StrategyMode, number>>;
  const edgeFloorAdjustments: Partial<Record<StrategyMode, number>> = {};
  for (const strategy of backtest.strategies) {
    const defaultFloor = 0.06;
    edgeFloorAdjustments[strategy.strategy as StrategyMode] = round(clamp(strategy.bestMinEdge - defaultFloor, -0.02, 0.04), 4);
  }
  const bestKelly = backtest.strategies.length
    ? backtest.strategies.reduce((sum, strategy) => sum + strategy.recommendedKellyFraction, 0) / backtest.strategies.length
    : 0.25;
  const driftStatus = backtest.strategies.some((strategy) => strategy.driftStatus === "drift")
    ? "drift"
    : backtest.strategies.some((strategy) => strategy.driftStatus === "watch")
      ? "watch"
      : "stable";

  return {
    version: "moneyflow-v1",
    trainedAt: formatTimestamp(new Date()),
    resolvedBets: resolved.length,
    source: "trained",
    categoryAdjustments,
    strategyAdjustments,
    edgeFloorAdjustments,
    kellyFraction: round(clamp(bestKelly, 0.05, 0.35), 3),
    driftStatus,
    recommendations: backtest.recommendations,
  };
}

function trainGroupAdjustments(bets: PaperBet[], getKey: (bet: PaperBet) => string): Record<string, number> {
  const groups = new Map<string, PaperBet[]>();
  for (const bet of bets) {
    const rows = groups.get(getKey(bet)) ?? [];
    rows.push(bet);
    groups.set(getKey(bet), rows);
  }

  const adjustments: Record<string, number> = {};
  for (const [key, rows] of groups.entries()) {
    if (rows.length < 3) {
      continue;
    }
    const calibrationBias = rows.reduce((sum, bet) => sum + ((bet.result ?? 0) - (bet.modelProb ?? 0.5)), 0) / rows.length;
    const roi = summarizeBacktestSet(rows).roi;
    const roiTerm = clamp(roi, -0.2, 0.2) * 0.04;
    adjustments[key] = round(clamp(calibrationBias * 0.08 + roiTerm, -0.05, 0.05), 4);
  }
  return adjustments;
}

function buildStrategyBacktest(strategy: string, bets: PaperBet[]): StrategyBacktest {
  const thresholds = [0.02, 0.04, 0.06, 0.08, 0.1].map((minEdge) => summarizeBacktestThreshold(bets, minEdge));
  const candidates = thresholds.filter((row) => row.bets >= 3);
  const best = (candidates.length ? candidates : thresholds).sort((a, b) => b.roi - a.roi || b.bets - a.bets)[0] ?? thresholds[0];
  const midpoint = Math.floor(bets.length / 2);
  const baseline = summarizeBacktestSet(bets.slice(0, midpoint));
  const recent = summarizeBacktestSet(bets.slice(midpoint));
  const calibrationRows = bets.filter((bet) => typeof bet.result === "number" && bet.result !== 0.5);
  const calibrationError = calibrationRows.length
    ? calibrationRows.reduce((sum, bet) => sum + Math.abs((bet.modelProb ?? 0.5) - (bet.result ?? 0)), 0) / calibrationRows.length
    : 0;
  const roiDrop = baseline.roi - recent.roi;
  const driftStatus =
    bets.length < 8 ? "insufficient-data" :
    calibrationError > 0.38 || roiDrop > 0.18 ? "drift" :
    calibrationError > 0.3 || roiDrop > 0.1 ? "watch" :
    "stable";

  return {
    strategy,
    bestMinEdge: best.minEdge,
    recommendedKellyFraction: recommendedKellyFraction(best.roi, best.maxDrawdown),
    driftStatus,
    calibrationError: round(calibrationError, 4),
    recentRoi: recent.roi,
    baselineRoi: baseline.roi,
    thresholds,
  };
}

function summarizeBacktestThreshold(bets: PaperBet[], minEdge: number): BacktestThreshold {
  return { minEdge, ...summarizeBacktestSet(bets.filter((bet) => (bet.edge ?? 0) >= minEdge)) };
}

function summarizeBacktestSet(bets: PaperBet[]): Omit<BacktestThreshold, "minEdge"> {
  const stake = bets.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0);
  const pnl = bets.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0);
  const wins = bets.filter((bet) => (bet.pnl ?? 0) > 0).length;
  return {
    bets: bets.length,
    roi: round(stake ? pnl / stake : 0, 4),
    winRate: round(bets.length ? wins / bets.length : 0, 4),
    totalPnl: round(pnl, 2),
    maxDrawdown: round(computeMaxDrawdown(bets), 2),
  };
}

function recommendedKellyFraction(roi: number, maxDrawdown: number): number {
  if (roi <= 0) return 0.05;
  if (maxDrawdown > 50) return 0.1;
  if (roi > 0.12) return 0.35;
  if (roi > 0.05) return 0.25;
  return 0.15;
}

function buildBacktestRecommendations(strategies: StrategyBacktest[]): string[] {
  if (!strategies.length) {
    return ["No resolved bets are available for backtesting yet."];
  }
  return strategies.slice(0, 4).map((strategy) => {
    const verb = strategy.driftStatus === "drift" ? "pause or reduce" : strategy.driftStatus === "watch" ? "keep capped" : "continue";
    return `${strategy.strategy}: ${verb}; best edge floor ${pct(strategy.bestMinEdge)}, Kelly fraction ${strategy.recommendedKellyFraction.toFixed(2)}.`;
  });
}

function computeMaxDrawdown(resolved: PaperBet[]): number {
  const ordered = [...resolved].sort((a, b) => (a.resolvedAtTs ?? a.openedAtTs ?? 0) - (b.resolvedAtTs ?? b.openedAtTs ?? 0));
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const bet of ordered) {
    equity += bet.pnl ?? 0;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }
  return maxDrawdown;
}

function summarizeBuckets(bets: PaperBet[], getKey: (bet: PaperBet) => string): AnalyticsBucket[] {
  const buckets = new Map<string, PaperBet[]>();
  for (const bet of bets) {
    const key = getKey(bet);
    const current = buckets.get(key) ?? [];
    current.push(bet);
    buckets.set(key, current);
  }

  return [...buckets.entries()]
    .map(([key, rows]) => {
      const open = rows.filter((bet) => bet.status === "open");
      const resolved = rows.filter((bet) => bet.status === "resolved");
      const wins = resolved.filter((bet) => (bet.pnl ?? 0) > 0).length;
      return {
        key,
        totalBets: rows.length,
        openBets: open.length,
        resolvedBets: resolved.length,
        wins,
        winRate: resolved.length ? wins / resolved.length : 0,
        totalPnl: round(resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0), 2),
        exposure: round(open.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0), 2),
        avgEdge: round(rows.reduce((sum, bet) => sum + (bet.edge ?? 0), 0) / rows.length, 4),
      } satisfies AnalyticsBucket;
    })
    .sort((a, b) => b.totalPnl - a.totalPnl || b.exposure - a.exposure || b.totalBets - a.totalBets);
}

function priceBandFor(entryPrice: number): string {
  if (entryPrice < 0.1) return "<0.10";
  if (entryPrice < 0.25) return "0.10-0.24";
  if (entryPrice < 0.5) return "0.25-0.49";
  if (entryPrice < 0.75) return "0.50-0.74";
  return "0.75+";
}

function timeBucketFor(hoursToExpiry: number): string {
  if (hoursToExpiry <= 6) return "<6h";
  if (hoursToExpiry <= 24) return "6-24h";
  if (hoursToExpiry <= 72) return "1-3d";
  if (hoursToExpiry <= 168) return "3-7d";
  if (hoursToExpiry <= 720) return "1-4w";
  return "1m+";
}

function entryTimingFor(oddsMovement: number): string {
  if (oddsMovement > 0.02) return "chasing-move";
  if (oddsMovement < -0.02) return "buying-dip";
  return "stable-entry";
}

function buildInsights(allBets: PaperBet[], open: PaperBet[], resolved: PaperBet[]): string[] {
  const bestCategory = summarizeBuckets(allBets, (bet) => bet.category ?? "other")[0];
  const bestStrategy = summarizeBuckets(allBets, (bet) => bet.strategy ?? "unknown")[0];
  const clvRows = resolved.filter((bet) => typeof bet.clv === "number");
  const avgClv = clvRows.length ? clvRows.reduce((sum, bet) => sum + (bet.clv ?? 0), 0) / clvRows.length : 0;
  const totalStake = resolved.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0);
  const totalPnl = resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0);
  const roi = totalStake ? totalPnl / totalStake : 0;
  const insights = [
    open.length
      ? `Open exposure is ${usd(open.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0))}; keep sizing capped until resolved P&L is real.`
      : "No open exposure right now; the desk is passing rather than forcing entries.",
    bestCategory
      ? `${capitalize(bestCategory.key)} currently leads the book by P&L/exposure mix.`
      : "No category edge is proven yet.",
    bestStrategy
      ? `${bestStrategy.key} is the most active strategy lane so far.`
      : "No strategy lane is active yet.",
    resolved.length
      ? `Resolved ROI is ${pct(roi)} with max drawdown ${usd(computeMaxDrawdown(resolved))}.`
      : "Resolved-history depth is still too thin; keep learning before sizing up.",
    clvRows.length
      ? `Average CLV is ${pct(avgClv)}; positive CLV means entries are beating the close.`
      : "CLV will populate as open bets resolve with closing prices.",
  ];
  return insights;
}

function normalizeDiscoveryPayload(payload: unknown): DiscoveryResult[] {
  const rawItems =
    Array.isArray(payload) ? payload :
    payload && typeof payload === "object"
      ? Object.values(payload as Record<string, unknown>).flatMap((value) => (Array.isArray(value) ? value : []))
      : [];

  const results: DiscoveryResult[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const event = normalizeDiscoveryEvent(record);
    if (event && event.slug) {
      results.push(event);
    }
  }

  return dedupeDiscovery(results).slice(0, 12);
}

function normalizeDiscoveryEvent(record: Record<string, unknown>): DiscoveryResult | null {
  const parent = asRecord(record.parentMarket) ?? asRecord(record.event) ?? record;
  const additional = asRecord(parent.additionalFields) ?? {};
  const metadata = asRecord(additional.eventMetadata) ?? {};
  const firstMarket = Array.isArray(record.markets) && record.markets.length ? asRecord(record.markets[0]) : asRecord(record.market);
  const tags = Array.isArray(additional.tags)
    ? additional.tags
        .map((tag) => {
          const typed = asRecord(tag);
          return typed?.label ? String(typed.label) : null;
        })
        .filter(Boolean) as string[]
    : [];

  const slug = stringOr(parent.slug);
  const title = stringOr(parent.title) ?? stringOr(parent.question);
  if (!slug || !title) return null;

  return {
    title,
    slug,
    eventUrl: stringOr(parent.eventUrl) ?? `https://polymarket.com/event/${slug}`,
    description: stringOr(parent.description) ?? "",
    volume: numberOr(parent.volume) ?? 0,
    openInterest: numberOr(parent.openInterest) ?? 0,
    liquidity: numberOr(additional.liquidity) ?? numberOr(additional.liquidityClob) ?? 0,
    volume24hr: numberOr(additional.volume24hr) ?? 0,
    tags,
    context: stringOr(metadata.context_description) ?? "",
    topMarket: stringOr(firstMarket?.question) ?? undefined,
  };
}

function dedupeDiscovery(items: DiscoveryResult[]): DiscoveryResult[] {
  const seen = new Set<string>();
  const unique: DiscoveryResult[] = [];
  for (const item of items.sort((a, b) => b.volume - a.volume || b.openInterest - a.openInterest)) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    unique.push(item);
  }
  return unique;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function stringOr(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOr(value: unknown): number | null {
  const num = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(num) ? num : null;
}

async function cacheJson(store: KVNamespace, key: string, payload: unknown, ttlSeconds: number): Promise<void> {
  await store.put(key, JSON.stringify(payload), { expirationTtl: ttlSeconds });
}

async function fetchJsonCached(url: string, ttlSeconds: number, init?: RequestInit): Promise<unknown> {
  const response = await fetchCached(url, ttlSeconds, init);
  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchCached(url: string, ttlSeconds: number, init?: RequestInit): Promise<Response> {
  const requestInit: RequestInit = { ...init, method: init?.method ?? "GET" };
  const request = new Request(url, requestInit);
  const useCache = request.method === "GET";
  const edgeCache = (caches as CacheStorage & { default?: Cache }).default;

  if (useCache && edgeCache) {
    const cached = await edgeCache.match(request);
    if (cached) {
      return cached;
    }
  }

  const response = await fetch(request, {
    cf: {
      cacheEverything: useCache,
      cacheTtl: ttlSeconds,
    },
  });

  if (useCache && response.ok && edgeCache) {
    void edgeCache.put(request, response.clone());
  }

  return response;
}

function assertPreviewUrl(value: string): void {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }
}

function extractTagContent(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? normalizeHtmlText(match[1]) : null;
}

function extractMetaContent(html: string, name: string): string | null {
  const pattern = new RegExp(`<meta[^>]+name=["']${escapeRegex(name)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const reversePattern = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapeRegex(name)}["'][^>]*>`, "i");
  const match = html.match(pattern) ?? html.match(reversePattern);
  return match?.[1] ? normalizeHtmlText(match[1]) : null;
}

function extractMetaProperty(html: string, property: string): string | null {
  const pattern = new RegExp(`<meta[^>]+property=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const reversePattern = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegex(property)}["'][^>]*>`, "i");
  const match = html.match(pattern) ?? html.match(reversePattern);
  return match?.[1] ? normalizeHtmlText(match[1]) : null;
}

function extractBodyExcerpt(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const cleaned = normalizeHtmlText(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
  return cleaned.slice(0, 320);
}

function normalizeHtmlText(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
