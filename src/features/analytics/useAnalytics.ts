import { useEffect, useState } from "react";
import { requestJson } from "../../lib/http";

export interface AnalyticsItem {
  path: string;
  slug: string;
  pageviews: number;
  visits: number;
}

export interface AnalyticsResponse {
  enabled: boolean;
  days?: number;
  items: AnalyticsItem[];
  error?: string;
}

export function useAnalytics(days = 30) {
  const [enabled, setEnabled] = useState(false);
  const [map, setMap] = useState<Map<string, AnalyticsItem>>(new Map());
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await requestJson<AnalyticsResponse>(
          `/api/analytics/posts?days=${days}`,
        );
        if (cancelled) return;
        setEnabled(data.enabled);
        if (data.error) setError(data.error);
        const next = new Map<string, AnalyticsItem>();
        for (const item of data.items ?? []) next.set(item.slug, item);
        setMap(next);
      } catch {
        if (!cancelled) {
          setEnabled(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return { enabled, map, error };
}
