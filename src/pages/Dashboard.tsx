import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  GitCompareArrows,
  RefreshCw,
  Server,
  Workflow,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { SystemStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/common/States";

interface StatusCardProps {
  label: string;
  ok: boolean;
  detail: string;
  icon: React.ReactNode;
}
function StatusCard({ label, ok, detail, icon }: StatusCardProps) {
  return (
    <Card className="relative overflow-hidden border-border bg-card/60 p-4">
      <div className="absolute inset-x-0 top-0 h-px scan-line" />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
        </div>
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">
        {ok ? "Online" : "Offline"}
      </div>
      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}

const modules = [
  {
    title: "CSM Overrides",
    desc: "Inspect object overrides from CSM and stage them for FMC push.",
    to: "/overrides",
    icon: Database,
  },
  {
    title: "Policy Comparison",
    desc: "Side-by-side diff of CSM and FMC access rules.",
    to: "/compare",
    icon: GitCompareArrows,
  },
  {
    title: "Combined Workflow",
    desc: "End-to-end migration check: overrides + policies in one report.",
    to: "/combined",
    icon: Workflow,
  },
];

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setStatus(await api.getStatus());
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Dashboard — Moatz";
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Migration Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational overview of CSM, FMC and the Moatz local datastore.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading || !status ? (
        <LoadingState label="Polling system status" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              label="CSM"
              ok={status.csmConnected}
              detail="csm-prod.local:443"
              icon={<Server className="h-3.5 w-3.5" />}
            />
            <StatusCard
              label="FMC"
              ok={status.fmcConnected}
              detail="fmc-01.corp:8443"
              icon={<Server className="h-3.5 w-3.5" />}
            />
            <StatusCard
              label="Local DB"
              ok={status.localDbConnected}
              detail="postgres://moatz"
              icon={<Database className="h-3.5 w-3.5" />}
            />
            <Card className="relative overflow-hidden border-border bg-card/60 p-4">
              <div className="absolute inset-x-0 top-0 h-px scan-line" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Last sync</span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">
                {new Date(status.lastSync).toLocaleTimeString()}
              </div>
              <p className="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 text-warning" />
                {status.errors} errors in last run
              </p>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Modules
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {modules.map((m) => (
                <Link key={m.to} to={m.to}>
                  <Card className="group h-full border-border bg-card/60 p-5 transition hover:border-primary/40 hover:bg-card">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                        <m.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold">{m.title}</h3>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{m.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}