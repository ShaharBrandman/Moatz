import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { PolicyComparison } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { DiffViewer } from "@/components/common/DiffViewer";
import { LoadingState, EmptyState } from "@/components/common/States";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function StatusBadge({ status }: { status: PolicyComparison["status"] }) {
  const map: Record<PolicyComparison["status"], { label: string; cls: string }> = {
    match: { label: "match", cls: "bg-success/15 text-success" },
    diff: { label: "diff", cls: "bg-warning/15 text-warning" },
    "missing-fmc": { label: "missing in FMC", cls: "bg-destructive/15 text-destructive" },
    "missing-csm": { label: "missing in CSM", cls: "bg-info/15 text-info" },
  };
  const { label, cls } = map[status];
  return <Badge className={cn("font-mono text-[10px] uppercase hover:bg-transparent", cls)}>{label}</Badge>;
}

interface RuleDiffProps {
  comparison: PolicyComparison;
}
function RuleDiff({ comparison }: RuleDiffProps) {
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

export default function Compare() {
  const [data, setData] = useState<PolicyComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "diff" | "missing">("all");

  const load = async () => {
    setLoading(true);
    setData(await api.comparePolicies());
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Policy Comparison — Moatz";
    load();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Comparison</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Side-by-side diff of CSM and FMC access rules — source, destination, ports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Re-run
          </Button>
        </div>
      </div>

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
            <div className={cn("mt-2 text-3xl font-semibold tracking-tight", s.color)}>{s.value}</div>
          </Card>
        ))}
      </div>

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
                    <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-secondary/30 [&[data-state=open]>svg]:rotate-90">
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
    </div>
  );
}