import { create } from "zustand";
import type { DebugEntry } from "@/types";

interface DebugState {
  enabled: boolean;
  verbose: boolean;
  open: boolean;
  entries: DebugEntry[];
  setEnabled: (v: boolean) => void;
  setVerbose: (v: boolean) => void;
  setOpen: (v: boolean) => void;
  push: (e: Omit<DebugEntry, "id" | "ts">) => void;
  clear: () => void;
}

export const useDebug = create<DebugState>((set, get) => ({
  enabled: false,
  verbose: false,
  open: false,
  entries: [],
  setEnabled: (v) => set({ enabled: v, open: v ? get().open : false }),
  setVerbose: (v) => set({ verbose: v }),
  setOpen: (v) => set({ open: v }),
  push: (e) =>
    set((s) => ({
      entries: [
        { ...e, id: crypto.randomUUID(), ts: new Date().toISOString() },
        ...s.entries,
      ].slice(0, 100),
    })),
  clear: () => set({ entries: [] }),
}));

export function logDebug(e: Omit<DebugEntry, "id" | "ts">) {
  // Always record so toggling debug shows historical context.
  useDebug.getState().push(e);
}
