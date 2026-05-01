import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  snapshots: defineTable({
    createdAtTs: v.number(),
    updatedAt: v.string(),
    source: v.string(),
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
  }).index("by_createdAtTs", ["createdAtTs"]),
  researchBriefs: defineTable({
    category: v.string(),
    strategy: v.string(),
    conviction: v.string(),
    impactScore: v.number(),
    updatedAtTs: v.number(),
    updatedAt: v.string(),
    headline: v.string(),
    payload: v.any(),
  })
    .index("by_updatedAtTs", ["updatedAtTs"])
    .index("by_category", ["category", "updatedAtTs"]),
  paperBets: defineTable({
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
    modelProb: v.number(),
    entryPrice: v.number(),
    sizeUsdc: v.number(),
    expiry: v.string(),
    openedAtTs: v.number(),
    openedAt: v.string(),
    resolvedAtTs: v.optional(v.number()),
    resolvedAt: v.optional(v.string()),
    result: v.optional(v.number()),
    pnl: v.optional(v.number()),
    resolutionSource: v.optional(v.string()),
  })
    .index("by_betKey", ["betKey"])
    .index("by_status", ["status", "openedAtTs"])
    .index("by_category", ["category", "openedAtTs"]),
});
