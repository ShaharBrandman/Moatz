import { cn } from "@/lib/utils";

interface DiffViewerProps {
  left: string[];
  right: string[];
  leftLabel?: string;
  rightLabel?: string;
}

/** Git-style line diff viewer. Items present only on one side render as +/-. */
export function DiffViewer({ left, right, leftLabel = "CSM", rightLabel = "FMC" }: DiffViewerProps) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const all = Array.from(new Set([...left, ...right]));

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/40 font-mono text-xs">
      <div className="grid grid-cols-2 border-b border-border bg-secondary/40">
        <div className="border-r border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          − {leftLabel}
        </div>
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          + {rightLabel}
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="border-r border-border">
          {left.length === 0 && (
            <div className="px-3 py-2 italic text-muted-foreground">∅ none</div>
          )}
          {left.map((v, i) => {
            const inRight = rightSet.has(v);
            return (
              <div
                key={`l-${i}`}
                className={cn(
                  "px-3 py-1",
                  !inRight && "bg-diff-removed-bg text-diff-removed-fg",
                )}
              >
                {!inRight && <span className="mr-2 select-none">−</span>}
                {v}
              </div>
            );
          })}
        </div>
        <div>
          {right.length === 0 && (
            <div className="px-3 py-2 italic text-muted-foreground">∅ none</div>
          )}
          {right.map((v, i) => {
            const inLeft = leftSet.has(v);
            return (
              <div
                key={`r-${i}`}
                className={cn(
                  "px-3 py-1",
                  !inLeft && "bg-diff-added-bg text-diff-added-fg",
                )}
              >
                {!inLeft && <span className="mr-2 select-none">+</span>}
                {v}
              </div>
            );
          })}
        </div>
      </div>
      {/* Render union-only items on opposite side as empty placeholders for alignment */}
      {all.length === 0 && (
        <div className="px-3 py-2 text-muted-foreground">No values</div>
      )}
    </div>
  );
}