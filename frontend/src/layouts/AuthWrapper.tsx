import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { User, UserRole } from "@/types";
import { getUserFromStorage } from "./MainLayout";

const Login = lazy(() => import("@/pages/common/Login"));

export function RequireAuth({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole;
}) {
  const user = getUserFromStorage();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return <RequireAuth requiredRole="admin">{children}</RequireAuth>;
}

export function RequireStudent({ children }: { children: React.ReactNode }) {
  return <RequireAuth requiredRole="student">{children}</RequireAuth>;
}

export function RequireTeacher({ children }: { children: React.ReactNode }) {
  return <RequireAuth requiredRole="teacher">{children}</RequireAuth>;
}

export function UserAwareWrapper({
  userRole,
  renderChild,
}: {
  userRole?: UserRole;
  renderChild: (user: User) => React.ReactNode;
}) {
  const user = getUserFromStorage();
  if (!user) return null;
  if (userRole && user.role !== userRole) return null;
  return <>{renderChild(user)}</>;
}

export function LoginPage({ onLogin }: { onLogin?: (user: User) => void }) {
  const user = getUserFromStorage();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return (
    <Login
      onLogin={(loggedInUser: User) => {
        onLogin?.(loggedInUser);
      }}
    />
  );
}

export { getUserFromStorage };
