import type { ObjectOverride, PolicyComparison, PolicyRule, SystemStatus, DataSource } from "@/types";
import { mockCsmRules, mockFmcRules, mockOverrides, mockStatus } from "./mock-data";
import { logDebug } from "@/store/debug";

// Simulated network latency
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

async function withDebug<T>(method: string, endpoint: string, payload: unknown, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const data = await fn();
    logDebug({
      method,
      endpoint,
      request: payload,
      response: data,
      durationMs: Math.round(performance.now() - start),
      level: "info",
    });
    return data;
  } catch (err) {
    logDebug({
      method,
      endpoint,
      request: payload,
      response: { error: String(err) },
      durationMs: Math.round(performance.now() - start),
      level: "error",
    });
    throw err;
  }
}

export const api = {
  async getStatus(): Promise<SystemStatus> {
    return withDebug("GET", "/api/status", null, async () => {
      await delay(400);
      return mockStatus;
    });
  },
  async getOverrides(source: DataSource): Promise<ObjectOverride[]> {
    return withDebug("GET", `/api/overrides?source=${source}`, { source }, async () => {
      await delay(700);
      // Simulate slight variation when remote
      return source === "remote-csm" ? mockOverrides.slice(0, 6) : mockOverrides;
    });
  },
  async pushOverridesToFmc(ids: string[]): Promise<{ success: true; pushed: number }> {
    return withDebug("POST", "/api/fmc/push-overrides", { ids }, async () => {
      await delay(900);
      return { success: true as const, pushed: ids.length };
    });
  },
  async getCsmPolicies(): Promise<PolicyRule[]> {
    return withDebug("GET", "/api/csm/policies", null, async () => {
      await delay(500);
      return mockCsmRules;
    });
  },
  async getFmcPolicies(): Promise<PolicyRule[]> {
    return withDebug("GET", "/api/fmc/policies", null, async () => {
      await delay(500);
      return mockFmcRules;
    });
  },
  async comparePolicies(): Promise<PolicyComparison[]> {
    return withDebug("GET", "/api/compare/policies", null, async () => {
      await delay(800);
      const csm = mockCsmRules;
      const fmc = mockFmcRules;
      const names = Array.from(new Set([...csm.map((r) => r.name), ...fmc.map((r) => r.name)]));
      const eqArr = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
      return names.map<PolicyComparison>((name) => {
        const c = csm.find((r) => r.name === name);
        const f = fmc.find((r) => r.name === name);
        if (c && !f) return { ruleName: name, csm: c, status: "missing-fmc", differences: [] };
        if (f && !c) return { ruleName: name, fmc: f, status: "missing-csm", differences: [] };
        if (!c || !f) return { ruleName: name, status: "missing-csm", differences: [] };
        const diffs: string[] = [];
        if (!eqArr(c.source, f.source)) diffs.push("source");
        if (!eqArr(c.destination, f.destination)) diffs.push("destination");
        if (!eqArr(c.ports, f.ports)) diffs.push("ports");
        if (c.action !== f.action) diffs.push("action");
        if (c.enabled !== f.enabled) diffs.push("enabled");
        return {
          ruleName: name,
          csm: c,
          fmc: f,
          status: diffs.length ? "diff" : "match",
          differences: diffs,
        };
      });
    });
  },
};