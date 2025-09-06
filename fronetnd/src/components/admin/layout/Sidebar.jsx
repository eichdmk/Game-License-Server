// Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaChartLine, FaRobot, FaSearch, FaShieldAlt, FaSignOutAlt, FaUsers } from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose, currentUser, onLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="nav_user-profile">

          <div className="user-info">
            <div className="avatar">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </div>
            <h3>{currentUser.firstName} {currentUser.lastName}</h3>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <div >
              Панель управления
            </div>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              onClick={() => handleNavigation("/admin/users")}
            >
              <FaUsers /> Пользователи
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/analytics"
              onClick={() => handleNavigation("/admin/analytics")}
            >
              <FaChartLine /> Аналитика
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/ai"
              onClick={() => handleNavigation("/admin/ai")}
            >
              <FaRobot /> ИИ-ассистент
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/logs"
              onClick={() => handleNavigation("/admin/logs")}
            >
              <FaSearch /> Логи
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/ip"
              onClick={() => handleNavigation("/admin/ip")}
            >
              <FaShieldAlt /> IP-блокировки
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-button">
          <FaSignOutAlt /> Выйти
        </button>
      </div>
    </div>
  );
};

export default Sidebar;