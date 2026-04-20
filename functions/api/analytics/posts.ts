import type { Env } from "../../_lib/env";
import { json } from "../../_lib/response";

interface AnalyticsItem {
  path: string;
  slug: string;
  pageviews: number;
  visits: number;
}

interface GraphQLResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        rumPageloadEventsAdaptiveGroups?: Array<{
          count?: number;
          sum?: { visits?: number };
          dimensions?: { metric?: string; requestPath?: string };
        }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

function extractSlug(path: string, prefix: string): string {
  if (!path) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefixNormalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  let tail = normalized;
  if (prefixNormalized !== "/" && tail.startsWith(prefixNormalized)) {
    tail = tail.slice(prefixNormalized.length);
  } else if (tail.startsWith("/")) {
    tail = tail.slice(1);
  }
  tail = tail.replace(/\/index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "");
  if (!tail) return "";
  const parts = tail.split("/");
  return parts[parts.length - 1];
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_ANALYTICS_TOKEN;
  const siteTag = env.CF_ANALYTICS_SITE_TAG;

  if (!accountId || !token || !siteTag) {
    return json({ enabled: false, items: [] });
  }

  const url = new URL(request.url);
  const daysParam = Number.parseInt(url.searchParams.get("days") ?? "30", 10);
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const prefix = env.BLOG_POST_PATH_PREFIX ?? "/posts/";

  const query = `
    query PostAnalytics($accountTag: String!, $siteTag: String!, $since: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 1000,
            filter: { siteTag: $siteTag, date_geq: $since }
          ) {
            count
            sum { visits }
            dimensions { metric }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { accountTag: accountId, siteTag, since },
      }),
    });

    if (!response.ok) {
      console.error("analytics graphql failed", response.status, await response.text());
      return json({ enabled: true, items: [], error: "上游查询失败" }, { status: 200 });
    }

    const result = (await response.json()) as GraphQLResponse;
    if (result.errors?.length) {
      console.error("analytics graphql errors", result.errors);
      return json(
        { enabled: true, items: [], error: result.errors[0].message },
        { status: 200 },
      );
    }

    const groups = result.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
    const aggregated = new Map<string, AnalyticsItem>();

    for (const group of groups) {
      const path = group.dimensions?.metric ?? group.dimensions?.requestPath ?? "";
      const slug = extractSlug(path, prefix);
      if (!slug) continue;
      const pageviews = Number(group.count ?? 0);
      const visits = Number(group.sum?.visits ?? 0);
      const existing = aggregated.get(slug);
      if (existing) {
        existing.pageviews += pageviews;
        existing.visits += visits;
      } else {
        aggregated.set(slug, { path, slug, pageviews, visits });
      }
    }

    return json({
      enabled: true,
      days,
      items: Array.from(aggregated.values()),
    });
  } catch (error) {
    console.error("analytics fetch error", error);
    return json(
      { enabled: true, items: [], error: "网络错误" },
      { status: 200 },
    );
  }
};
