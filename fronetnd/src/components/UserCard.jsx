// UserCard.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import './UserCard.css'

const UserCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`admin/users/${id}`);
        setUser(response.data);
      } catch (err) {
        console.error("Ошибка загрузки пользователя:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div className="user-card-page">
      <button onClick={() => navigate(-1)} className="back-btn">⬅ Назад</button>
      <h2>Карточка игрока</h2>
      <div className="user-info">
        <p><strong>Имя:</strong> {user.firstName}</p>
        <p><strong>Фамилия:</strong> {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Телефон:</strong> {user.phone || "—"}</p>
        <p><strong>Лицензия до:</strong> {new Date(user.licenseEndDate).toLocaleString()}</p>
        <p><strong>Админ:</strong> {user.isAdmin ? "Да" : "Нет"}</p>
      </div>

      <h3>Логи входов</h3>
      {user.logs && user.logs.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>IP</th>
              <th>Устройство</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {user.logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt}</td>
                <td>{log.ip}</td>
                <td>{log.userAgent?.substring(0, 30)}...</td>
                <td>{log.success ? "Успешно" : "Ошибка"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Нет логов входа</p>
      )}
    </div>
  );
};

export default UserCard;