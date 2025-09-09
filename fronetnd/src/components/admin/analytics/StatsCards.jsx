// src/components/admin/StatsCards.jsx
import React from "react";
import "./StatsCards.css";

const StatsCards = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    { title: "Всего лицензий", value: Number(stats.total) || 0, icon: "📦", color: "#6c757d" },
    { title: "Активные лицензии", value: Number(stats.active) || 0, icon: "✅", color: "#28a745" },
    { title: "Истекшие лицензии", value: Number(stats.expired) || 0, icon: "⛔", color: "#dc3545" },
    { title: "Скоро истекут (≤3 дн.)", value: Number(stats.expiringSoon) || 0, icon: "⚠️", color: "#ffc107" },
    { title: "Новые за неделю", value: Number(stats.newUsersLastWeek) || 0, icon: "🆕", color: "#17a2b8" },
    { title: "Средний срок (дни)", value: Number(stats.avgLicenseDays).toFixed(1) || "0.0", icon: "📅", color: "#fd7e14" },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, i) => (
        <div key={i} className="stats-card" style={{ borderColor: card.color }}>
          <span className="stats-icon" style={{ color: card.color }}>{card.icon}</span>
          <div className="stats-info">
            <h3>{card.value}</h3>
            <p>{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;