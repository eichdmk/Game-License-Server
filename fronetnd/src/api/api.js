// api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://83.166.245.123:5000",
});

// Добавляем токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Экспортируем готовые методы
export const login = async (username, password) => {
  const { data } = await api.post("/login", { username, password });
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const addUser = async (username, password, licenseDays) => {
  const { data } = await api.post("/add-user", { username, password, licenseDays });
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/delete-user/${id}`);
  return data;
};

export const updateLicense = async (id, licenseDays) => {
  const { data } = await api.put(`/update-license/${id}`, { licenseDays });
  return data;
};

export default api;