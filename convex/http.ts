import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return json({ ok: true, service: "moneyflow-convex" });
  }),
});

http.route({
  path: "/snapshot",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const snapshot = await ctx.runQuery(api.snapshots.latest, {});
    return json({ snapshot });
  }),
});

http.route({
  path: "/history",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 10;
    const history = await ctx.runQuery(api.snapshots.history, { limit });
    return json({ history });
  }),
});

http.route({
  path: "/research",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const research = await ctx.runQuery(api.research.latest, {});
    return json({ research });
  }),
});

http.route({
  path: "/results",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const [summary, recent, open] = await Promise.all([
      ctx.runQuery(api.paperBets.summary, {}),
      ctx.runQuery(api.paperBets.recent, { limit }),
      ctx.runQuery(api.paperBets.openBets, { limit }),
    ]);
    return json({ summary, recent, open });
  }),
});

http.route({
  path: "/ingest/snapshot",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.WORKER_INGEST_SECRET;
    if (!expectedSecret || request.headers.get("x-ingest-secret") !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const result = await ctx.runMutation(api.snapshots.ingest, {
      updatedAt: String(payload.updatedAt ?? new Date().toISOString()),
      source: payload.source === "demo" || payload.source === "cache" ? payload.source : "live",
      demoMode: Boolean(payload.demoMode),
      stale: Boolean(payload.stale),
      signalCount: Number(payload.signalCount ?? 0),
      marketCount: Number(payload.marketCount ?? 0),
      bestEdge: String(payload.bestEdge ?? "0.00%"),
      avgEdge: String(payload.avgEdge ?? "0.00%"),
      confidence: String(payload.confidence ?? "0/99"),
      maxPosition: String(payload.maxPosition ?? "$0.00"),
      threshold: String(payload.threshold ?? "0.00%"),
      balance: String(payload.balance ?? "$0.00"),
      pill: String(payload.pill ?? "Convex ingest"),
      payload,
    });

    return json(result);
  }),
});

http.route({
  path: "/ingest/research",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.WORKER_INGEST_SECRET;
    if (!expectedSecret || request.headers.get("x-ingest-secret") !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const payload = (await request.json()) as { briefs?: unknown[] };
    const result = await ctx.runMutation(api.research.ingestBatch, {
      briefs: Array.isArray(payload.briefs) ? (payload.briefs as never[]) : [],
    });

    return json(result);
  }),
});

http.route({
  path: "/ingest/paper-bets",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.WORKER_INGEST_SECRET;
    if (!expectedSecret || request.headers.get("x-ingest-secret") !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const payload = (await request.json()) as { bets?: unknown[] };
    const result = await ctx.runMutation(api.paperBets.ingestBatch, {
      bets: Array.isArray(payload.bets) ? (payload.bets as never[]) : [],
    });
    return json(result);
  }),
});

http.route({
  path: "/resolve/paper-bets",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.WORKER_INGEST_SECRET;
    if (!expectedSecret || request.headers.get("x-ingest-secret") !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const payload = (await request.json()) as { updates?: unknown[] };
    const result = await ctx.runMutation(api.paperBets.resolveBatch, {
      updates: Array.isArray(payload.updates) ? (payload.updates as never[]) : [],
    });
    return json(result);
  }),
});

http.route({
  path: "/maintenance/dedupe-paper-bets",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.WORKER_INGEST_SECRET;
    if (!expectedSecret || request.headers.get("x-ingest-secret") !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const result = await ctx.runMutation(api.paperBets.dedupeOpenPositions, {});
    return json(result);
  }),
});

export default http;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
