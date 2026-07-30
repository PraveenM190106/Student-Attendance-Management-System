import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Donut Chart Component
export const AttendanceDonutChart = ({ present = 0, absent = 0, title }) => {
  const chartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [present, absent],
        backgroundColor: ['#10b981', '#f43f5e'], // Green -> Present, Red -> Absent
        borderColor: ['#059669', '#e11d48'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          font: { size: 13, weight: '600' }
        }
      },
      title: {
        display: !!title,
        text: title || '',
        color: '#f8fafc',
        font: { size: 15, weight: '700' }
      }
    }
  };

  return (
    <div style={{ height: '260px', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Pie Chart Component
export const AttendancePieChart = ({ present = 0, absent = 0, title }) => {
  const chartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [present, absent],
        backgroundColor: ['#10b981', '#f43f5e'], // Green -> Present, Red -> Absent
        borderColor: ['#059669', '#e11d48'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          font: { size: 13, weight: '600' }
        }
      },
      title: {
        display: !!title,
        text: title || '',
        color: '#f8fafc',
        font: { size: 15, weight: '700' }
      }
    }
  };

  return (
    <div style={{ height: '260px', position: 'relative' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

// Department Attendance Bar Chart
export const DepartmentAttendanceChart = ({ data }) => {
  const labels = Object.keys(data || {});
  const values = Object.values(data || {});

  const chartData = {
    labels: labels.length ? labels : ['Computer Science', 'Info Tech', 'Electronics', 'Mechanical'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: values.length ? values : [92.4, 88.2, 85.6, 81.0],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// 6-Day Weekly Attendance Bar Chart Component
export const WeeklyAttendanceBarChart = ({ weeklyStats = [] }) => {
  const labels = weeklyStats.length > 0 
    ? weeklyStats.map(w => w.day) 
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];

  const presentData = weeklyStats.length > 0 
    ? weeklyStats.map(w => w.present) 
    : [0, 0, 0, 0, 0, 0];

  const absentData = weeklyStats.length > 0 
    ? weeklyStats.map(w => w.absent) 
    : [0, 0, 0, 0, 0, 0];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Present Students',
        data: presentData,
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Absent Students',
        data: absentData,
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e2e8f0', font: { size: 12, weight: '600' } }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      },
    },
  };

  return (
    <div style={{ height: '280px', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export const AttendanceRatioChart = AttendanceDonutChart;

