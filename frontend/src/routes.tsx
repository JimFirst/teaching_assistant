import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, startTransition } from "react";
import { Loading, getUserFromStorage } from "@/layouts";
import { AppLayout } from "@/layouts/AppLayout";

const Home = lazy(() => import("@/pages/common/Home"));
const Users = lazy(() => import("@/pages/system/Users"));
const Classes = lazy(() => import("@/pages/system/Classes"));
const Students = lazy(() => import("@/pages/system/Students"));
const Homeworks = lazy(() => import("@/pages/homework/Homeworks"));
const HomeworkDetail = lazy(() => import("@/pages/homework/HomeworkDetail"));
const HomeworkSubmit = lazy(() => import("@/pages/homework/HomeworkSubmit"));
const Grades = lazy(() => import("@/pages/grade/Grades"));
const MyGrades = lazy(() => import("@/pages/grade/MyGrades"));

function SuspenseLoader({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getUserFromStorage();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <SuspenseLoader>{children}</SuspenseLoader>;
}

function AuthHome() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader><Home user={user} /></SuspenseLoader>;
}

function AuthHomeworks() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader><Homeworks user={user} /></SuspenseLoader>;
}

function AuthGrades() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader>
    {user.role === "student" ? (
      <MyGrades user={user} />
    ) : (
      <Grades user={user} />
    )}
  </SuspenseLoader>;
}

function AuthAppLayout() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader><AppLayout user={user} /></SuspenseLoader>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = getUserFromStorage();
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <SuspenseLoader>{children}</SuspenseLoader>;
}

function StudentOnly({ children }: { children: React.ReactNode }) {
  const user = getUserFromStorage();
  if (user?.role !== "student") {
    return <Navigate to="/" replace />;
  }
  return <SuspenseLoader>{children}</SuspenseLoader>;
}

function TeacherOrStudentOnly({ children }: { children: React.ReactNode }) {
  const user = getUserFromStorage();
  if (user?.role !== "student" && user?.role !== "teacher") {
    return <Navigate to="/" replace />;
  }
  return <SuspenseLoader>{children}</SuspenseLoader>;
}

function AuthDetail() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader><HomeworkDetail user={user} /></SuspenseLoader>;
}

function AuthSubmit() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader><HomeworkSubmit user={user} /></SuspenseLoader>;
}

function AuthMyGrades() {
  const user = getUserFromStorage();
  if (!user) return <Navigate to="/login" replace />;
  return <SuspenseLoader><MyGrades user={user} /></SuspenseLoader>;
}

function LoginPage() {
  const user = getUserFromStorage();
  if (user) {
    return <Navigate to="/" replace />;
  }
  const LoginPage = lazy(() => import("@/pages/common/Login"));
  return (
    <SuspenseLoader>
      <LoginPage onLogin={() => {}} />
    </SuspenseLoader>
  );
}

function Fallback() {
  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AuthAppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AuthHome />,
      },
      {
        path: "users",
        element: (
          <AdminOnly>
            <Users />
          </AdminOnly>
        ),
      },
      {
        path: "classes",
        element: (
          <AdminOnly>
            <Classes />
          </AdminOnly>
        ),
      },
      {
        path: "students",
        element: (
          <AdminOnly>
            <Students />
          </AdminOnly>
        ),
      },
      {
        path: "homeworks",
        element: <AuthHomeworks />,
      },
      {
        path: "homework/:id",
        element: <AuthDetail />,
      },
      {
        path: "homework/:id/submit",
        element: (
          <TeacherOrStudentOnly>
            <AuthSubmit />
          </TeacherOrStudentOnly>
        ),
      },
      {
        path: "grades",
        element: <AuthGrades />,
      },
      {
        path: "my-grades",
        element: (
          <StudentOnly>
            <AuthMyGrades />
          </StudentOnly>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Fallback />,
  },
]);
