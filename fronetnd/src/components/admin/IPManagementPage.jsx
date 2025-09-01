// src/components/admin/IPManagementPage.jsx
import React, { useState, useEffect } from "react";
import { getBlockedIPs, blockIP, unblockIP } from "../../api/api";
import "./IPManagementPage.css";

const IPManagementPage = () => {
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newIP, setNewIP] = useState("");
  const [ipReason, setIPReason] = useState("");
  const [ipDays, setIPDays] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedIPs();
  }, []);

  const loadBlockedIPs = async () => {
    setLoading(true);
    try {
      const data = await getBlockedIPs();
      setBlockedIPs(data);
    } catch (error) {
      console.error("Error loading blocked IPs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP) {
      alert("Введите IP-адрес");
      return;
    }

    try {
      await blockIP(newIP, ipReason, ipDays || null);
      setNewIP("");
      setIPReason("");
      setIPDays("");
      loadBlockedIPs();
    } catch (error) {
      console.error("Error blocking IP:", error);
    }
  };

  const handleUnblockIP = async (ip) => {
    if (!window.confirm(`Разблокировать IP ${ip}?`)) return;
    
    try {
      await unblockIP(ip);
      loadBlockedIPs();
    } catch (error) {
      console.error("Error unblocking IP:", error);
    }
  };

  return (
    <div className="ip-management-page">
      <div className="page-header">
        <h1>🛡 Управление IP-блокировками</h1>
      </div>

      <div className="ip-block-form">
        <input
          type="text"
          placeholder="IP-адрес для блокировки"
          value={newIP}
          onChange={(e) => setNewIP(e.target.value)}
        />
        <input
          type="text"
          placeholder="Причина блокировки"
          value={ipReason}
          onChange={(e) => setIPReason(e.target.value)}
        />
        <input
          type="number"
          placeholder="Дней (0 = навсегда)"
          value={ipDays}
          onChange={(e) => setIPDays(e.target.value)}
        />
        <button onClick={handleBlockIP} className="btn btn-primary">
          Заблокировать IP
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка заблокированных IP...</p>
        </div>
      ) : blockedIPs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h3>Нет заблокированных IP</h3>
          <p>Здесь будут отображаться заблокированные IP-адреса</p>
        </div>
      ) : (
        <div className="ip-table-container">
          <table className="ip-table">
            <thead>
              <tr>
                <th>IP-адрес</th>
                <th>Причина</th>
                <th>Дата блокировки</th>
                <th>Срок</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {blockedIPs.map((ip) => (
                <tr key={ip.id}>
                  <td>{ip.ip}</td>
                  <td>{ip.reason}</td>
                  <td>{new Date(ip.blockedAt).toLocaleString()}</td>
                  <td>
                    {ip.expiresAt 
                      ? new Date(ip.expiresAt).toLocaleString() 
                      : "Навсегда"}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleUnblockIP(ip.ip)} 
                      className="btn btn-danger"
                    >
                      Разблокировать
                    </button>
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

export default IPManagementPage;