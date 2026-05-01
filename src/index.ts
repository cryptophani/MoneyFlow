type MarketCategory = "politics" | "macro" | "awards" | "sports" | "crypto" | "other";
type StrategyMode = "consensus-fade" | "event-specialist" | "liquidity-reversion";
type Conviction = "Monitor" | "Prepare" | "Active";
type ScanPreset = "strict" | "balanced" | "discovery";
type TradeTier = "A" | "B" | "C" | "Probe";

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
  condition_id: string;
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
  quality_score: number;
  market_quality: number;
  setup_quality: number;
  trade_tier: TradeTier;
  flags: string[];
  is_probe: boolean;
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
    strictOpenCount: number;
    probeOpenCount: number;
  };
  byCategory: AnalyticsBucket[];
  byStrategy: AnalyticsBucket[];
  byPriceBand: AnalyticsBucket[];
  insights: string[];
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
  modelProb: number;
  entryPrice: number;
  sizeUsdc: number;
  expiry: string;
  openedAtTs: number;
  openedAt: string;
  resolvedAtTs?: number;
  resolvedAt?: string;
  result?: 0 | 1;
  pnl?: number;
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
const RESULTS_CACHE_KEY = "results:latest";
const ANALYTICS_CACHE_KEY = "analytics:latest";
const SNAPSHOT_CACHE_TTL_SECONDS = 60 * 30;
const RESEARCH_CACHE_TTL_SECONDS = 60 * 60 * 6;
const RESULTS_CACHE_TTL_SECONDS = 60 * 10;
const ANALYTICS_CACHE_TTL_SECONDS = 60 * 10;
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

    if (url.pathname === "/api/analytics") {
      const analytics = await getAnalytics(env);
      return json(analytics);
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
    ctx.waitUntil(Promise.all([refreshSnapshot(env), refreshResearch(env), resolveOpenPaperBets(env)]));
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
  const signals: Signal[] = [];
  const probes: Signal[] = [];

  for (const market of markets) {
    const ob = await fetchOrderBookFeatures(market.yes_token_id);
    const signal = generateSignal(market, ob, walletBalance, env, preset);
    if (signal) {
      signals.push(signal);
    } else {
      const probe = generateProbeSignal(market, ob, walletBalance, preset);
      if (probe) {
        probes.push(probe);
      }
    }
  }

  signals.sort((a, b) => b.edge - a.edge);
  probes.sort((a, b) => b.edge - a.edge);
  const displayedSignals = signals.length ? signals : probes.slice(0, 6);
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
      signals.length
        ? `${capitalize(preset)} mode surfaced ${signals.length} qualified ideas`
        : probes.length
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
      category: classifyCategory(market.question),
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

function generateSignal(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  walletBalance: number,
  env: WorkerEnv,
  preset: ScanPreset,
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

  const modelProb = estimateModelProbability(category, strategy, market.yes_price, ob.imbalance, ob.spread);
  const yesEdge = modelProb - market.yes_price;
  const noEdge = (1 - modelProb) - market.no_price;
  const edge = Math.max(yesEdge, noEdge);
  const threshold = effectiveThreshold(category, Number.parseFloat(env.EDGE_THRESHOLD), preset);

  if (edge < threshold || edge > config.maxEdge) {
    return null;
  }

  const side = yesEdge >= noEdge ? "YES" : "NO";
  const entryPrice = side === "YES" ? market.yes_price : market.no_price;
  const confidence = Math.min(99, Math.max(15, Math.round(edge * 1000 + categoryConfidenceBoost(category))));
  const sizeUsdc = computeKellySize(modelProb, market.yes_price, side, walletBalance, env);
  const setupQuality = computeSetupQuality(edge, confidence, strategy, quality.flags, false);
  const qualityScore = clamp(Math.round((quality.marketQuality * 0.55) + (setupQuality * 0.45)), 1, 99);
  const tradeTier = determineTradeTier(qualityScore, false);

  return {
    condition_id: market.condition_id,
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
    rationale: describeRationale(category, strategy, market, ob, edge, quality.flags, qualityScore),
    quality_score: qualityScore,
    market_quality: quality.marketQuality,
    setup_quality: setupQuality,
    trade_tier: tradeTier,
    flags: quality.flags,
    is_probe: false,
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

function generateProbeSignal(
  market: Market,
  ob: { imbalance: number; liquidity: number; spread: number },
  walletBalance: number,
  preset: ScanPreset,
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

  const modelProb = side === "YES" ? clamp(market.yes_price + 0.03, 0.03, 0.97) : clamp(market.yes_price - 0.03, 0.03, 0.97);
  const edge = Math.abs(modelProb - market.yes_price);
  const setupQuality = computeSetupQuality(edge, 38, strategy, quality.flags, true);
  const qualityScore = clamp(Math.round((quality.marketQuality * 0.6) + (setupQuality * 0.4)), 1, 99);

  return {
    condition_id: market.condition_id,
    market: market.question,
    slug: market.slug,
    side,
    edge: round(edge, 4),
    model_prob: round(modelProb, 4),
    entry_price: round(side === "YES" ? market.yes_price : market.no_price, 3),
    size_usdc: round(Math.min(walletBalance * 0.02, 8), 2),
    expiry: formatExpiry(expiryRaw),
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
    modelProb: signal.model_prob,
    entryPrice: signal.entry_price,
    sizeUsdc: signal.size_usdc,
    expiry: signal.expiry,
    openedAtTs: Number.isFinite(openedAtTs) ? openedAtTs : Date.now(),
    openedAt,
  };
}

async function fetchMarketResolution(
  slug: string,
  conditionId: string,
): Promise<{ result: 0 | 1 | null; source: string } | null> {
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

      const resolution = String(market.resolution ?? "").toLowerCase();
      if (resolution === "yes" || resolution === "1") {
        return { result: 1, source: "resolution" };
      }
      if (resolution === "no" || resolution === "0") {
        return { result: 0, source: "resolution" };
      }

      const tokens = Array.isArray(market.tokens) ? (market.tokens as Array<Record<string, unknown>>) : [];
      for (const token of tokens) {
        const outcome = String(token.outcome ?? "").toLowerCase();
        const price = Number(token.price ?? 0);
        if (price >= 0.99) {
          return { result: outcome === "yes" ? 1 : 0, source: "token-price" };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
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

function computePaperPnl(bet: PaperBet, result: 0 | 1): number {
  const shares = bet.entryPrice > 0 ? bet.sizeUsdc / bet.entryPrice : 0;
  const won = (bet.side === "YES" && result === 1) || (bet.side === "NO" && result === 0);
  return round(won ? shares * (1 - bet.entryPrice) : -shares * bet.entryPrice, 2);
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
    result: 0 | 1;
    pnl: number;
    resolutionSource: string;
  }> = [];

  for (const bet of open.slice(0, 40)) {
    const resolution = await fetchMarketResolution(bet.slug, bet.conditionId);
    if (!resolution || resolution.result === null) {
      continue;
    }

    updates.push({
      betKey: bet.betKey,
      status: "resolved",
      resolvedAtTs: Date.now(),
      resolvedAt: formatTimestamp(new Date()),
      result: resolution.result,
      pnl: computePaperPnl(bet, resolution.result),
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
  return category === "macro" ? 10 : category === "politics" ? 8 : category === "awards" ? 6 : 0;
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
  const categoryScore = category === "macro" ? 90 : category === "politics" ? 84 : category === "awards" ? 78 : 60;
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
      quality_score: 82,
      market_quality: 76,
      setup_quality: 88,
      trade_tier: "A",
      flags: [],
      is_probe: false,
    },
    {
      condition_id: "newsom-2028-before-labor-day",
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
      quality_score: 71,
      market_quality: 69,
      setup_quality: 74,
      trade_tier: "B",
      flags: ["Headline risk"],
      is_probe: false,
    },
    {
      condition_id: "cannes-palme-first-time-winner",
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
      quality_score: 64,
      market_quality: 62,
      setup_quality: 66,
      trade_tier: "C",
      flags: ["Seasonal liquidity"],
      is_probe: false,
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

function buildAnalytics(results: ResultsState): AnalyticsState {
  const allBets = [...(results.recent ?? []), ...(results.open ?? [])];
  const open = allBets.filter((bet) => bet.status === "open");
  const resolved = allBets.filter((bet) => bet.status === "resolved");
  const probeOpenCount = open.filter((bet) => (bet.confidence ?? 0) <= 40).length;

  return {
    updatedAt: formatTimestamp(new Date()),
    summary: {
      totalBets: allBets.length,
      resolvedBets: resolved.length,
      openBets: open.length,
      openExposure: round(open.reduce((sum, bet) => sum + (bet.sizeUsdc ?? 0), 0), 2),
      avgOpenEdge: round(open.length ? open.reduce((sum, bet) => sum + (bet.edge ?? 0), 0) / open.length : 0, 4),
      avgResolvedPnl: round(resolved.length ? resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0) / resolved.length : 0, 2),
      strictOpenCount: open.length - probeOpenCount,
      probeOpenCount,
    },
    byCategory: summarizeBuckets(allBets, (bet) => bet.category ?? "other"),
    byStrategy: summarizeBuckets(allBets, (bet) => bet.strategy ?? "unknown"),
    byPriceBand: summarizeBuckets(allBets, (bet) => priceBandFor(bet.entryPrice ?? 0)),
    insights: buildInsights(allBets, open, resolved),
  };
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

function buildInsights(allBets: PaperBet[], open: PaperBet[], resolved: PaperBet[]): string[] {
  const bestCategory = summarizeBuckets(allBets, (bet) => bet.category ?? "other")[0];
  const bestStrategy = summarizeBuckets(allBets, (bet) => bet.strategy ?? "unknown")[0];
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
      ? `Average realized P&L per resolved bet is ${usd(resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0) / resolved.length)}.`
      : "Resolved-history depth is still too thin; keep learning before sizing up.",
  ];
  return insights;
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
