import type { ObjectOverride, PolicyRule, SystemStatus } from "@/types";

export const mockStatus: SystemStatus = {
  csmConnected: true,
  fmcConnected: true,
  localDbConnected: true,
  lastSync: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  errors: 2,
};

export const mockOverrides: ObjectOverride[] = [
  { id: "o1", device: "ASA-EDGE-01", objectName: "WEB_SRV_POOL", objectType: "group", originalValue: "10.10.0.0/24", overriddenValue: "10.10.5.0/24", updatedAt: "2025-04-22T10:14:00Z", pushed: false },
  { id: "o2", device: "ASA-EDGE-01", objectName: "DB_HOST_PRIMARY", objectType: "host", originalValue: "10.20.1.5", overriddenValue: "10.20.1.25", updatedAt: "2025-04-21T08:31:00Z", pushed: true },
  { id: "o3", device: "ASA-DC-02", objectName: "MGMT_NET", objectType: "network", originalValue: "192.168.1.0/24", overriddenValue: "192.168.10.0/24", updatedAt: "2025-04-20T15:02:00Z", pushed: false },
  { id: "o4", device: "ASA-DC-02", objectName: "SVC_HTTPS_ALT", objectType: "service", originalValue: "tcp/443", overriddenValue: "tcp/8443", updatedAt: "2025-04-19T11:45:00Z", pushed: false },
  { id: "o5", device: "ASA-BRANCH-07", objectName: "VPN_USERS", objectType: "group", originalValue: "172.16.0.0/16", overriddenValue: "172.16.4.0/22", updatedAt: "2025-04-18T09:12:00Z", pushed: true },
  { id: "o6", device: "ASA-BRANCH-07", objectName: "DNS_FORWARDER", objectType: "host", originalValue: "8.8.8.8", overriddenValue: "10.0.0.53", updatedAt: "2025-04-17T16:20:00Z", pushed: false },
  { id: "o7", device: "ASA-EDGE-01", objectName: "PARTNER_RANGE", objectType: "network", originalValue: "203.0.113.0/24", overriddenValue: "203.0.113.0/27", updatedAt: "2025-04-16T07:55:00Z", pushed: false },
  { id: "o8", device: "ASA-DC-02", objectName: "SVC_SSH_ADMIN", objectType: "service", originalValue: "tcp/22", overriddenValue: "tcp/2222", updatedAt: "2025-04-15T13:10:00Z", pushed: true },
];

export const mockCsmRules: PolicyRule[] = [
  { id: "r1", name: "ALLOW_WEB_INBOUND", action: "permit", source: ["any"], destination: ["WEB_SRV_POOL"], ports: ["tcp/80", "tcp/443"], protocol: "tcp", enabled: true },
  { id: "r2", name: "ALLOW_DB_REPL", action: "permit", source: ["10.20.1.0/24"], destination: ["DB_HOST_PRIMARY"], ports: ["tcp/5432"], protocol: "tcp", enabled: true },
  { id: "r3", name: "DENY_LEGACY_TELNET", action: "deny", source: ["any"], destination: ["MGMT_NET"], ports: ["tcp/23"], protocol: "tcp", enabled: true },
  { id: "r4", name: "ALLOW_PARTNER_API", action: "permit", source: ["PARTNER_RANGE"], destination: ["10.50.0.10"], ports: ["tcp/443"], protocol: "tcp", enabled: true },
  { id: "r5", name: "ALLOW_VPN_INTERNAL", action: "permit", source: ["VPN_USERS"], destination: ["10.0.0.0/8"], ports: ["any"], protocol: "ip", enabled: true },
  { id: "r6", name: "ALLOW_DNS_OUT", action: "permit", source: ["any"], destination: ["DNS_FORWARDER"], ports: ["udp/53"], protocol: "udp", enabled: true },
];

export const mockFmcRules: PolicyRule[] = [
  { id: "r1", name: "ALLOW_WEB_INBOUND", action: "permit", source: ["any"], destination: ["WEB_SRV_POOL"], ports: ["tcp/80", "tcp/443"], protocol: "tcp", enabled: true },
  // diff in source range and added port
  { id: "r2", name: "ALLOW_DB_REPL", action: "permit", source: ["10.20.2.0/24"], destination: ["DB_HOST_PRIMARY"], ports: ["tcp/5432", "tcp/5433"], protocol: "tcp", enabled: true },
  { id: "r3", name: "DENY_LEGACY_TELNET", action: "deny", source: ["any"], destination: ["MGMT_NET"], ports: ["tcp/23"], protocol: "tcp", enabled: false },
  // missing r4 in FMC
  { id: "r5", name: "ALLOW_VPN_INTERNAL", action: "permit", source: ["VPN_USERS"], destination: ["10.0.0.0/8"], ports: ["any"], protocol: "ip", enabled: true },
  { id: "r6", name: "ALLOW_DNS_OUT", action: "permit", source: ["any"], destination: ["DNS_FORWARDER"], ports: ["udp/53", "tcp/53"], protocol: "udp", enabled: true },
  // extra rule only in FMC
  { id: "r7", name: "ALLOW_MONITORING", action: "permit", source: ["10.99.0.0/24"], destination: ["any"], ports: ["udp/161"], protocol: "udp", enabled: true },
];