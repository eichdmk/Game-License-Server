import React from "react";
// import "./StatsCards.css";

const StatsCards = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    { title: "Всего лицензий", value: stats.total || 0, icon: "📦" },
    { title: "Активные лицензии", value: stats.active || 0, icon: "✅" },
    { title: "Истекшие лицензии", value: stats.expired || 0, icon: "⛔" },
    { title: "Пользователи", value: stats.totalUsers || 0, icon: "👥" },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, i) => (
        <div key={i} className="stats-card">
          <span className="stats-icon">{card.icon}</span>
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
