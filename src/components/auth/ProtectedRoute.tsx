import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/store/auth";
import type { Role } from "@/types";

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

/** Route guard that enforces login + optional role. */
export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (requiredRole && user.role !== "admin" && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
