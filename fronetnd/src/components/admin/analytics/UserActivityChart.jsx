import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
// import "./UserActivityChart.css";

const UserActivityChart = ({ stats }) => {
  if (!stats) return null;

  if (!stats.userActivity || stats.userActivity.length === 0) {
    return <p>Нет данных для отображения активности пользователей 📉</p>;
  }

  return (
    <div className="chart-card">
      <h3>📈 Активность пользователей</h3>
      <LineChart
        width={500}
        height={300}
        data={stats.userActivity}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};

export default UserActivityChart;
