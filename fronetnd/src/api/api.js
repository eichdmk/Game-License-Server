// api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false // если будешь использовать cookies — включи
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Экспортируем методы
export const login = async (email, password) => {
  const { data } = await api.post("/login", { email, password });
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const addUser = async (userData) => {
  const { data } = await api.post("/add-user", userData);
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