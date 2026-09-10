import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import ForgotPassword from "./pages/ForgotPassword";
import AssignmentDetail from "./pages/AssignmentDetail";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import Gradebook from "./pages/Gradebook";
import GroupDetail from "./pages/GroupDetail";
import Groups from "./pages/Groups";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Schedule from "./pages/Schedule";
import TestEdit from "./pages/TestEdit";
import TestTake from "./pages/TestTake";
import Users from "./pages/Users";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={<Users />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/gradebook" element={<Gradebook />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />
        <Route path="/tests/:id" element={<TestTake />} />
        <Route path="/tests/:id/edit" element={<TestEdit />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
