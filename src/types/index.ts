// Domain models for Moatzm — frontend-only mock representations.
export type Role = "admin" | "viewer";

export interface User {
  username: string;
  role: Role;
}

export type DataSource = "local-db" | "remote-csm";

export interface ObjectOverride {
  id: string;
  device: string;
  objectName: string;
  objectType: "network" | "host" | "service" | "group";
  originalValue: string;
  overriddenValue: string;
  updatedAt: string;
  pushed: boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  action: "permit" | "deny";
  source: string[];
  destination: string[];
  ports: string[];
  protocol: string;
  enabled: boolean;
}

export interface PolicyComparison {
  ruleName: string;
  csm?: PolicyRule;
  fmc?: PolicyRule;
  status: "match" | "diff" | "missing-fmc" | "missing-csm";
  differences: string[]; // field names that differ
}

export interface SystemStatus {
  csmConnected: boolean;
  fmcConnected: boolean;
  localDbConnected: boolean;
  lastSync: string;
  errors: number;
}

export interface DebugEntry {
  id: string;
  ts: string;
  method: string;
  endpoint: string;
  request?: unknown;
  response?: unknown;
  durationMs: number;
  level: "info" | "warn" | "error";
}