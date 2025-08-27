// AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const API_URL = "http://83.166.245.123:5000";

const AdminLogin = () => {
  const [email, setEmail] = useState(""); // ✅ Заменили username на email
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleStatus = (msg, error = false) => {
    setStatus(msg);
    setIsError(error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return handleStatus("Заполните все поля", true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // ✅ Отправляем email
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        handleStatus("Вход выполнен успешно!");
        navigate("/admin");
      } else {
        handleStatus(data.error || "Ошибка входа", true);
      }
    } catch (err) {
      console.error("Ошибка подключения:", err);
      handleStatus("Ошибка подключения к серверу", true);
    }
  };

  return (
    <div className="admin-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>🔐 Вход администратора</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit">Войти</button>
        {status && (
          <div className={`status ${isError ? "error" : "success"}`}>{status}</div>
        )}
      </form>
    </div>
  );
};

export default AdminLogin;  