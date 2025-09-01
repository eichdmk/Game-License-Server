// UserTable.jsx
import React from "react";
import StatusBadge from "../../common/StatusBadge";
import "./UserTable.css";

const UserTable = ({
  users,
  onDelete,
  onUpdateLicense,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onViewDetails
}) => {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
        </div>
        <h3>Нет пользователей</h3>
        <p>Попробуйте изменить параметры поиска или добавить нового пользователя</p>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedUsers.length === users.length}
                onChange={onSelectAll}
              />
            </th>
            <th>ID</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Телефон</th>
            <th>Email</th>
            <th>Лицензия</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const today = new Date();
            const licenseEnd = user.licenseEndDate ? new Date(user.licenseEndDate) : null;
            const diffDays = licenseEnd
              ? Math.ceil((licenseEnd - today) / 86400000)
              : 0;
            const isExpiring = diffDays > 0 && diffDays <= 3;
            const isExpired = diffDays <= 0;

            return (
              <tr key={user.id} className={isExpiring ? "expiring" : isExpired ? "expired" : ""}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                  />
                </td>
                <td>{user.id}</td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.phone || "-"}</td>
                <td>{user.email}</td>
                <td>
                  {diffDays > 0 ? `${diffDays} дней` : "⛔ Истекла"}
                </td>
                <td>
                  <StatusBadge status={isExpired ? "expired" : isExpiring ? "expiring" : "active"} />
                </td>
                <td className="actions">
                  <button 
                    onClick={() => onDelete(user.id)} 
                    className="btn btn-danger"
                    title="Удалить"
                  >
                    🗑
                  </button>
                  <div className="license-input">
                    <input
                      type="number"
                      placeholder="Дни"
                      onBlur={(e) => {
                        if (e.target.value) {
                          onUpdateLicense(user.id, parseInt(e.target.value));
                          e.target.value = ""; // очищаем поле
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input && input.value) {
                          onUpdateLicense(user.id, parseInt(input.value));
                          input.value = "";
                        }
                      }}
                      className="btn btn-primary"
                      title="Обновить"
                    >
                      🔄
                    </button>
                  </div>
                  <button
                    onClick={() => onViewDetails(user.id)}
                    className="btn btn-secondary"
                    title="Просмотр"
                  >
                    📋
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
