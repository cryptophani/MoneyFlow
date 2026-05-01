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
});
