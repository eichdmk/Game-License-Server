import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
// import "./LicenseDistributionChart.css";

const COLORS = ["#00C49F", "#FF8042", "#FFBB28"];

const LicenseDistributionChart = ({ stats }) => {
  if (!stats) return null;

  // Используем твои реальные поля
  const data = [
    { name: "Активные", value: stats.active || 0 },
    { name: "Истекшие", value: stats.expired || 0 },
    { name: "Всего", value: stats.total || 0 },
  ];

  return (
    <div className="chart-card">
      <h3>📊 Распределение лицензий</h3>
      <PieChart width={350} height={300}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default LicenseDistributionChart;
