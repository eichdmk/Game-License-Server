import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import UserCard from "./components/UserCard"; // 👈 импортируем компонент

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <UserCard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
