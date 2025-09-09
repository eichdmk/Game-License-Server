// src/components/admin/LogsPage.jsx
import React, { useState, useEffect } from "react";
import { getLoginLogs } from "../../api/api";
import StatusBadge from "../common/StatusBadge";
import "./LogsPage.css";

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    const num = parseInt(timestamp, 10);
    if (isNaN(num)) return "—";
    const date = new Date(num);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getLoginLogs();

      const formattedData = data.map(log => ({
        ...log,
        createdAt: formatTimestamp(log.createdat || log.createdAt), // приоритет — createdat
        firstName: log.firstname || log.firstName || "—",
        lastName: log.lastname || log.lastName || "—",
        userAgent: log.useragent || log.userAgent || "—"
      }));

      setLogs(formattedData);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-page">
      <div className="page-header">
        <h1>🔐 Логи входов</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={loadLogs}>
            Обновить логи
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка логов...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <h3>Нет логов</h3>
          <p>Логи входов появятся после первых попыток авторизации</p>
        </div>
      ) : (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Пользователь</th>
                <th>Email</th>
                <th>IP</th>
                <th>Устройство</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className={log.success ? "log_success" : "log_error"}>
                  <td>{log.createdAt}</td>
                  <td>{log.firstname} {log.lastname}</td>
                  <td>{log.email}</td>
                  <td>{log.ip}</td>
                  <td>{log.userAgent?.substring(0, 30)}...</td>
                  <td>
                    <StatusBadge status={log.success ? "log_success" : "log_error"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
