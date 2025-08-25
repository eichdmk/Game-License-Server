import api from "./api";

// 🔹 Авторизация
export const login = async (username, password) => {
  const { data } = await api.post("/login", { username, password });
  return data;
};

// 🔹 Получить всех пользователей
export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

// 🔹 Добавить нового пользователя
export const addUser = async (username, password, licenseDays) => {
  const { data } = await api.post("/add-user", { username, password, licenseDays });
  return data;
};

// 🔹 Удалить пользователя
export const deleteUser = async (id) => {
  const { data } = await api.delete(`/delete-user/${id}`);
  return data;
};

// 🔹 Обновить срок лицензии
export const updateLicense = async (id, licenseDays) => {
  const { data } = await api.put(`/update-license/${id}`, { licenseDays });
  return data;
};
