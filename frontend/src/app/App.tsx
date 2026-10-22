import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { STAFF_ROLES } from "@/lib/permissions";

import { GuestOnly, RequireAuth, RequireRole } from "./guards";

// Әр бет жеке chunk болып жүктеледі — бастапқы бандл кішірейеді.
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));
const ForgotPassword = lazy(() => import("@/features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/features/auth/pages/ResetPassword"));
const Home = lazy(() => import("@/features/home/pages/Home"));
const Profile = lazy(() => import("@/features/profile/pages/Profile"));
const Users = lazy(() => import("@/features/users/pages/Users"));
const Groups = lazy(() => import("@/features/groups/pages/Groups"));
const GroupDetail = lazy(() => import("@/features/groups/pages/GroupDetail"));
const Courses = lazy(() => import("@/features/courses/pages/Courses"));
const CourseDetail = lazy(() => import("@/features/courses/pages/CourseDetail"));
const AssignmentDetail = lazy(() => import("@/features/assignments/pages/AssignmentDetail"));
const Gradebook = lazy(() => import("@/features/gradebook/pages/Gradebook"));
const TestTake = lazy(() => import("@/features/tests/pages/TestTake"));
const TestEdit = lazy(() => import("@/features/tests/pages/TestEdit"));
const Schedule = lazy(() => import("@/features/schedule/pages/Schedule"));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path={ROUTES.login} element={<Login />} />
            <Route path={ROUTES.register} element={<Register />} />
            <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
            <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route element={<PageSuspense />}>
                <Route path={ROUTES.home} element={<Home />} />
                <Route path={ROUTES.profile} element={<Profile />} />
                <Route path={ROUTES.courses} element={<Courses />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/assignments/:id" element={<AssignmentDetail />} />
                <Route path="/tests/:id" element={<TestTake />} />
                <Route path={ROUTES.schedule} element={<Schedule />} />

                <Route element={<RequireRole roles={STAFF_ROLES} />}>
                  <Route path={ROUTES.groups} element={<Groups />} />
                  <Route path="/groups/:id" element={<GroupDetail />} />
                  <Route path="/courses/:id/gradebook" element={<Gradebook />} />
                  <Route path="/tests/:id/edit" element={<TestEdit />} />
                </Route>

                <Route element={<RequireRole roles={["admin"]} />}>
                  <Route path={ROUTES.users} element={<Users />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

/** Ішкі беттер жүктелгенше header орнында қалып, контент орнына қаңқа шығады. */
function PageSuspense() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Outlet />
    </Suspense>
  );
}
