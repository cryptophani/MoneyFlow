import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const citation = v.object({
  title: v.string(),
  url: v.string(),
  source: v.string(),
  publishedDate: v.optional(v.string()),
});

const brief = v.object({
  category: v.string(),
  strategy: v.string(),
  conviction: v.string(),
  impactScore: v.number(),
  updatedAtTs: v.number(),
  updatedAt: v.string(),
  headline: v.string(),
  thesis: v.string(),
  risk: v.string(),
  watchSignals: v.array(v.string()),
  citations: v.array(citation),
  source: v.string(),
  stale: v.boolean(),
});

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("researchBriefs").withIndex("by_updatedAtTs").order("desc").take(30);
    const seen = new Set<string>();
    const latestByCategory = [];

    for (const row of rows) {
      if (seen.has(row.category)) {
        continue;
      }
      seen.add(row.category);
      latestByCategory.push(row.payload);
    }

    return latestByCategory.sort((a, b) => b.impactScore - a.impactScore);
  },
});

export const ingestBatch = mutation({
  args: { briefs: v.array(brief) },
  handler: async (ctx, args) => {
    for (const item of args.briefs) {
      const latestForCategory = await ctx.db
        .query("researchBriefs")
        .withIndex("by_category", (q) => q.eq("category", item.category))
        .order("desc")
        .first();

      if (latestForCategory?.updatedAt === item.updatedAt && latestForCategory?.headline === item.headline) {
        await ctx.db.patch(latestForCategory._id, {
          strategy: item.strategy,
          conviction: item.conviction,
          impactScore: item.impactScore,
          updatedAtTs: item.updatedAtTs,
          updatedAt: item.updatedAt,
          headline: item.headline,
          payload: item,
        });
        continue;
      }

      await ctx.db.insert("researchBriefs", {
        category: item.category,
        strategy: item.strategy,
        conviction: item.conviction,
        impactScore: item.impactScore,
        updatedAtTs: item.updatedAtTs,
        updatedAt: item.updatedAt,
        headline: item.headline,
        payload: item,
      });
    }

    return { ok: true, count: args.briefs.length };
  },
});
