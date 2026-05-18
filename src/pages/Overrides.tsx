import { useEffect, useMemo, useState } from "react";
import { Database, Globe, Send, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { DataSource, ObjectOverride } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState } from "@/components/common/States";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export default function Overrides() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [source, setSource] = useState<DataSource>("local-db");
  const [data, setData] = useState<ObjectOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    document.title = "CSM Overrides — Moatz";
  }, []);

  const fetchData = async (src: DataSource) => {
    setLoading(true);
    setSelected([]);
    const rows = await api.getOverrides(src);
    setData(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(source);
  }, [source]);

  const handlePush = async () => {
    setPushing(true);
    const res = await api.pushOverridesToFmc(selected);
    setPushing(false);
    setConfirmOpen(false);
    setData((prev) => prev.map((d) => (selected.includes(d.id) ? { ...d, pushed: true } : d)));
    setSelected([]);
    toast.success(`Pushed ${res.pushed} override(s) to FMC`);
  };

  const columns: Column<ObjectOverride>[] = useMemo(
    () => [
      { key: "device", header: "Device", sortable: true },
      { key: "objectName", header: "Object", sortable: true, render: (r) => <span className="text-foreground">{r.objectName}</span> },
      {
        key: "objectType",
        header: "Type",
        render: (r) => (
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {r.objectType}
          </Badge>
        ),
      },
      { key: "originalValue", header: "Original", render: (r) => <span className="text-diff-removed-fg">{r.originalValue}</span> },
      { key: "overriddenValue", header: "Overridden", render: (r) => <span className="text-diff-added-fg">{r.overriddenValue}</span> },
      {
        key: "pushed",
        header: "Status",
        render: (r) =>
          r.pushed ? (
            <Badge className="bg-success/15 text-success hover:bg-success/15">pushed</Badge>
          ) : (
            <Badge variant="outline" className="border-warning/40 text-warning">pending</Badge>
          ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CSM Overrides</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspect device-level overrides and stage them for promotion into FMC.
        </p>
      </div>

      <Card className="border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Data source
            </label>
            <Select value={source} onValueChange={(v) => setSource(v as DataSource)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local-db">
                  <span className="inline-flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" /> Local DB (CSM clone)
                  </span>
                </SelectItem>
                <SelectItem value="remote-csm">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> Remote CSM (API)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => fetchData(source)} disabled={loading}>
            Re-fetch
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {!isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-warning">
                <ShieldAlert className="h-3 w-3" /> read-only
              </span>
            )}
            <Button
              disabled={!isAdmin || selected.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Push {selected.length || ""} to FMC
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingState label={`Fetching from ${source}`} />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchKeys={["objectName", "device", "originalValue", "overriddenValue"]}
          selectable={isAdmin}
          selected={selected}
          onSelectChange={setSelected}
          emptyMessage="No overrides returned by source"
        />
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push overrides to FMC</DialogTitle>
            <DialogDescription>
              {selected.length} override{selected.length === 1 ? "" : "s"} will be promoted into the
              Firepower Management Center. This is a mocked action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pushing}>
              Cancel
            </Button>
            <Button onClick={handlePush} disabled={pushing}>
              {pushing ? "Pushing…" : "Confirm push"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}