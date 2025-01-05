import React, { useEffect, useState } from "react";
import ExpenseCharts from "./charts/ExpenseCharts";

const Dashboard = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/chart-data")
      .then((response) => response.json())
      .then((data) => setChartData(data))
      .catch((error) => console.error("Error fetching chart data:", error));
  }, []);

  return (
    <div>
      <h1>Expense Dashboard</h1>
      {chartData ? (
        chartData.labels && chartData.barValues && chartData.pieValues && chartData.lineValues ? (
          <ExpenseCharts data={chartData} />
        ) : (
          <p>Data is incomplete or malformed.</p>
        )
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
