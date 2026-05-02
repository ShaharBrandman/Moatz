import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { ObjectOverride, PolicyComparison } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StepState = "idle" | "running" | "done";
interface Step {
  key: string;
  label: string;
  state: StepState;
}

export default function Combined() {
  const [steps, setSteps] = useState<Step[]>([
    { key: "overrides", label: "Pull overrides from CSM", state: "idle" },
    { key: "policies", label: "Compare CSM ↔ FMC policies", state: "idle" },
    { key: "summary", label: "Compute mismatches & required actions", state: "idle" },
  ]);
  const [overrides, setOverrides] = useState<ObjectOverride[]>([]);
  const [comparison, setComparison] = useState<PolicyComparison[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Combined Workflow — Moatzm";
  }, []);

  const setStep = (key: string, state: StepState) =>
    setSteps((s) => s.map((x) => (x.key === key ? { @.x, state } : x)));

  const run = async () => {
    setRunning(true);
    setDone(false);
    setSteps((s) => s.map((x) => ({ @.x, state: "idle" })));

    setStep("overrides", "running");
    const ov = await api.getOverrides("local-db");
    setOverrides(ov);
    setStep("overrides", "done");

    setStep("policies", "running");
    const cmp = await api.comparePolicies();
    setComparison(cmp);
    setStep("policies", "done");

    setStep("summary", "running");
    await new Promise((r) => setTimeout(r, 400));
    setStep("summary", "done");

    setRunning(false);
    setDone(true);
  };

  const pendingPushes = overrides.filter((o) => !o.pushed).length;
  const diffs = comparison.filter((c) => c.status === "diff").length;
  const missing = comparison.filter((c) => c.status.startsWith("missing")).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Combined Workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One-click migration audit: overrides + policy diff + actions.
          </p>
        </div>
        <Button onClick={run} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
          {running ? "Running…" : "Run workflow"}
        </Button>
      </div>

      <Card className="border-border bg-card/60 p-5">
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs",
                  s.state === "done" && "border-success/50 bg-success/10 text-success",
                  s.state === "running" && "border-primary/50 bg-primary/10 text-primary",
                  s.state === "idle" && "border-border text-muted-foreground",
                )}
              >
                {s.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : s.state === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
              </div>
              <span className={cn("font-mono text-sm", s.state === "idle" && "text-muted-foreground")}>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      {done && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border bg-card/60 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Overrides pending push
              </div>
              <div className="mt-2 text-3xl font-semibold text-warning">{pendingPushes}</div>
            </Card>
            <Card className="border-border bg-card/60 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Policy diffs
              </div>
              <div className="mt-2 text-3xl font-semibold text-warning">{diffs}</div>
            </Card>
            <Card className="border-border bg-card/60 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Missing rules
              </div>
              <div className="mt-2 text-3xl font-semibold text-destructive">{missing}</div>
            </Card>
          </div>

          <Card className="border-border bg-card/60 p-5">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Required actions
            </h3>
            <ul className="space-y-2 text-sm">
              {pendingPushes > 0 && (
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="border-warning/40 text-warning">action</Badge>
                  Push {pendingPushes} override(s) to FMC.
                </li>
              )}
              {diffs > 0 && (
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="border-warning/40 text-warning">review</Badge>
                  Review {diffs} rule diff(s) for source/destination/port mismatches.
                </li>
              )}
              {missing > 0 && (
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="border-destructive/40 text-destructive">critical</Badge>
                  Reconcile {missing} rule(s) missing on one side.
                </li>
              )}
              {pendingPushes === 0 && diffs === 0 && missing === 0 && (
                <li className="text-success">Configurations are aligned. No action required.</li>
              )}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}