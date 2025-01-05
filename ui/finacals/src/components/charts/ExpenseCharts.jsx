import React from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement
  } from "chart.js";
// Register the necessary components
ChartJS.register(
    CategoryScale,    // For category axis
    LinearScale,      // For linear axis
    BarElement,       // For bar charts
    Title,            // For chart titles
    Tooltip,          // For tooltips
    Legend,           // For chart legends
    ArcElement,       // For pie charts
    LineElement,       // For line charts,
    PointElement
);

const ExpenseCharts = ({ data }) => {
  const barData = {
    labels: data.labels,
    datasets: [
      {
        label: "Expenses",
        data: data.barValues,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: data.labels,
    datasets: [
      {
        data: data.pieValues,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
      },
    ],
  };

  const lineData = {
    labels: data.labels,
    datasets: [
      {
        label: "Expense Trend",
        data: data.lineValues,
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div>
      <h2>Bar Chart</h2>
      <Bar data={barData} />
      <h2>Pie Chart</h2>
      <Pie data={pieData} />
      <h2>Line Chart</h2>
      <Line data={lineData} />
    </div>
  );
};

export default ExpenseCharts;
