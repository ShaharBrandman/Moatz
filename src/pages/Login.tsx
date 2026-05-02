import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { z } from "zod";
import { Network, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  username: z.string().trim().min(1, "Username required").max(50),
  password: z.string().min(1, "Password required").max(100),
});

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Login — Moatzm";
  }, []);

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(parsed.data.username, parsed.data.password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed");
      return;
    }
    toast.success(`Welcome back, ${parsed.data.username}`);
    navigate(from, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black, transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/40">
            <Network className="h-6 w-6 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient">Moatzm</span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Migration Toolkit · ASA · CSM → FMC
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-xl p-6 shadow-2xl shadow-primary/5"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Mock authentication — no credentials are transmitted.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="username" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={50}
                className="mt-1 font-mono"
                placeholder="admin or viewer"
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                maxLength={100}
                className="mt-1 font-mono"
                placeholder="••••••"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-5 w-full">
            <Lock className="mr-2 h-4 w-4" />
            {loading ? "Authenticating…" : "Sign in"}
          </Button>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setUsername("admin"); setPassword("admin"); }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-3 py-2 text-left hover:bg-secondary"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <div>
                <div className="font-mono font-medium">admin / admin</div>
                <div className="text-[10px] text-muted-foreground">Full access</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setUsername("viewer"); setPassword("viewer"); }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-3 py-2 text-left hover:bg-secondary"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <div className="font-mono font-medium">viewer / viewer</div>
                <div className="text-[10px] text-muted-foreground">Read-only</div>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}