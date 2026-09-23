import FirecrawlApp from "@mendable/firecrawl-js";
import { tool } from "ai";
import { z } from "zod";

let client = null;

function getClient() {
  if (client) return client;
  client = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  return client;
}

function clip(s, n = 8000) {
  return s.length > n ? s.slice(0, n) : s;
}

/**
 * @param {import("./agent/action-tracker.js").ActionTracker} tracker
 */
export function createWebTools(tracker) {
  return {
    web_search: tool({
      description: "Search the web. Returns title/url/snippet links.",
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(10).optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        const res = await getClient().search(query, { limit, sources: ["web"] });
        const items = (res.web ?? []).slice(0, limit);
        const out =
          items
            .map((d, i) => {
              const title = d.title || "untitled";
              const url = d.url || "no url";
              const snippet = d.snippet || "";
              return `[${i + 1}] ${title}\n${url}\n${snippet}\n`;
            })
            .join("\n\n") || "(no results)";
        tracker.log({
          type: "code_analysis",
          path: "web_search",
          details: { after: out, toolName: "web_search" },
          status: "executed",
        });
        return clip(out);
      },
    }),
    web_crawl: tool({
      description: "Scrape a URL into markdown text.",
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        const doc = await getClient().scrape(url, { formats: ["markdown"] });
        const md = doc.markdown ?? "";
        tracker.log({
          type: "code_analysis",
          path: `web_crawl:${url}`,
          details: { after: clip(md), toolName: "web_crawl" },
          status: "executed",
        });
        return clip(md) || "(empty)";
      },
    }),
    fetch_url: tool({
      description: "HTTP GET a URL. Returns response body.",
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        const r = await fetch(url, { redirect: "follow" });
        const body = await r.text();
        const out = clip(body, 16_000);
        tracker.log({
          type: "code_analysis",
          path: `fetch:${url}`,
          details: { after: `HTTP ${r.status}\n\n${out}`, toolName: "fetch_url" },
          status: "executed",
        });
        return `HTTP ${r.status}\n\n${out}`;
      },
    }),
  };
}
