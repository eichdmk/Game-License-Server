// AdminLayout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { FaBars } from "react-icons/fa";
import "./AdminLayout.css";

const AdminLayout = ({ children, currentUser, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <button 
        className="mobile-menu-button" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars />
      </button>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;