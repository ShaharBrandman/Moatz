import { useEffect } from "react";
import { Bug, Trash2 } from "lucide-react";
import { useDebug } from "@/store/debug";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/States";

export default function DebugPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { enabled, setEnabled, verbose, setVerbose, entries, clear } = useDebug();

  useEffect(() => {
    document.title = "Debug Console — Moatzm";
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debug Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mocked API request/response stream and verbose logging.
        </p>
      </div>

      <Card className="border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-warning" />
            <span className="font-mono text-[11px] uppercase tracking-widest">debug mode</span>
            <Switch
              checked={enabled}
              disabled={!isAdmin}
              onCheckedChange={setEnabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest">verbose</span>
            <Switch checked={verbose} disabled={!isAdmin} onCheckedChange={setVerbose} />
          </div>
          {!isAdmin && (
            <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-warning">
              admin only
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </Card>

      {entries.length === 0 ? (
        <EmptyState title="No log entries" description="Use any module to populate the stream." />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id} className="border-border bg-card/60 p-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    e.level === "error"
                      ? "border-destructive/40 text-destructive"
                      : e.level === "warn"
                        ? "border-warning/40 text-warning"
                        : "border-primary/40 text-primary"
                  }
                >
                  {e.method}
                </Badge>
                <span className="truncate">{e.endpoint}</span>
                <span className="ml-auto text-muted-foreground">{e.durationMs}ms · {new Date(e.ts).toLocaleTimeString()}</span>
              </div>
              {verbose && (
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-background/60 p-2 text-[11px]">
{JSON.stringify({ request: e.request, response: e.response }, null, 2)}
                </pre>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}