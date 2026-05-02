import { useDebug } from "@/store/debug";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export function DebugDrawer() {
  const { open, setOpen, entries, verbose, setVerbose, clear, enabled } = useDebug();

  if (!enabled) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-2xl border-l border-border bg-card">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-warning">debug</span>
            Console
          </SheetTitle>
          <SheetDescription>
            Mocked API request/response stream. Useful for diagnosing migration flows.
          </SheetDescription>
        </SheetHeader>

        <div className="my-4 flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest">verbose</span>
            <Switch checked={verbose} onCheckedChange={setVerbose} />
          </div>
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] pr-3">
          {entries.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No entries yet. Trigger an action to populate the log.
            </div>
          )}
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-md border border-border bg-background/60 p-3 font-mono text-xs">
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
                  <span className="ml-auto text-muted-foreground">{e.durationMs}ms</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{e.ts}</div>
                {verbose && (
                  <div className="mt-2 space-y-1">
                    <div>
                      <span className="text-muted-foreground">→ request: </span>
                      <span className="break-all">{JSON.stringify(e.request)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">← response: </span>
                      <span className="break-all">{JSON.stringify(e.response).slice(0, 400)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}