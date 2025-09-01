// src/api/apis.js
import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false
});

// Глобальная обработка ошибок
api.interceptors.response.use(
  response => response,
  error => {
    // Обработка ошибок авторизации
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(new Error("Сессия истекла. Пожалуйста, войдите снова."));
    }

    // Обработка ошибок сервера
    if (error.response?.status >= 500) {
      toast.error("Ошибка сервера. Попробуйте позже.");
    }

    // Обработка пользовательских ошибок
    const errorMessage = error.response?.data?.error ||
      error.response?.data?.message ||
      "Произошла ошибка при выполнении запроса";

    return Promise.reject(new Error(errorMessage));
  }
);

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Вспомогательная функция для обработки ошибок
const handleApiError = (error, defaultMessage) => {
  const message = error.message || defaultMessage;
  toast.error(message);
  console.error("API Error:", error);
  throw new Error(message);
};

// Экспортируем методы
export const login = async (email, password) => {
  try {
    const { data } = await api.post("/login", { email, password });
    return data;
  } catch (error) {
    handleApiError(error, "Ошибка при входе. Проверьте логин и пароль.");
  }
};

export const getUsers = async () => {
  try {
    const { data } = await api.get("/users");
    return data;
  } catch (error) {
    handleApiError(error, "Не удалось загрузить пользователей");
  }
};

export const addUser = async (userData) => {
  try {
    const { data } = await api.post("/add-user", userData);
    toast.success(`Пользователь ${userData.firstName} добавлен`);
    return data;
  } catch (error) {
    handleApiError(error, "Ошибка при добавлении пользователя");
  }
};

export const deleteUser = async (id) => {
  try {
    const { data } = await api.delete(`/delete-user/${id}`);
    toast.success("Пользователь удалён");
    return data;
  } catch (error) {
    handleApiError(error, "Ошибка при удалении пользователя");
  }
};

export const updateLicense = async (id, licenseDays) => {
  try {
    const { data } = await api.put(`/update-license/${id}`, { licenseDays });
    toast.success("Срок лицензии обновлён");
    return data;
  } catch (error) {
    handleApiError(error, "Ошибка обновления лицензии");
  }
};

export const getLicenseStats = async () => {
  try {
    const { data } = await api.get("/license-stats");
    return data;
  } catch (error) {
    handleApiError(error, "Не удалось загрузить статистику");
  }
};

export const exportUsers = async (format = "csv") => {
  try {
    const response = await api.get(`/export-users?format=${format}`, {
      responseType: "blob"
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `users_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    toast.success(`Данные экспортированы в формате ${format.toUpperCase()}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Ошибка экспорта данных");
  }
};

// Новые методы для управления IP
export const getBlockedIPs = async () => {
  try {
    const { data } = await api.get("/admin/blocked-ips");
    return data;
  } catch (error) {
    handleApiError(error, "Не удалось загрузить заблокированные IP");
  }
};

export const blockIP = async (ip, reason, days) => {
  try {
    const { data } = await api.post("/admin/block-ip", { ip, reason, days });
    toast.success(`IP ${ip} заблокирован`);
    return data;
  } catch (error) {
    handleApiError(error, "Ошибка блокировки IP");
  }
};

export const unblockIP = async (ip) => {
  try {
    const { data } = await api.delete(`/admin/unblock-ip/${encodeURIComponent(ip)}`);
    toast.success(`IP ${ip} разблокирован`);
    return data;
  } catch (error) {
    handleApiError(error, "Ошибка разблокировки IP");
  }
};
export const getToken = () => {
  return localStorage.getItem("token");
};

export const getLoginLogs = async () => {
  try {
    const { data } = await api.get("/login-logs");
    return data;
  } catch (error) {
    handleApiError(error, "Не удалось загрузить логи входов");
  }
};

export const getUserById = async (id) => {
  try {
    const { data } = await api.get(`/users/${id}`);
    return data;
  } catch (error) {
    handleApiError(error, "Не удалось загрузить данные пользователя");
  }
};

export default api;