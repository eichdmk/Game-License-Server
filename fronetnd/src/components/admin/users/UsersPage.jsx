// UsersPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserForm from "./UserForm";
import UserTable from "./UserTable";
import SearchFilter from "../../common/SearchFilter";
import { getUsers, deleteUser, updateLicense, exportUsers } from "../../../api/api";
import "./UsersPage.css";


const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkLicenseDays, setBulkLicenseDays] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, filterStatus, users]);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
    setFilteredUsers(data);
  };

  const handleSearch = () => {
    let filtered = [...users];

    // Поиск
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    }

    // Фильтр по статусу
    if (filterStatus !== "all") {
      const now = Date.now();
      filtered = filtered.filter(user => {
        const endDate = Number(user.licenseEndDate);
        if (filterStatus === "active") return endDate > now;
        if (filterStatus === "expiring") return endDate > now && (endDate - now) <= 3 * 86400000;
        if (filterStatus === "expired") return endDate <= now;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Удалить игрока?")) return;
    await deleteUser(id);
    loadUsers();
  };

  const handleUpdateLicense = async (id, days) => {
    await updateLicense(id, days);
    loadUsers();
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkLicenseDays || selectedUsers.length === 0) {
      alert("Введите дни и выберите пользователей");
      return;
    }

    const days = parseInt(bulkLicenseDays);
    if (isNaN(days) || days < 0) {
      alert("Введите корректное количество дней");
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await updateLicense(userId, days);
      }
      alert(`Лицензии обновлены для ${selectedUsers.length} пользователей`);
      setSelectedUsers([]);
      setBulkLicenseDays("");
      loadUsers();
    } catch (error) {
      console.error("Ошибка массового обновления:", error);
      alert("Ошибка массового обновления");
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>👥 Пользователи</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Скрыть форму" : "Добавить пользователя"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => exportUsers("csv")}
            style={{ marginLeft: "10px" }}
          >
            📥 Экспорт CSV
          </button>
        </div>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {showForm && (
        <UserForm
          onSuccess={loadUsers}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <div className="selection-info">
            Выбрано: {selectedUsers.length} пользователей
          </div>
          <div className="bulk-input">
            <input
              type="number"
              placeholder="Дни"
              value={bulkLicenseDays}
              onChange={(e) => setBulkLicenseDays(e.target.value)}
            />
            <button
              onClick={handleBulkUpdate}
              className="btn btn-primary"
            >
              Применить ко всем
            </button>
          </div>
        </div>
      )}

      <UserTable
        users={filteredUsers}
        onDelete={handleDeleteUser}
        onUpdateLicense={handleUpdateLicense}
        selectedUsers={selectedUsers}
        onSelectUser={handleUserSelect}
        onSelectAll={handleSelectAll}
        onViewDetails={(id) => navigate(`/user/${id}`)}
      />
    </div>
  );
};

export default UsersPage;