import React from "react";
import { Routes, Route, Navigate } from "react-router";

import AdminLayout from "../components/layouts/AdminLayout";
import PublicLayout from "../components/layouts/PublicLayout";

import Login from "../pages/Login";
import Register from "../pages/register";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLeads from "../pages/admin/AdminLeads";
import AdminFollowup from "../pages/admin/AdminFollowup";

import About from "../pages/About";
import Contact from "../pages/Contact";
import Services from "../pages/Servies";
import Home from "../pages/Home";
import EmployeeLayout from "../components/layouts/EmployeeLayout";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import MyProfile from "../pages/employee/MyProfile";
import HelpSupport from "../pages/employee/HelpSupport";
import Settings from "../pages/employee/Settings";
import RoleManagement from "../pages/admin/RoleManagement";
import AdminSettings from "../pages/admin/AdminSettings";
import ForgotPassword from "../pages/ForgotPassword";

function AllRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword/>} />

      {/* Admin pages */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="settings" element={<AdminSettings/>}/>

        <Route path="adminleads" element={<AdminLeads />} />

        <Route path="follow-ups" element={<AdminFollowup />} />

        <Route path="role-management" element={<RoleManagement/>}/>
        
      </Route>

      <Route path="/employee" element={<EmployeeLayout/>}>
      <Route index element={<Navigate to="/employee/dashboard" replace/>}/>
      <Route path="dashboard" element={<EmployeeDashboard/>}/>
      <Route path="profile" element={<MyProfile/>}/>
      <Route path="help-support" element={<HelpSupport/>}/>
      <Route path="settings" element={<Settings/>}/>

      
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AllRoutes;
