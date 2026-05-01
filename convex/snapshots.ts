import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const snapshotArgs = {
  updatedAt: v.string(),
  source: v.union(v.literal("live"), v.literal("cache"), v.literal("demo")),
  demoMode: v.boolean(),
  stale: v.boolean(),
  signalCount: v.number(),
  marketCount: v.number(),
  bestEdge: v.string(),
  avgEdge: v.string(),
  confidence: v.string(),
  maxPosition: v.string(),
  threshold: v.string(),
  balance: v.string(),
  pill: v.string(),
  payload: v.any(),
};

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("snapshots").withIndex("by_createdAtTs").order("desc").first();
    return row ? row.payload : null;
  },
});

export const history = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 50);
    const rows = await ctx.db.query("snapshots").withIndex("by_createdAtTs").order("desc").take(limit);
    return rows.map((row) => ({
      id: row._id,
      createdAt: row.updatedAt,
      source: row.source,
      demoMode: row.demoMode,
      signalCount: row.signalCount,
      marketCount: row.marketCount,
    }));
  },
});

export const ingest = mutation({
  args: snapshotArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("snapshots").withIndex("by_createdAtTs").order("desc").first();
    if (existing?.updatedAt === args.updatedAt) {
      await ctx.db.patch(existing._id, {
        createdAtTs: Date.now(),
        updatedAt: args.updatedAt,
        source: args.source,
        demoMode: args.demoMode,
        stale: args.stale,
        signalCount: args.signalCount,
        marketCount: args.marketCount,
        bestEdge: args.bestEdge,
        avgEdge: args.avgEdge,
        confidence: args.confidence,
        maxPosition: args.maxPosition,
        threshold: args.threshold,
        balance: args.balance,
        pill: args.pill,
        payload: args.payload,
      });
      return { ok: true, deduped: true };
    }

    await ctx.db.insert("snapshots", {
      createdAtTs: Date.now(),
      updatedAt: args.updatedAt,
      source: args.source,
      demoMode: args.demoMode,
      stale: args.stale,
      signalCount: args.signalCount,
      marketCount: args.marketCount,
      bestEdge: args.bestEdge,
      avgEdge: args.avgEdge,
      confidence: args.confidence,
      maxPosition: args.maxPosition,
      threshold: args.threshold,
      balance: args.balance,
      pill: args.pill,
      payload: args.payload,
    });

    return { ok: true, deduped: false };
  },
});
