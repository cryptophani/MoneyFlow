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
  path: "/ingest/snapshot",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.WORKER_INGEST_SECRET;
    if (!expectedSecret || request.headers.get("x-ingest-secret") !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const payload = await request.json();
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

export default http;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
