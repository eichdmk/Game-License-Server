// src/components/admin/AIAssistantPage.jsx
import React, { useState, useEffect } from "react";
import { getLicenseStats } from "../../api/api";
import { FaChartLine, FaMapMarkerAlt } from "react-icons/fa";
import "./AIAssistantPage.css";

const AIAssistantPage = () => {
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
        <p>Загрузка данных ИИ-ассистента...</p>
      </div>
    );
  }

  const suggestions = [];
  
  // Сuggestion 1: экспирующие лицензии
  if (stats.expiringSoon > 0) {
    suggestions.push({
      id: 1,
      type: "warning",
      title: "Скоро истекают лицензии",
      description: `У ${stats.expiringSoon} пользователей лицензия истекает в течение 3 дней. Рекомендуется отправить напоминание.`,
      action: "Показать пользователей"
    });
  }
  
  // Suggestion 2: низкая активность
  const inactiveUsers = 0; // Здесь должны быть данные из логов
  if (inactiveUsers > 0) {
    suggestions.push({
      id: 2,
      type: "info",
      title: "Пользователи с низкой активностью",
      description: `Найдено ${inactiveUsers} пользователей с лицензией более 30 дней, но без активных входов.`,
      action: "Показать список"
    });
  }
  
  // Suggestion 3: новые пользователи
  if (stats.newUsersLastWeek > 5) {
    suggestions.push({
      id: 3,
      type: "success",
      title: "Рост новых пользователей",
      description: `За последнюю неделю зарегистрировано ${stats.newUsersLastWeek} новых пользователей — рост на ${Math.round((stats.newUsersLastWeek / (stats.total / 4)) * 100)}%`,
      action: "Посмотреть статистику"
    });
  }

  return (
    <div className="ai-assistant-page">
      <div className="page-header">
        <h1>🤖 ИИ-ассистент</h1>
        <p className="ai-description">
          Интеллектуальный помощник анализирует данные и предлагает оптимальные действия для улучшения системы
        </p>
      </div>

      {suggestions.length > 0 ? (
        <div className="ai-suggestions">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className={`suggestion-card ${suggestion.type}`}>
              <div className="suggestion-header">
                <h3>{suggestion.title}</h3>
                <span className="suggestion-type">
                  {suggestion.type === 'warning' ? 'Внимание' : 
                   suggestion.type === 'info' ? 'Информация' : 'Успех'}
                </span>
              </div>
              <p className="suggestion-description">{suggestion.description}</p>
              <div className="suggestion-actions">
                <button className="action-btn">{suggestion.action}</button>
                <button className="action-btn secondary">Отклонить</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>Нет рекомендаций</h3>
          <p>ИИ анализирует данные, чтобы предложить оптимальные действия</p>
        </div>
      )}

      <div className="ai-insights">
        <h2>Инсайты системы</h2>
        <div className="insight-card">
          <FaChartLine className="insight-icon" />
          <div>
            <h3>Прогноз оттока</h3>
            <p>По прогнозам, в ближайший месяц может отписаться до {Math.round(stats?.expiringSoon / 3)} пользователей. Рекомендуется запустить кампанию удержания.</p>
          </div>
        </div>
        <div className="insight-card">
          <FaMapMarkerAlt className="insight-icon" />
          <div>
            <h3>География пользователей</h3>
            <p>Больше всего пользователей из Москвы (32%), Санкт-Петербурга (18%) и Алматы (12%). Рассмотрите локализацию для регионов.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;