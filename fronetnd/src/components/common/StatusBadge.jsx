// StatusBadge.jsx
import React from "react";
import "./StatusBadge.css";

const StatusBadge = ({ status }) => {
  let badgeClass = "status-badge";
  let badgeText = "";
  
  switch (status) {
    case "active":
      badgeClass += " status-badge-active";
      badgeText = "Активна";
      break;
    case "expiring":
      badgeClass += " status-badge-expiring";
      badgeText = "Скоро истекает";
      break;
    case "expired":
      badgeClass += " status-badge-expired";
      badgeText = "Просрочена";
      break;
    default:
      badgeClass += " status-badge-default";
      badgeText = "Неизвестно";
  }
  
  return (
    <span className={badgeClass}>
      {badgeText}
    </span>
  );
};

export default StatusBadge;