// AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [email, setEmail] = useState(""); // ✅ email вместо username
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
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
  const [loginLogs, setLoginLogs] = useState([]);


  const token = localStorage.getItem("token");

  const handleStatus = useCallback((message, error = false) => {
    setStatus(message);
    setIsError(error);
  }, []);


  const loadLoginLogs = async () => {
    try {
      const response = await api.get('/login-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoginLogs(response.data);
    } catch (err) {
      handleStatus('Не удалось загрузить логи', true);
    }
  };

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
      if (!email || !password) return handleStatus("Заполните все поля", true);

      try {
        const data = await api.post("/login", { email, password });
        localStorage.setItem("token", data.data.token);

        const userResponse = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${data.data.token}` },
        });
        setCurrentUser(userResponse.data);
        handleStatus(`Добро пожаловать, ${userResponse.data.firstName}!`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || "Ошибка подключения";
        handleStatus(errorMsg, true);
        localStorage.removeItem("token");
      }
    },
    [email, password, handleStatus]
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
      if (!firstName || !lastName || !email || !newPassword || !licenseDays)
        return handleStatus("Заполните все поля", true);

      const days = parseInt(licenseDays);
      if (isNaN(days) || days <= 0) return handleStatus("Количество дней должно быть числом", true);

      try {
        await api.post(
          "/add-user",
          {
            firstName,
            lastName,
            phone,
            email,
            password: newPassword,
            licenseDays: days,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        handleStatus(`Игрок ${firstName} добавлен!`);
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setNewPassword("");
        setLicenseDays("");
        loadUsers();
      } catch (err) {
        handleStatus(err.response?.data?.error || "Ошибка при добавлении", true);
      }
    },
    [firstName, lastName, phone, email, newPassword, licenseDays, token, handleStatus, loadUsers]
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
      if (isNaN(days) || days <= 0) return handleStatus("Введите корректное количество дней", true);

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

  if (!token || !currentUser) {
    return (
      <form onSubmit={handleLogin} className="login-form">
        <h2>🔐 Вход администратора</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
    const endDate = Number(currentUser.licenseEndDate);
    const diffMs = endDate - now;
    const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

    return (
      <div className="user-dashboard">
        <div className="user-card">
          <h2>👤 Личный кабинет</h2>
          <div className="user-info-box">
            <p><strong>Имя:</strong> {currentUser.firstName}</p>
            <p><strong>Фамилия:</strong> {currentUser.lastName}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Телефон:</strong> {currentUser.phone || "не указан"}</p>
            <p><strong>Дата окончания:</strong> {new Date(endDate).toLocaleString()}</p>
            <p className={diffMs > 0 ? "status-active" : "status-expired"}>
              <strong>Статус:</strong> {diffMs > 0 ? "✅ Активна" : "⛔ Истекла"}
            </p>
            <p><strong>Осталось:</strong> {diffDays} дней</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">🚪 Выйти</button>
        </div>
      </div>
    );
  }

// 🔹 Если админ → панель управления
return (
  <div className="admin-container">
    <div className="admin-panel">
      <div className="header">
        <h2>🎮 Панель управления</h2>
        <div className="user-info">
          <span>Администратор: {currentUser.firstName}</span>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </div>

      <form onSubmit={handleAddUser} className="add-user-form">
        <input
          type="text"
          placeholder="Имя"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Фамилия"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="tel"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      {/* Кнопки для загрузки данных */}
      <button onClick={loadUsers} className="show-users-btn">
        👥 Показать всех пользователей
      </button>

      {/* ✅ Кнопка для логов — ВНЕ блока с отображением */}
      <button onClick={loadLoginLogs} className="show-users-btn">
        🕵️ Показать логи входов
      </button>

      {/* Таблица пользователей */}
      {showUsers && (
        <div className="users-table">
          <h3>👥 Все игроки</h3>
          {users.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Телефон</th>
                  <th>Email</th>
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
                    ? Math.ceil((licenseEnd - today) / 86400000)
                    : 0;

                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.phone}</td>
                      <td>{user.email}</td>
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

      {/* Таблица логов — отдельно */}
      {loginLogs.length > 0 && (
        <div className="users-table">
          <h3>🔐 Логи входов</h3>
          <table>
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
              {loginLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt}</td>
                  <td>{log.firstName} {log.lastName}</td>
                  <td>{log.email}</td>
                  <td>{log.ip}</td>
                  <td>{log.userAgent?.substring(0, 30)}...</td>
                  <td>{log.success ? "✅ Успешно" : "❌ Ошибка"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {status && <div className={`status ${isError ? "error" : "success"}`}>{status}</div>}
  </div>
)}
export default AdminPanel;