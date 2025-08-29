// AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/api";
import "./AdminPanel.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleStatus = (msg, error = false) => {
    setStatus(msg);
    setIsError(error);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return handleStatus("Заполните все поля", true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      handleStatus("Вход выполнен успешно!");
      navigate("/admin");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Ошибка подключения";
      handleStatus(errorMsg, true);
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
        {status && <div className={`status ${isError ? "error" : "success"}`}>{status}</div>}
      </form>
    </div>
  );
};

export default AdminLogin;