// UserForm.jsx
import React, { useState } from "react";
import { addUser } from "../../../api/api";
import "./UserForm.css";

const UserForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    licenseDays: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.firstName || !formData.lastName || 
        !formData.email || !formData.password || !formData.licenseDays) {
      setError("Заполните все обязательные поля");
      return;
    }
    
    const days = parseInt(formData.licenseDays);
    if (isNaN(days) || days <= 0) {
      setError("Количество дней должно быть положительным числом");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      await addUser({
        ...formData,
        licenseDays: days
      });
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        password: "",
        licenseDays: ""
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-form-container">
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-row">
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Фамилия *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Пароль *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Срок лицензии (дней) *</label>
            <input
              type="number"
              name="licenseDays"
              value={formData.licenseDays}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        {error && <div className="form-error">{error}</div>}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Добавление..." : "Добавить пользователя"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;