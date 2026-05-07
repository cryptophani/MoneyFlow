import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const paperBet = v.object({
  betKey: v.string(),
  conditionId: v.string(),
  slug: v.string(),
  market: v.string(),
  category: v.string(),
  strategy: v.string(),
  side: v.string(),
  status: v.string(),
  confidence: v.number(),
  edge: v.number(),
  marketProb: v.optional(v.number()),
  expectedValue: v.optional(v.number()),
  oddsMovement: v.optional(v.number()),
  entryTiming: v.optional(v.string()),
  modelProb: v.number(),
  entryPrice: v.number(),
  executionBook: v.optional(v.string()),
  bestAvailablePrice: v.optional(v.number()),
  priceImprovement: v.optional(v.number()),
  bookCount: v.optional(v.number()),
  sizeUsdc: v.number(),
  expiry: v.string(),
  hoursToExpiry: v.optional(v.number()),
  riskScore: v.optional(v.number()),
  riskFlags: v.optional(v.array(v.string())),
  openedAtTs: v.number(),
  openedAt: v.string(),
  resolvedAtTs: v.optional(v.number()),
  resolvedAt: v.optional(v.string()),
  result: v.optional(v.number()),
  pnl: v.optional(v.number()),
  closingPrice: v.optional(v.number()),
  clv: v.optional(v.number()),
  resolutionSource: v.optional(v.string()),
});

export const ingestBatch = mutation({
  args: { bets: v.array(paperBet) },
  handler: async (ctx, args) => {
    let inserted = 0;
    const open = await ctx.db.query("paperBets").withIndex("by_status", (q) => q.eq("status", "open")).collect();
    for (const bet of args.bets) {
      const incomingKey = positionKeyFor(bet);
      const existingOpen = open.find((row) => positionKeyFor(row) === incomingKey);
      if (existingOpen) {
        continue;
      }
      const existing = await ctx.db
        .query("paperBets")
        .withIndex("by_betKey", (q) => q.eq("betKey", bet.betKey))
        .first();
      if (existing) {
        continue;
      }
      await ctx.db.insert("paperBets", bet);
      open.unshift({ ...bet, _id: `pending-${inserted}` as never, _creationTime: Date.now() } as never);
      inserted += 1;
    }
    return { ok: true, inserted };
  },
});

export const dedupeOpenPositions = mutation({
  args: {},
  handler: async (ctx) => {
    const open = await ctx.db.query("paperBets").withIndex("by_status", (q) => q.eq("status", "open")).order("desc").collect();
    const seen = new Set<string>();
    let removed = 0;

    for (const bet of open) {
      const key = positionKeyFor(bet);
      if (!seen.has(key)) {
        seen.add(key);
        continue;
      }
      await ctx.db.delete(bet._id);
      removed += 1;
    }

    return { ok: true, removed };
  },
});

function positionKeyFor(bet: { conditionId: string; side: string; strategy: string }): string {
  return `${bet.conditionId}:${bet.side}:${bet.strategy}`;
}

export const resolveBatch = mutation({
  args: {
    updates: v.array(
      v.object({
        betKey: v.string(),
        status: v.string(),
        resolvedAtTs: v.number(),
        resolvedAt: v.string(),
        result: v.number(),
        pnl: v.number(),
        closingPrice: v.optional(v.number()),
        clv: v.optional(v.number()),
        resolutionSource: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const existing = await ctx.db
        .query("paperBets")
        .withIndex("by_betKey", (q) => q.eq("betKey", update.betKey))
        .first();
      if (!existing || existing.status === "resolved") {
        continue;
      }
      await ctx.db.patch(existing._id, update);
      updated += 1;
    }
    return { ok: true, updated };
  },
});

export const openBets = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return ctx.db.query("paperBets").withIndex("by_status", (q) => q.eq("status", "open")).order("desc").take(limit);
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    return ctx.db.query("paperBets").withIndex("by_status", (q) => q.eq("status", "resolved")).order("desc").take(limit);
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("paperBets").collect();
    const resolved = all.filter((bet) => bet.status === "resolved");
    const open = all.filter((bet) => bet.status === "open");
    const wins = resolved.filter((bet) => (bet.pnl ?? 0) > 0).length;
    const totalPnl = resolved.reduce((sum, bet) => sum + (bet.pnl ?? 0), 0);

    return {
      totalBets: all.length,
      openBets: open.length,
      resolvedBets: resolved.length,
      wins,
      winRate: resolved.length ? wins / resolved.length : 0,
      totalPnl,
    };
  },
});
