// AnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import StatsCards from "./StatsCards";
import LicenseDistributionChart from "./LicenseDistributionChart";
import UserActivityChart from "./UserActivityChart";
import { getLicenseStats } from "../../../api/api";
import "./AnalyticsPage.css";

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getLicenseStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>📊 Аналитика лицензий</h1>
      </div>

      {stats && (
        <>
          <StatsCards stats={stats} />
          
          <div className="charts-grid">
            <LicenseDistributionChart stats={stats} />
            <UserActivityChart stats={stats} />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;