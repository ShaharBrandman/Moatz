import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T & string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T & string)[];
  emptyMessage?: string;
  selectable?: boolean;
  selected?: string[];
  onSelectChange?: (ids: string[]) => void;
  rowClassName?: (row: T) => string;
}

/** Generic, reusable table with search + sort. */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  emptyMessage = "No data",
  selectable,
  selected = [],
  onSelectChange,
  rowClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let rows = data;
    if (query && searchKeys?.length) {
      const q = query.toLowerCase();
      rows = rows.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[sortKey as keyof T] ?? "");
        const bv = String(b[sortKey as keyof T] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, query, searchKeys, sortKey, sortDir]);

  const allSelected = selectable && filtered.length > 0 && filtered.every((r) => selected.includes(r.id));

  return (
    <div className="space-y-3">
      {searchKeys && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 font-mono text-sm"
            maxLength={100}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-secondary/40 hover:bg-secondary/40">
              {selectable && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={!!allSelected}
                    onChange={(e) =>
                      onSelectChange?.(e.target.checked ? filtered.map((r) => r.id) : [])
                    }
                  />
                </TableHead>
              )}
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-widest text-muted-foreground",
                    c.sortable && "cursor-pointer select-none hover:text-foreground",
                    c.className,
                  )}
                  onClick={() => {
                    if (!c.sortable) return;
                    if (sortKey === c.key) {
                      setSortDir(sortDir === "asc" ? "desc" : "asc");
                    } else {
                      setSortKey(c.key);
                      setSortDir("asc");
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable && sortKey === c.key && (
                      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn("border-border hover:bg-secondary/30", rowClassName?.(row))}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selected.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) onSelectChange?.([...selected, row.id]);
                          else onSelectChange?.(selected.filter((id) => id !== row.id));
                        }}
                      />
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn("font-mono text-sm", c.className)}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}