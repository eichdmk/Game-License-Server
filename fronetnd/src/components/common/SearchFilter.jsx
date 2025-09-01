// SearchFilter.jsx
import React from "react";
import { FaSearch } from "react-icons/fa";
import "./SearchFilter.css";

const SearchFilter = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  return (
    <div className="search-filter">
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Поиск по имени, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="status-filter">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Все пользователи</option>
          <option value="active">Активные</option>
          <option value="expiring">Скоро истекают</option>
          <option value="expired">Просроченные</option>
        </select>
      </div>
    </div>
  );
};

export default SearchFilter;