import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import '../charts/charts.css';
import {generateRandomColor} from './ColorHelper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const ExpenseCharts = () => {
  const [chartType, setChartType] = useState('pie');
  const [chartData, setChartData] = useState({
    barData: {
      labels: [],
      datasets: [{
        label: 'Expense Amounts',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      }],
    },
    pieData: {
      labels: [],
      datasets: [{
        label: 'Expense Distribution',
        data: [],
        backgroundColor: [],
        borderWidth: 1,
      }],
    },
    lineData: {
      labels: [],
      datasets: [{
        label: 'Expense Trends',
        data: [],
        fill: false,
        borderColor: [],
        tension: 0.1,
      }],
    },
  });

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  useEffect(() => {
    // Fetch data from API
    fetch('http://localhost:8000/chart-data')  // Replace with your actual endpoint
      .then(response => response.json())
      .then(data => {
        const expenseData = data.data;  // Extract the data field from the API response
        const categories = Object.keys(expenseData);

        // Initialize chart datasets
        const barData = {
          labels: [],
          datasets: [{
            label: 'Expense Amounts',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1,
          }],
        };

        const pieData = {
          labels: [],
          datasets: [{
            label: 'Expense Distribution',
            data: [],
            backgroundColor: [], // You can add more colors as needed
            borderWidth: 1,
          }],
        };

        const lineData = {
          labels: [],
          datasets: [{
            label: 'Expense Trends',
            data: [],
            fill: false,
            borderColor: [],
            tension: 0.1,
          }],
        };

        // Process each category to populate chart data
        categories.forEach(category => {
          const categoryData = expenseData[category];

          Object.keys(categoryData).forEach(expenseType => {
            const expenseItems = categoryData[expenseType];
            let totalAmount = 0;

            // Sum the amounts for each expense type
            const sumAmount = expenseItems.reduce((sum, expense) => sum + expense.amount, 0);

            // Assign random colors for each expense type
            const randomColor = generateRandomColor();

            // Update the bar chart data
            barData.labels.push(`${expenseType} - ${category}`);
            barData.datasets[0].data.push(sumAmount);
            barData.datasets[0].backgroundColor.push(randomColor);
            barData.datasets[0].borderColor.push(randomColor);

            // Update the pie chart data
            pieData.labels.push(`${expenseType} - ${category}`);
            pieData.datasets[0].data.push(sumAmount);
            pieData.datasets[0].backgroundColor.push(randomColor);

            // Update the line chart data
            lineData.labels.push(`${expenseType} - ${category}`);
            lineData.datasets[0].data.push(sumAmount);
            lineData.datasets[0].borderColor.push(randomColor);
          });
        });

        // Ensure the datasets and labels are set correctly, prevent undefined
        setChartData({
          barData: barData || { labels: [], datasets: [] },
          pieData: pieData || { labels: [], datasets: [] },
          lineData: lineData || { labels: [], datasets: [] },
        });
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Add a check to render charts only when the data is available
  if (!chartData.barData || !chartData.pieData || !chartData.lineData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Expense Charts</h1>
      <select onChange={handleChartTypeChange} value={chartType}>
        <option value="pie">Pie Chart</option>
        <option value="bar">Bar Chart</option>
        <option value="line">Line Chart</option>
      </select>

      {chartType === 'pie' && 
      <div className="chart-container">
      <div className="pie">
        <Pie data={chartData.pieData} options={{ responsive: true }} />
      </div>
      </div>}

      {chartType === 'bar' && 
      <div className="chart-container">
      <div className="bar">
        <Bar data={chartData.barData} options={{ responsive: true }} />
      </div></div>}
      
      {chartType === 'line' && 
      <div className="chart-container">     
      <div className="line">
        <Line data={chartData.lineData} options={{ responsive: true }} />
      </div></div>}
    </div>
  );
};

export default ExpenseCharts;
