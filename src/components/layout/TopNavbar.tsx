import { Bug, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/auth";
import { useDebug } from "@/store/debug";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function TopNavbar() {
  const { user, logout } = useAuth();
  const { enabled, setEnabled, setOpen } = useDebug();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  const handleDebugToggle = (v: boolean) => {
    if (!isAdmin) {
      toast.error("Admin role required to toggle debug mode");
      return;
    }
    setEnabled(v);
    setOpen(v);
    toast.success(`Debug mode ${v ? "enabled" : "disabled"}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-xl md:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <div className="hidden items-center gap-2 md:flex">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            session
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {new Date().toISOString().slice(0, 10)}
          </span>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5">
          <Bug className="h-3.5 w-3.5 text-warning" />
          <span className="font-mono text-[11px] uppercase tracking-widest">debug</span>
          <Switch checked={enabled} onCheckedChange={handleDebugToggle} />
        </div>
      )}

      {user && (
        <>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{user.username}</span>
            <Badge variant={user.role === "admin" ? "default" : "secondary"} className="font-mono text-[10px] uppercase">
              {user.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      )}
    </header>
  );
}
