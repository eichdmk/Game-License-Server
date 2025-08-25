import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [licenseDays, setLicenseDays] = useState("");
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [editLicenseDays, setEditLicenseDays] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleStatus = useCallback((message, error = false) => {
    setStatus(message);
    setIsError(error);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setUsers([]);
    setShowUsers(false);
    navigate("/login");
  }, [navigate]);

  // Проверка авторизации
  const checkAuth = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error("Ошибка проверки авторизации:", err);
      localStorage.removeItem("token");
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Логин
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      if (!username || !password) return handleStatus("Заполните все поля", true);

      try {
        const data = await api.login(username, password);
        localStorage.setItem("token", data.token);

        const userResponse = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        setCurrentUser(userResponse.data);
        handleStatus(`Добро пожаловать, ${userResponse.data.username}!`);
      } catch (err) {
        handleStatus(err.response?.data?.error || "Ошибка подключения", true);
        localStorage.removeItem("token");
      }
    },
    [username, password, handleStatus]
  );

  // Загрузка пользователей
  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(response.data)) {
        setUsers(response.data);
        setShowUsers(true);
        handleStatus(`Загружено: ${response.data.length} игроков`);
      } else {
        handleStatus("Неверный формат данных", true);
      }
    } catch (err) {
      handleStatus("Не удалось загрузить игроков", true);
    }
  }, [token, handleStatus]);

  // Добавление игрока
  const handleAddUser = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newUsername || !newPassword || !licenseDays)
        return handleStatus("Заполните все поля", true);

      try {
        await api.post(
          "/add-user",
          {
            username: newUsername,
            password: newPassword,
            licenseDays: parseInt(licenseDays),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        handleStatus(`Игрок ${newUsername} добавлен!`);
        setNewUsername("");
        setNewPassword("");
        setLicenseDays("");
        loadUsers();
      } catch (err) {
        handleStatus(err.response?.data?.error || "Ошибка", true);
      }
    },
    [newUsername, newPassword, licenseDays, token, handleStatus, loadUsers]
  );

  // Удаление игрока
  const handleDeleteUser = useCallback(
    async (id) => {
      if (!window.confirm("Удалить игрока?")) return;
      try {
        await api.delete(`/delete-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        handleStatus("Игрок удалён");
        loadUsers();
      } catch (err) {
        handleStatus("Ошибка при удалении", true);
      }
    },
    [token, loadUsers, handleStatus]
  );

  // Обновление лицензии
  const handleUpdateLicense = useCallback(
    async (id) => {
      const days = parseInt(editLicenseDays[id]);
      // if (!days || days < 1) return handleStatus("Введите корректное количество дней", true);

      try {
        await api.put(
          `/update-license/${id}`,
          { licenseDays: days },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        handleStatus("Срок обновлён");
        setEditLicenseDays((prev) => ({ ...prev, [id]: "" }));
        loadUsers();
      } catch (err) {
        handleStatus("Ошибка обновления лицензии", true);
      }
    },
    [editLicenseDays, token, loadUsers, handleStatus]
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) return <div className="loading">Загрузка...</div>;

  // Если нет токена → форма входа
  if (!token || !currentUser) {
    return (
      <form onSubmit={handleLogin} className="login-form">
        <h2>🔐 Вход администратора</h2>
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Войти</button>
        {status && <div className={`status ${isError ? "error" : "success"}`}>{status}</div>}
      </form>
    );
  }

  // 🔹 Если пользователь НЕ админ → показываем его данные
  if (!currentUser.isAdmin) {
    const now = Date.now();
    const licenseEnd = Number(currentUser.licenseEndDate);

    // Проверяем, если timestamp в секундах → конвертируем
    const endDate = licenseEnd < 1e12 ? licenseEnd * 1000 : licenseEnd;

    // Вычисляем разницу
    const diffMs = endDate - now;
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    return (
      <div className="user-dashboard">
        <div className="user-card">
          <h2>👤 Личный кабинет</h2>
          <div className="user-info-box">
            <p><strong>Логин:</strong> {currentUser.username}</p>
            <p><strong>Дата окончания:</strong> {new Date(endDate).toLocaleString()}</p>
            <p className={diffMs > 0 ? "status-active" : "status-expired"}>
              <strong>Статус:</strong> {diffMs > 0 ? "✅ Активна" : "⛔ Истекла"}
            </p>
            <p><strong>Осталось:</strong> {diffDays} дней</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Выйти
          </button>
        </div>
      </div>
    );
  }



  // 🔹 Если админ → показываем панель управления
  return (
    <div className="admin-container">
      <div className="admin-panel">
        <div className="header">
          <h2>🎮 Панель управления</h2>
          <div className="user-info">
            <span>Администратор: {currentUser.username}</span>
            <button onClick={handleLogout} className="logout-btn">
              Выйти
            </button>
          </div>
        </div>

        <form onSubmit={handleAddUser} className="add-user-form">
          <input
            type="text"
            placeholder="Новый логин"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="number"
            placeholder="Срок лицензии (дней)"
            value={licenseDays}
            onChange={(e) => setLicenseDays(e.target.value)}
          />
          <button type="submit" className="add-btn">➕ Добавить игрока</button>
        </form>

        <button onClick={loadUsers} className="show-users-btn">
          📚 Показать всех игроков
        </button>

        {showUsers && (
          <div className="users-table">
            <h3>👥 Все игроки</h3>
            {users.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Логин</th>
                    <th>Лицензия</th>
                    <th>Админ</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const today = new Date();
                    const licenseEnd = user.licenseEndDate ? new Date(user.licenseEndDate) : null;
                    const diffDays = licenseEnd
                      ? Math.ceil((licenseEnd - today) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{diffDays > 0 ? `${diffDays} дней` : "⛔ Истекла"}</td>
                        <td>{user.isAdmin ? "✅" : "❌"}</td>
                        <td>
                          <button onClick={() => handleDeleteUser(user.id)} className="delete-btn">
                            🗑 Удалить
                          </button>
                          <input
                            type="number"
                            placeholder="Дни"
                            value={editLicenseDays[user.id] || ""}
                            onChange={(e) =>
                              setEditLicenseDays({
                                ...editLicenseDays,
                                [user.id]: e.target.value,
                              })
                            }
                            style={{ width: "70px", marginLeft: "10px" }}
                          />
                          <button
                            className="update-btn"
                            onClick={() => handleUpdateLicense(user.id)}
                          >
                            🔄 Обновить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>Нет игроков для отображения</p>
            )}
          </div>
        )}
      </div>
      {status && <div className={`status ${isError ? "error" : "success"}`}>{status}</div>}
    </div>
  );
};

export default AdminPanel;
