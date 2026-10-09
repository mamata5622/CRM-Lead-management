import React from "react";
import { Routes, Route, Navigate } from "react-router";
import AdminLayout from "../components/layouts/AdminLayout";
import Login from "../pages/Login";
import Register from "../pages/register";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLeads from "../pages/admin/AdminLeads";
import AdminFollowup from "../pages/admin/AdminFollowup";

function AllRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="adminleads" element={<AdminLeads />} />

        {/* Add these pages when their components are ready */}
        <Route path="follow-ups" element={<AdminFollowup/>}/>
        {/* <Route path="pipeline" element={<Pipeline />} /> */}
        {/* <Route path="call-logs" element={<CallLogs />} /> */}
        {/* <Route path="settings" element={<Settings />} /> */}
      </Route>

      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AllRoutes;