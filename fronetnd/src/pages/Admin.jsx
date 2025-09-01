// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import AdminLayout from "../components/admin/layout/AdminLayout";

import UsersPage from "../components/admin/users/UsersPage";
import AnalyticsPage from "../components/admin/analytics/AnalyticsPage";
import AIAssistantPage from "../components/admin/AIAssistantPage";
import LogsPage from "../components/admin/LogsPage";
import IPManagementPage from "../components/admin/IPManagementPage";

import UserCard from "../components/UserCard";

import  {getToken}  from "../api/api";

import "./Admin.css";

const Admin = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(user);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <AdminLayout 
      currentUser={currentUser} 
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/admin/users" replace />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/ai" element={<AIAssistantPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/ip" element={<IPManagementPage />} />
        <Route path="/user/:id" element={<UserCard />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;