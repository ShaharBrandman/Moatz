import { useMemo, useState } from "react";
import { Database, Globe, Send, ShieldAlert } from "lucide-react";
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_DEVICES = {
  csm: ["ASA-BRANCH-01", "FTD-HQ-CORE", "FTD-DC-EDGE"],
  fmc: ["FMC-MANAGED-01", "FTD-HQ-CORE", "FTD-DC-EDGE"],
};

const MOCK_OVERRIDES: ObjectOverride[] = [
  {
    id: "1",
    device: "FTD-HQ-CORE",
    objectName: "OBJ_INSIDE_NET",
    objectType: "network",
    originalValue: "10.0.0.0/24",
    overriddenValue: "192.168.10.0/24",
    pushed: false,
  },
  {
    id: "2",
    device: "FTD-HQ-CORE",
    objectName: "SVC_HTTP",
    objectType: "service",
    originalValue: "tcp/80",
    overriddenValue: "tcp/8080",
    pushed: true,
  },
  {
    id: "3",
    device: "ASA-BRANCH-01",
    objectName: "OBJ_DMZ",
    objectType: "network",
    originalValue: "172.16.0.0/16",
    overriddenValue: "172.31.0.0/16",
    pushed: false,
  },
  {
    id: "4",
    device: "FTD-DC-EDGE",
    objectName: "OBJ_WAN_GW",
    objectType: "host",
    originalValue: "203.0.113.1",
    overriddenValue: "198.51.100.1",
    pushed: false,
  },
];

// ─── MOCK FUNCTIONS ───────────────────────────────────────────────────────────

async function checkDevicesExist(
  src: string,
  dst: string,
): Promise<{ ok: boolean; error?: string }> {
  await new Promise((r) => setTimeout(r, 900)); // simulate network latency
  if (!MOCK_DEVICES.csm.includes(src))
    return { ok: false, error: `"${src}" was not found in CSM.` };
  if (!MOCK_DEVICES.fmc.includes(dst))
    return { ok: false, error: `"${dst}" was not found in FMC.` };
  return { ok: true };
}

async function mockPushOverrides(ids: string[]): Promise<{ pushed: number }> {
  await new Promise((r) => setTimeout(r, 800)); // simulate push latency
  return { pushed: ids.length };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Overrides() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Device selection state (new)
  const [srcDevice, setSrcDevice] = useState("");
  const [dstDevice, setDstDevice] = useState("");
  const [devicesVerified, setDevicesVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deviceError, setDeviceError] = useState("");

  // Overrides state
  const [source, setSource] = useState<DataSource>("local-db");
  const [data, setData] = useState<ObjectOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pushing, setPushing] = useState(false);

  // Gated: only called after device verification
  const fetchData = async () => {
    setLoading(true);
    setSelected([]);
    await new Promise((r) => setTimeout(r, 600)); // mock fetch delay
    setData(MOCK_OVERRIDES.filter((o) => o.device === srcDevice));
    setLoading(false);
  };

  // New: verify both devices exist before revealing the overrides UI
  const handleVerify = async () => {
    setVerifying(true);
    setDeviceError("");
    const result = await checkDevicesExist(srcDevice, dstDevice);
    setVerifying(false);
    if (!result.ok) {
      setDeviceError(result.error ?? "Unknown error.");
      return;
    }
    setDevicesVerified(true);
    fetchData();
  };

  const handlePush = async () => {
    setPushing(true);
    const res = await mockPushOverrides(selected); // ← was api.pushOverridesToFmc
    setPushing(false);
    setConfirmOpen(false);
    setData((prev) =>
      prev.map((d) => (selected.includes(d.id) ? { ...d, pushed: true } : d)),
    );
    setSelected([]);
    toast.success(`Pushed ${res.pushed} override(s) to FMC`);
  };

  const columns: Column<ObjectOverride>[] = useMemo(
    () => [
      { key: "device", header: "Device", sortable: true },
      {
        key: "objectName",
        header: "Object",
        sortable: true,
        render: (r) => <span className="text-foreground">{r.objectName}</span>,
      },
      {
        key: "objectType",
        header: "Type",
        render: (r) => (
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {r.objectType}
          </Badge>
        ),
      },
      {
        key: "originalValue",
        header: "Original",
        render: (r) => (
          <span className="text-diff-removed-fg">{r.originalValue}</span>
        ),
      },
      {
        key: "overriddenValue",
        header: "Overridden",
        render: (r) => (
          <span className="text-diff-added-fg">{r.overriddenValue}</span>
        ),
      },
      {
        key: "pushed",
        header: "Status",
        render: (r) =>
          r.pushed ? (
            <Badge className="bg-success/15 text-success hover:bg-success/15">
              pushed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-warning/40 text-warning"
            >
              pending
            </Badge>
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

      {/* ── Step 1: Device selection (new) ─────────────────────────────── */}
      <Card className="border-border bg-card/60 p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Step 1 — identify devices
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Source device (CSM)
            </label>
            <Select value={srcDevice} onValueChange={(v) => { setSrcDevice(v); setDevicesVerified(false); }}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select CSM device…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_DEVICES.csm.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Destination device (FMC)
            </label>
            <Select value={dstDevice} onValueChange={(v) => { setDstDevice(v); setDevicesVerified(false); }}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select FMC device…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_DEVICES.fmc.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleVerify}
            disabled={!srcDevice || !dstDevice || verifying}
          >
            {verifying ? "Checking…" : "Verify & load overrides"}
          </Button>
        </div>

        {deviceError && (
          <p className="mt-2 text-sm text-destructive">{deviceError}</p>
        )}
      </Card>

      {/* ── Step 2+: Source selector & table — gated behind verification ── */}
      {devicesVerified && (
        <>
          <Card className="border-border bg-card/60 p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Step 2 — choose data source &amp; push
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Data source
                </label>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as DataSource)}
                >
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
              <Button variant="outline" onClick={fetchData} disabled={loading}>
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
            <LoadingState label={`Fetching overrides for ${srcDevice}`} />
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
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push overrides to FMC</DialogTitle>
            <DialogDescription>
              {selected.length} override{selected.length === 1 ? "" : "s"} from{" "}
              <strong>{srcDevice}</strong> will be promoted into{" "}
              <strong>{dstDevice}</strong>. This is a mocked action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={pushing}
            >
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