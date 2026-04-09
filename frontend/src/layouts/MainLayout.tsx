import { useNavigate } from "react-router-dom";
import { Suspense } from "react";
import type { User } from "@/types";
import { AppLayout, Loading } from "./AppLayout";

export function getUserFromStorage(): User | null {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (token && userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
  return null;
}

export function MainLayout() {
  const navigate = useNavigate();
  const user = getUserFromStorage();
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }
  return <AppLayout user={user} />;
}

export { AppLayout, Loading } from "./AppLayout";

export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}