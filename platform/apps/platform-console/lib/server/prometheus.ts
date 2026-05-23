const DEFAULT_PROM_BASE_URL = "http://prometheus:9090";

export type ServiceStatus = {
  name: string;
  job: string;
  up: boolean | null;
  uptimePercent30d: number | null;
};

type PromResult = {
  metric: Record<string, string>;
  value: [number, string];
};

type PromInstantResponse = {
  status?: string;
  data?: { resultType?: string; result?: PromResult[] };
};

export const KNOWN_SERVICES: Array<{ name: string; job: string }> = [
  { name: "Gateway", job: "gateway" },
  { name: "Auth", job: "auth" },
  { name: "Billing", job: "billing" },
  { name: "Policy", job: "policy" },
  { name: "Risk", job: "risk" },
  { name: "Relay", job: "relay" }
];

function promBaseUrl(): string {
  const value = (process.env.PROMETHEUS_BASE_URL ?? DEFAULT_PROM_BASE_URL).trim();
  return value.replace(/\/+$/, "") || DEFAULT_PROM_BASE_URL;
}

async function queryInstant(query: string): Promise<PromResult[]> {
  const url = `${promBaseUrl()}/api/v1/query?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`prometheus query failed (${response.status})`);
  }
  const payload = (await response.json()) as PromInstantResponse;
  if (payload.status !== "success") {
    throw new Error(`prometheus query rejected (status=${payload.status ?? "unknown"})`);
  }
  return payload.data?.result ?? [];
}

function bucketByJob(results: PromResult[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of results) {
    const job = item.metric.job;
    const value = Number.parseFloat(item.value[1]);
    if (!job || Number.isNaN(value)) continue;
    map[job] = value;
  }
  return map;
}

export async function fetchPlatformStatus(): Promise<{ generatedAt: string; services: ServiceStatus[]; available: boolean }> {
  try {
    const [upResults, uptimeResults] = await Promise.all([
      queryInstant(`up{job=~"gateway|auth|billing|policy|risk|relay"}`),
      queryInstant(`avg_over_time(up{job=~"gateway|auth|billing|policy|risk|relay"}[30d])`)
    ]);
    const upByJob = bucketByJob(upResults);
    const uptimeByJob = bucketByJob(uptimeResults);
    const services: ServiceStatus[] = KNOWN_SERVICES.map(({ name, job }) => ({
      name,
      job,
      up: typeof upByJob[job] === "number" ? upByJob[job] === 1 : null,
      uptimePercent30d: typeof uptimeByJob[job] === "number" ? Math.max(0, Math.min(100, uptimeByJob[job] * 100)) : null
    }));
    return { generatedAt: new Date().toISOString(), services, available: true };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      services: KNOWN_SERVICES.map(({ name, job }) => ({ name, job, up: null, uptimePercent30d: null })),
      available: false
    };
  }
}
