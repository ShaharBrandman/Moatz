import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Send, FolderTree, ChevronRight } from "lucide-react";
import type { Policy, PolicyComparison } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DiffViewer } from "@/components/common/DiffViewer";
import { LoadingState, EmptyState } from "@/components/common/States";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_POLICIES: Policy[] = [
  {
    name: "Global-Access",
    children: [
      {
        name: "Global-DC",
        children: [
          { name: "TLV" },
          { name: "USA" },
          { name: "JPN" },
        ],
      },
      { name: "TLV" },
      { name: "CAL" },
      { name: "NIG" },
    ],
  },
];

const MOCK_COMPARISONS: PolicyComparison[] = [
  {
    ruleName: "ALLOW_INTERNAL_HTTP",
    status: "diff",
    differences: ["source", "ports"],
    csm: { source: ["10.0.0.0/8"], destination: ["0.0.0.0/0"], ports: ["tcp/80"], action: "allow", enabled: true },
    fmc: { source: ["10.0.1.0/24"], destination: ["0.0.0.0/0"], ports: ["tcp/8080"], action: "allow", enabled: true },
  },
  {
    ruleName: "BLOCK_EXTERNAL_SSH",
    status: "match",
    differences: [],
    csm: { source: ["0.0.0.0/0"], destination: ["192.168.1.0/24"], ports: ["tcp/22"], action: "deny", enabled: true },
    fmc: { source: ["0.0.0.0/0"], destination: ["192.168.1.0/24"], ports: ["tcp/22"], action: "deny", enabled: true },
  },
  {
    ruleName: "PERMIT_DNS_OUTBOUND",
    status: "missing-fmc",
    differences: [],
    csm: { source: ["10.0.0.0/8"], destination: ["8.8.8.8"], ports: ["udp/53"], action: "allow", enabled: true },
    fmc: undefined,
  },
  {
    ruleName: "ALLOW_MGMT_HTTPS",
    status: "diff",
    differences: ["action", "enabled"],
    csm: { source: ["172.16.0.0/12"], destination: ["10.10.10.1"], ports: ["tcp/443"], action: "allow", enabled: false },
    fmc: { source: ["172.16.0.0/12"], destination: ["10.10.10.1"], ports: ["tcp/443"], action: "deny", enabled: true },
  },
  {
    ruleName: "FMC_ONLY_RULE",
    status: "missing-csm",
    differences: [],
    csm: undefined,
    fmc: { source: ["198.51.100.0/24"], destination: ["10.0.0.0/8"], ports: ["tcp/8443"], action: "allow", enabled: true },
  },
];

// ─── MOCK FUNCTIONS ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mockComparePolicies(): Promise<PolicyComparison[]> {
  await sleep(800);
  return MOCK_COMPARISONS;
}

async function mockSubmitToFmc(ruleNames: string[]): Promise<{ submitted: number }> {
  await sleep(700);
  return { submitted: ruleNames.length };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const flattenPolicies = (
  nodes: Policy[],
  depth = 0,
): Array<{ label: string; depth: number }> =>
  nodes.flatMap((node) => [
    { label: node.name, depth },
    ...(node.children ? flattenPolicies(node.children, depth + 1) : []),
  ]);

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PolicyComparison["status"] }) {
  const map: Record<PolicyComparison["status"], { label: string; cls: string }> = {
    match: { label: "match", cls: "bg-success/15 text-success" },
    diff: { label: "diff", cls: "bg-warning/15 text-warning" },
    "missing-fmc": { label: "missing in FMC", cls: "bg-destructive/15 text-destructive" },
    "missing-csm": { label: "missing in CSM", cls: "bg-info/15 text-info" },
  };
  const { label, cls } = map[status];
  return (
    <Badge className={cn("font-mono text-[10px] uppercase hover:bg-transparent", cls)}>
      {label}
    </Badge>
  );
}

function RuleDiff({ comparison }: { comparison: PolicyComparison }) {
  const c = comparison.csm;
  const f = comparison.fmc;
  return (
    <div className="grid gap-3 p-3 md:grid-cols-2">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CSM</div>
        <DiffViewer left={c?.source ?? []} right={f?.source ?? []} leftLabel="CSM source" rightLabel="FMC source" />
      </div>
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">FMC</div>
        <DiffViewer left={c?.destination ?? []} right={f?.destination ?? []} leftLabel="CSM dest" rightLabel="FMC dest" />
      </div>
      <div className="md:col-span-2">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Ports</div>
        <DiffViewer left={c?.ports ?? []} right={f?.ports ?? []} leftLabel="CSM ports" rightLabel="FMC ports" />
      </div>
      <div className="md:col-span-2 grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/30 p-3 font-mono text-xs">
        <div>
          <span className="text-muted-foreground">action: </span>
          <span className={c && f && c.action !== f.action ? "text-warning" : ""}>
            {c?.action ?? "—"} → {f?.action ?? "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">enabled: </span>
          <span className={c && f && c.enabled !== f.enabled ? "text-warning" : ""}>
            {String(c?.enabled ?? "—")} → {String(f?.enabled ?? "—")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Compare() {
  // Policy gate
  const [policy, setPolicy] = useState("");
  const [policyConfirmed, setPolicyConfirmed] = useState(false);

  // Comparison data
  const [data, setData] = useState<PolicyComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "diff" | "missing">("all");

  // Submit state
  const [submitting, setSubmitting] = useState<string[]>([]);
  const [submittingAll, setSubmittingAll] = useState(false);

  useEffect(() => {
    document.title = "Policy Comparison — Moatz";
  }, []);

  const load = async () => {
    setLoading(true);
    setData(await mockComparePolicies());
    setLoading(false);
  };

  const handleConfirmPolicy = () => {
    if (!policy.trim()) return;
    setPolicyConfirmed(true);
    load();
  };

  const handlePolicyChange = (val: string) => {
    setPolicy(val.replace("\u00A0\u00A0\u00A0\u00A0", "").replace("↳", ""));
    // reset gate if the user changes the policy after confirming
    if (policyConfirmed) {
      setPolicyConfirmed(false);
      setData([]);
    }
  };

  const handleSubmitRule = async (ruleName: string) => {
    setSubmitting((prev) => [...prev, ruleName]);
    const res = await mockSubmitToFmc([ruleName]);
    setSubmitting((prev) => prev.filter((r) => r !== ruleName));
    toast.success(`Submitted "${ruleName}" to FMC (mock: ${res.submitted})`);
  };

  const handleSubmitAll = async () => {
    const diffRules = data.filter((d) => d.status === "diff").map((d) => d.ruleName);
    if (diffRules.length === 0) return;
    setSubmittingAll(true);
    const res = await mockSubmitToFmc(diffRules);
    setSubmittingAll(false);
    toast.success(`Submitted ${res.submitted} diff rule(s) to FMC`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Moatz-policy-diff-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported comparison results");
  };

  const filtered = useMemo(() => {
    if (tab === "diff") return data.filter((d) => d.status === "diff");
    if (tab === "missing") return data.filter((d) => d.status === "missing-csm" || d.status === "missing-fmc");
    return data;
  }, [data, tab]);

  const counts = useMemo(() => ({
    all: data.length,
    match: data.filter((d) => d.status === "match").length,
    diff: data.filter((d) => d.status === "diff").length,
    missing: data.filter((d) => d.status.startsWith("missing")).length,
  }), [data]);

  const flatPolicies = useMemo(() => flattenPolicies(MOCK_POLICIES), []);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Comparison</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Side-by-side diff of CSM and FMC access rules — source, destination, ports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmitAll}
            disabled={!policyConfirmed || counts.diff === 0 || submittingAll}
          >
            <Send className="mr-2 h-4 w-4" />
            {submittingAll ? "Submitting…" : `Submit all diffs (${counts.diff})`}
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson} disabled={!policyConfirmed}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={!policyConfirmed || loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Re-run
          </Button>
        </div>
      </div>

      {/* ── Policy selector (gate) ──────────────────────────────────────────── */}
      <Card className="border-border bg-card/60 p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Select policy to compare
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56">
            <Label
              htmlFor="policy-search"
              className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
            >
              Policy
            </Label>
            <div className="relative">
              <FolderTree className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="policy-search"
                list="policies-list"
                value={policy}
                onChange={(e) => handlePolicyChange(e.target.value)}
                placeholder="Search and select a policy…"
                className="pl-10 pr-10 font-mono"
                autoComplete="off"
              />
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
            </div>
            <datalist id="policies-list">
              {flatPolicies.map((item) => (
                <option
                  key={`${item.label}-${item.depth}`}
                  value={`${"\u00A0\u00A0\u00A0\u00A0".repeat(item.depth)}${item.depth > 0 ? "↳ " : ""}${item.label}`}
                />
              ))}
            </datalist>
          </div>
          <Button
            onClick={handleConfirmPolicy}
            disabled={!policy.trim() || loading}
          >
            {loading ? "Loading…" : policyConfirmed ? "Reload comparison" : "Load comparison"}
          </Button>
        </div>
        {policyConfirmed && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-success">
            Policy active: {policy.trim()}
          </p>
        )}
      </Card>

      {/* ── Stats cards ─────────────────────────────────────────────────────── */}
      {policyConfirmed && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.all, color: "text-foreground" },
              { label: "Match", value: counts.match, color: "text-success" },
              { label: "Diff", value: counts.diff, color: "text-warning" },
              { label: "Missing", value: counts.missing, color: "text-destructive" },
            ].map((s) => (
              <Card key={s.label} className="border-border bg-card/60 p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
                <div className={cn("mt-2 text-3xl font-semibold tracking-tight", s.color)}>
                  {s.value}
                </div>
              </Card>
            ))}
          </div>

          {/* ── Tabs + rule list ──────────────────────────────────────────── */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="diff">Diffs</TabsTrigger>
              <TabsTrigger value="missing">Missing</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <LoadingState label="Computing diff" />
              ) : filtered.length === 0 ? (
                <EmptyState title="No rules in this view" description="Try a different tab." />
              ) : (
                <div className="space-y-2">
                  {filtered.map((c) => (
                    <Collapsible key={c.ruleName}>
                      <Card className="overflow-hidden border-border bg-card/60">
                        <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-secondary/30 [&[data-state=open]>svg:first-child]:rotate-90">
                          <ChevronRight className="h-4 w-4 shrink-0 transition" />
                          <div className="flex-1">
                            <div className="font-mono text-sm font-semibold">{c.ruleName}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                              {c.differences.length > 0
                                ? `differs on: ${c.differences.join(", ")}`
                                : c.status === "match"
                                  ? "rules are identical"
                                  : c.status === "missing-fmc"
                                    ? "rule is not present in FMC"
                                    : "rule is not present in CSM"}
                            </div>
                          </div>
                          <StatusBadge status={c.status} />
                          {c.status === "diff" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={submitting.includes(c.ruleName)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitRule(c.ruleName);
                              }}
                            >
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              {submitting.includes(c.ruleName) ? "Submitting…" : "Submit to FMC"}
                            </Button>
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-border bg-background/40">
                            <RuleDiff comparison={c} />
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}