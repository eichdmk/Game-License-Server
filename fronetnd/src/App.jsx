// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Правильные пути
import AdminLogin from "./components/auth/AdminLogin";
import Admin from "./pages/Admin";   
import ProtectedRoute from "./components/ProtectedRoute";
import UserCard from "./components/UserCard";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Страница логина */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Админка */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Страница пользователя */}
        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <UserCard />
            </ProtectedRoute>
          }
        />

        {/* Редирект на /login если маршрут не найден */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
