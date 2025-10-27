'use client';

import { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import SummaryCard from '@/app/modules/common/summary-card';
import ChatComponent from '@/app/modules/common/chat-component';
import TutorialTour from '@/app/modules/common/tutorial-tour';
import { Car, DollarSign, TrendingUp, Clock, Award, Maximize2, X } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SummaryData {
  total_vehicles: number;
  total_profit: number;
  avg_selling_price: number;
  avg_holding_days: number;
  most_sold_manufacturer: string;
}

interface InsightsData {
  summary?: SummaryData;
  sales_volume?: { Month: string; Count: number }[];
  manufacturer_sales?: { Manufacturer: string; Count: number }[];
  manufacturer_profit?: { Manufacturer: string; Avg_Profit: number }[];
  price_trend?: { "Year of manufacture": number; Avg_Price: number }[];
  fuel_sales?: { "Fuel type": string; Count: number }[];
  manufacturer_over_time?: { Month: string; Manufacturer: string; Count: number }[];
  monthly_sales?: { Month: string; Count: number }[];
  owner_price_stats?: { Number_of_Owners: number; count: number; mean: number; std: number; min: number; "25%": number; "50%": number; "75%": number; max: number }[];
  model_popularity?: { Model: string; Count: number }[];
}

export default function Home() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [s3Filename, setS3Filename] = useState<string>('');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  useEffect(() => {
    // Try to get insights data from localStorage (contains summary and other data)
    const storedInsights = localStorage.getItem('insightsData');
    const storedFilename = localStorage.getItem('s3Filename');

    if (storedInsights) {
      try {
        const parsedInsights = JSON.parse(storedInsights);
        setInsights(parsedInsights);
      } catch (error) {
        console.error('Failed to parse stored insights:', error);
      }
    }

    if (storedFilename) {
      setS3Filename(storedFilename);
    }

    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(value);
  };

  // Expanded chart modal
  const renderExpandedChart = () => {
    if (!expandedChart) return null;

    let chartContent = null;
    let title = '';

    switch (expandedChart) {
      case 'sales-trends':
        title = 'Sales Trends Over Time';
        chartContent = insights?.sales_volume ? (
          <div className='h-96'>
            <Line
              data={{
                labels: insights.sales_volume.map((item) => item.Month),
                datasets: [
                  {
                    label: 'Vehicles Sold',
                    data: insights.sales_volume.map((item) => item.Count),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                  y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)' }, beginAtZero: true },
                },
                interaction: { intersect: false, mode: 'index' },
              }}
            />
          </div>
        ) : null;
        break;

      case 'manufacturer-sales':
        title = 'Manufacturer Sales Distribution';
        chartContent = insights?.manufacturer_sales ? (
          <div className='h-96 flex justify-center'>
            <div className='w-full max-w-lg'>
              <Doughnut
                data={{
                  labels: insights.manufacturer_sales.map(item => item.Manufacturer),
                  datasets: [{
                    label: 'Sales Count',
                    data: insights.manufacturer_sales.map(item => item.Count),
                    backgroundColor: ['rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(34, 197, 94, 0.8)'],
                    borderColor: ['rgba(168, 85, 247, 1)', 'rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)', 'rgba(245, 158, 11, 1)', 'rgba(239, 68, 68, 1)', 'rgba(6, 182, 212, 1)', 'rgba(236, 72, 153, 1)', 'rgba(34, 197, 94, 1)'],
                    borderWidth: 3,
                    hoverBorderWidth: 5,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' as const, labels: { padding: 15, usePointStyle: true, font: { size: 12 } } },
                    tooltip: { callbacks: { label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                    }}}
                  },
                  cutout: '50%',
                }}
              />
            </div>
          </div>
        ) : null;
        break;

      case 'price-trends':
        title = 'Price Trends by Year';
        chartContent = insights?.price_trend ? (
          <div className='h-96'>
            <Line
              data={{
                labels: insights.price_trend.map(item => item["Year of manufacture"].toString()),
                datasets: [{
                  label: 'Average Price',
                  data: insights.price_trend.map(item => item.Avg_Price),
                  borderColor: 'rgba(16, 185, 129, 1)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 3,
                  pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  tension: 0.4,
                  fill: true,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return value !== null ? `${label}: ${formatCurrency(value)}` : label;
                }}}},
                scales: {
                  x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                  y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)', callback: function(value) { return formatCurrency(Number(value)); } }, beginAtZero: true },
                },
                interaction: { intersect: false, mode: 'index' },
              }}
            />
          </div>
        ) : null;
        break;

      case 'manufacturer-profit':
        title = 'Profit Analysis by Manufacturer';
        chartContent = insights?.manufacturer_profit ? (
          <div className='h-96'>
            <Bar
              data={{
                labels: insights.manufacturer_profit.map(item => item.Manufacturer),
                datasets: [{
                  label: 'Average Profit (LKR)',
                  data: insights.manufacturer_profit.map(item => item.Avg_Profit),
                  backgroundColor: insights.manufacturer_profit.map(item => item.Avg_Profit >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                  borderColor: insights.manufacturer_profit.map(item => item.Avg_Profit >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
                  borderWidth: 2,
                  borderRadius: 6,
                  borderSkipped: false,
                  hoverBackgroundColor: insights.manufacturer_profit.map(item => item.Avg_Profit >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return value !== null ? `${label}: ${formatCurrency(value)}` : label;
                }}}},
                scales: {
                  x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                  y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)', callback: function(value) { return formatCurrency(Number(value)); } }, beginAtZero: true },
                },
              }}
            />
          </div>
        ) : null;
        break;

      case 'fuel-distribution':
        title = 'Fuel Type Distribution';
        chartContent = insights?.fuel_sales ? (
          <div className='h-96 flex justify-center'>
            <div className='w-full max-w-lg'>
              <Doughnut
                data={{
                  labels: insights.fuel_sales.map(item => item["Fuel type"]),
                  datasets: [{
                    label: 'Sales Count',
                    data: insights.fuel_sales.map(item => item.Count),
                    backgroundColor: ['rgba(6, 182, 212, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(236, 72, 153, 0.8)'],
                    borderColor: ['rgba(6, 182, 212, 1)', 'rgba(245, 158, 11, 1)', 'rgba(168, 85, 247, 1)', 'rgba(239, 68, 68, 1)', 'rgba(34, 197, 94, 1)', 'rgba(236, 72, 153, 1)'],
                    borderWidth: 3,
                    hoverBorderWidth: 5,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' as const, labels: { padding: 15, usePointStyle: true, font: { size: 12 } } },
                    tooltip: { callbacks: { label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                    }}}
                  },
                  cutout: '50%',
                }}
              />
            </div>
          </div>
        ) : null;
        break;

      case 'monthly-sales':
        title = 'Monthly Sales Volume';
        chartContent = insights?.monthly_sales ? (
          <div className='h-96'>
            <Line
              data={{
                labels: insights.monthly_sales.map((item) => item.Month),
                datasets: [{
                  label: 'Vehicles Sold',
                  data: insights.monthly_sales.map((item) => item.Count),
                  borderColor: 'rgba(16, 185, 129, 1)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 3,
                  pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  tension: 0.4,
                  fill: true,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                  y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)' }, beginAtZero: true },
                },
                interaction: { intersect: false, mode: 'index' },
              }}
            />
          </div>
        ) : null;
        break;

      case 'owner-price-stats':
        title = 'Price Distribution by Owner Count';
        chartContent = insights?.owner_price_stats ? (
          <div className='h-96'>
            <Bar
              data={{
                labels: insights.owner_price_stats.map(item => `Owners: ${item.Number_of_Owners}`),
                datasets: [{
                  label: 'Average Price (LKR)',
                  data: insights.owner_price_stats.map(item => item.mean),
                  backgroundColor: 'rgba(139, 92, 246, 0.8)',
                  borderColor: 'rgba(139, 92, 246, 1)',
                  borderWidth: 2,
                  borderRadius: 6,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const stats = insights?.owner_price_stats?.[context.dataIndex];
                        if (stats) {
                          return [
                            `Average: ${formatCurrency(stats.mean)}`,
                            `Min: ${formatCurrency(stats.min)}`,
                            `Max: ${formatCurrency(stats.max)}`,
                            `Count: ${stats.count}`,
                          ];
                        }
                        return context.label || '';
                      }
                    }
                  }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                  y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)', callback: (value) => formatCurrency(Number(value)) }, beginAtZero: true },
                },
              }}
            />
          </div>
        ) : null;
        break;

      case 'model-popularity':
        title = 'Model Popularity';
        chartContent = insights?.model_popularity ? (
          <div className='h-96 flex justify-center'>
            <div className='w-full max-w-4xl'>
              <Bar
                data={{
                  labels: insights.model_popularity.map(item => item.Model),
                  datasets: [{
                    label: 'Sales Count',
                    data: insights.model_popularity.map(item => item.Count),
                    backgroundColor: insights.model_popularity.map((_, index) =>
                      [
                        'rgba(244, 63, 94, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(6, 182, 212, 0.8)',
                        'rgba(236, 72, 153, 0.8)', 'rgba(239, 68, 68, 0.8)'
                      ][index % 8]
                    ),
                    borderColor: insights.model_popularity.map((_, index) =>
                      [
                        'rgba(244, 63, 94, 1)', 'rgba(251, 146, 60, 1)', 'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)', 'rgba(168, 85, 247, 1)', 'rgba(6, 182, 212, 1)',
                        'rgba(236, 72, 153, 1)', 'rgba(239, 68, 68, 1)'
                      ][index % 8]
                    ),
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          return value !== null ? `${label}: ${value}` : label;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: 'rgba(107, 114, 128, 1)', maxRotation: 45, minRotation: 45 }
                    },
                    y: {
                      grid: { color: 'rgba(243, 244, 246, 1)' },
                      ticks: { color: 'rgba(107, 114, 128, 1)' },
                      beginAtZero: true
                    },
                  },
                }}
              />
            </div>
          </div>
        ) : null;
        break;
    }

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden'>
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <h2 className='text-2xl font-bold text-gray-900'>{title}</h2>
            <button
              onClick={() => setExpandedChart(null)}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
          <div className='p-6'>
            {chartContent}
          </div>
        </div>
      </div>
    );
  };

  return (
    <TutorialTour page="dashboard">
      <div className='p-6 min-h-screen flex gap-6' data-tutorial="dashboard">
        {/* Left Column: Analytics */}
        <div className='flex-1 overflow-y-auto space-y-6 max-h-screen pr-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          Dashboard
        </h1>

        {/* Summary Stats Section */}
        <div className='space-y-6'>
          <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
            Summary Data
          </h2>
          <div className='bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg' data-tutorial="summary-cards">
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        {loading ? (
          <div className='col-span-full text-center py-8'>
            Loading summary data...
          </div>
        ) : insights?.summary ? (
          <>
            <SummaryCard
              title='Total Vehicles Sold'
              value={insights.summary.total_vehicles.toLocaleString()}
              icon={<Car className='w-6 h-6' />}
            />
            <SummaryCard
              title='Total Profit'
              value={formatCurrency(insights.summary.total_profit)}
              icon={<DollarSign className='w-6 h-6' />}
            />
            <SummaryCard
              title='Average Selling Price'
              value={formatCurrency(insights.summary.avg_selling_price)}
              icon={<TrendingUp className='w-6 h-6' />}
            />
            <SummaryCard
              title='Average Holding Days'
              value={insights.summary.avg_holding_days}
              icon={<Clock className='w-6 h-6' />}
            />
            <SummaryCard
              title='Most Sold Manufacturer'
              value={insights.summary.most_sold_manufacturer}
              icon={<Award className='w-6 h-6' />}
            />
          </>
        ) : (
          <div className='col-span-full text-center py-8 text-gray-500'>
            No data available. Please upload a CSV file first.
          </div>
        )}
            </div>
          </div>
        </div>

        {/* Charts Grid Section */}
        <div className='space-y-6'>
          <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
            Analytics Overview
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6' data-tutorial="charts">
            {/* Time-Based Trends */}
            <div className='bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Sales Trends Over Time
                </h3>
                <button
                  onClick={() => setExpandedChart('sales-trends')}
                  className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
                  title='Expand chart'
                >
                  <Maximize2 className='w-4 h-4 text-gray-600' />
                </button>
              </div>
              {insights?.sales_volume ? (
                <div className='h-64'>
                  <Line
                    data={{
                      labels: insights.sales_volume.map((item) => item.Month),
                      datasets: [
                        {
                          label: 'Vehicles Sold',
                          data: insights.sales_volume.map((item) => item.Count),
                          borderColor: 'rgba(59, 130, 246, 1)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderWidth: 3,
                          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                          pointBorderColor: '#ffffff',
                          pointBorderWidth: 2,
                          pointRadius: 6,
                          pointHoverRadius: 8,
                          tension: 0.4,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: 'rgba(107, 114, 128, 1)',
                          },
                        },
                        y: {
                          grid: {
                            color: 'rgba(243, 244, 246, 1)',
                          },
                          ticks: {
                            color: 'rgba(107, 114, 128, 1)',
                          },
                          beginAtZero: true,
                        },
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index',
                      },
                    }}
                  />
                </div>
              ) : (
                <div className='h-64 flex items-center justify-center text-gray-500'>
                  No sales volume data available.
                </div>
              )}
            </div>

            {/* Manufacturer Sales Distribution */}
            <div className='bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Manufacturer Sales
                </h3>
                <button
                  onClick={() => setExpandedChart('manufacturer-sales')}
                  className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
                  title='Expand chart'
                >
                  <Maximize2 className='w-4 h-4 text-gray-600' />
                </button>
              </div>
              {insights?.manufacturer_sales ? (
                <div className='h-80 flex justify-center'>
                  <div className='w-full max-w-md'>
                    <Doughnut
                      data={{
                        labels: insights.manufacturer_sales.map(item => item.Manufacturer),
                        datasets: [
                          {
                            label: 'Sales Count',
                            data: insights.manufacturer_sales.map(item => item.Count),
                            backgroundColor: [
                              'rgba(168, 85, 247, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(6, 182, 212, 0.8)',
                              'rgba(236, 72, 153, 0.8)',
                              'rgba(34, 197, 94, 0.8)',
                            ],
                            borderColor: [
                              'rgba(168, 85, 247, 1)',
                              'rgba(59, 130, 246, 1)',
                              'rgba(16, 185, 129, 1)',
                              'rgba(245, 158, 11, 1)',
                              'rgba(239, 68, 68, 1)',
                              'rgba(6, 182, 212, 1)',
                              'rgba(236, 72, 153, 1)',
                              'rgba(34, 197, 94, 1)',
                            ],
                            borderWidth: 3,
                            hoverBorderWidth: 5,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                            labels: {
                              padding: 15,
                              usePointStyle: true,
                              font: {
                                size: 12,
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                              }
                            }
                          }
                        },
                        cutout: '50%',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className='h-80 flex items-center justify-center text-gray-500'>
                  No manufacturer sales data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

          {/* Price Trends */}
          <div className='bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Price Trends by Year
              </h3>
              <button
                onClick={() => setExpandedChart('price-trends')}
                className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
                title='Expand chart'
              >
                <Maximize2 className='w-4 h-4 text-gray-600' />
              </button>
            </div>
            {insights?.price_trend ? (
              <div className='h-64'>
                <Line
                  data={{
                    labels: insights.price_trend.map(item => item["Year of manufacture"].toString()),
                    datasets: [
                      {
                        label: 'Average Price',
                        data: insights.price_trend.map(item => item.Avg_Price),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return value !== null ? `${label}: ${formatCurrency(value)}` : label;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: 'rgba(107, 114, 128, 1)',
                        },
                      },
                      y: {
                        grid: {
                          color: 'rgba(243, 244, 246, 1)',
                        },
                        ticks: {
                          color: 'rgba(107, 114, 128, 1)',
                          callback: function(value) {
                            return formatCurrency(Number(value));
                          }
                        },
                        beginAtZero: true,
                      },
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index',
                    },
                  }}
                />
              </div>
            ) : (
              <div className='h-64 flex items-center justify-center text-gray-500'>
                No price trend data available.
              </div>
            )}
          </div>

          {/* Manufacturer Profit Analysis */}
          <div className='bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Profit Analysis by Manufacturer
              </h3>
              <button
                onClick={() => setExpandedChart('manufacturer-profit')}
                className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
                title='Expand chart'
              >
                <Maximize2 className='w-4 h-4 text-gray-600' />
              </button>
            </div>
            {insights?.manufacturer_profit ? (
              <div className='h-64'>
                <Bar
                  data={{
                    labels: insights.manufacturer_profit.map(item => item.Manufacturer),
                    datasets: [
                      {
                        label: 'Average Profit (LKR)',
                        data: insights.manufacturer_profit.map(item => item.Avg_Profit),
                        backgroundColor: insights.manufacturer_profit.map(item =>
                          item.Avg_Profit >= 0
                            ? 'rgba(34, 197, 94, 0.8)'
                            : 'rgba(239, 68, 68, 0.8)'
                        ),
                        borderColor: insights.manufacturer_profit.map(item =>
                          item.Avg_Profit >= 0
                            ? 'rgba(34, 197, 94, 1)'
                            : 'rgba(239, 68, 68, 1)'
                        ),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        hoverBackgroundColor: insights.manufacturer_profit.map(item =>
                          item.Avg_Profit >= 0
                            ? 'rgba(34, 197, 94, 1)'
                            : 'rgba(239, 68, 68, 1)'
                        ),
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return value !== null ? `${label}: ${formatCurrency(value)}` : label;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: 'rgba(107, 114, 128, 1)',
                        },
                      },
                      y: {
                        grid: {
                          color: 'rgba(243, 244, 246, 1)',
                        },
                        ticks: {
                          color: 'rgba(107, 114, 128, 1)',
                          callback: function(value) {
                            return formatCurrency(Number(value));
                          }
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className='h-64 flex items-center justify-center text-gray-500'>
                No manufacturer profit data available.
              </div>
            )}
          </div>
        </div>

        {/* Fuel Type Distribution */}
        <div className='bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Fuel Type Distribution
            </h3>
            <button
              onClick={() => setExpandedChart('fuel-distribution')}
              className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
              title='Expand chart'
            >
              <Maximize2 className='w-4 h-4 text-gray-600' />
            </button>
          </div>
          {insights?.fuel_sales ? (
            <div className='h-80 flex justify-center'>
              <div className='w-full max-w-md'>
                <Doughnut
                  data={{
                    labels: insights.fuel_sales.map(item => item["Fuel type"]),
                    datasets: [
                      {
                        label: 'Sales Count',
                        data: insights.fuel_sales.map(item => item.Count),
                        backgroundColor: [
                          'rgba(6, 182, 212, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(168, 85, 247, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(236, 72, 153, 0.8)',
                        ],
                        borderColor: [
                          'rgba(6, 182, 212, 1)',
                          'rgba(245, 158, 11, 1)',
                          'rgba(168, 85, 247, 1)',
                          'rgba(239, 68, 68, 1)',
                          'rgba(34, 197, 94, 1)',
                          'rgba(236, 72, 153, 1)',
                        ],
                        borderWidth: 3,
                        hoverBorderWidth: 5,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          padding: 15,
                          usePointStyle: true,
                          font: {
                            size: 12,
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '50%',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className='h-80 flex items-center justify-center text-gray-500'>
              No fuel sales data available.
            </div>
          )}
        </div>

        {/* New Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Monthly Sales Volume */}
          <div className='bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Monthly Sales Volume
              </h3>
              <button
                onClick={() => setExpandedChart('monthly-sales')}
                className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
                title='Expand chart'
              >
                <Maximize2 className='w-4 h-4 text-gray-600' />
              </button>
            </div>
            {insights?.monthly_sales ? (
              <div className='h-64'>
                <Line
                  data={{
                    labels: insights.monthly_sales.map((item) => item.Month),
                    datasets: [{
                      label: 'Vehicles Sold',
                      data: insights.monthly_sales.map((item) => item.Count),
                      borderColor: 'rgba(16, 185, 129, 1)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderWidth: 3,
                      pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      tension: 0.4,
                      fill: true,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                      y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)' }, beginAtZero: true },
                    },
                    interaction: { intersect: false, mode: 'index' },
                  }}
                />
              </div>
            ) : (
              <div className='h-64 flex items-center justify-center text-gray-500'>
                No monthly sales data available.
              </div>
            )}
          </div>

          {/* Owner Count vs Price Distribution */}
          <div className='bg-gradient-to-br from-violet-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Price Distribution by Owner Count
              </h3>
              <button
                onClick={() => setExpandedChart('owner-price-stats')}
                className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
                title='Expand chart'
              >
                <Maximize2 className='w-4 h-4 text-gray-600' />
              </button>
            </div>
            {insights?.owner_price_stats ? (
              <div className='h-64'>
                <Bar
                  data={{
                    labels: insights.owner_price_stats.map(item => `Owners: ${item.Number_of_Owners}`),
                    datasets: [{
                      label: 'Average Price (LKR)',
                      data: insights.owner_price_stats.map(item => item.mean),
                      backgroundColor: 'rgba(139, 92, 246, 0.8)',
                      borderColor: 'rgba(139, 92, 246, 1)',
                      borderWidth: 2,
                      borderRadius: 6,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const stats = insights?.owner_price_stats?.[context.dataIndex];
                            if (stats) {
                              return [
                                `Average: ${formatCurrency(stats.mean)}`,
                                `Min: ${formatCurrency(stats.min)}`,
                                `Max: ${formatCurrency(stats.max)}`,
                                `Count: ${stats.count}`,
                              ];
                            }
                            return context.label || '';
                          }
                        }
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: 'rgba(107, 114, 128, 1)' } },
                      y: { grid: { color: 'rgba(243, 244, 246, 1)' }, ticks: { color: 'rgba(107, 114, 128, 1)', callback: (value) => formatCurrency(Number(value)) }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            ) : (
              <div className='h-64 flex items-center justify-center text-gray-500'>
                No owner price data available.
              </div>
            )}
          </div>
        </div>

        {/* Model Popularity */}
        <div className='bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Model Popularity
            </h3>
            <button
              onClick={() => setExpandedChart('model-popularity')}
              className='opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-lg transition-all duration-200'
              title='Expand chart'
            >
              <Maximize2 className='w-4 h-4 text-gray-600' />
            </button>
          </div>
          {insights?.model_popularity ? (
            <div className='h-80 flex justify-center'>
              <div className='w-full max-w-2xl'>
                <Bar
                  data={{
                    labels: insights.model_popularity.map(item => item.Model),
                    datasets: [{
                      label: 'Sales Count',
                      data: insights.model_popularity.map(item => item.Count),
                      backgroundColor: insights.model_popularity.map((_, index) =>
                        [
                          'rgba(244, 63, 94, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(34, 197, 94, 0.8)',
                          'rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(6, 182, 212, 0.8)',
                          'rgba(236, 72, 153, 0.8)', 'rgba(239, 68, 68, 0.8)'
                        ][index % 8]
                      ),
                      borderColor: insights.model_popularity.map((_, index) =>
                        [
                          'rgba(244, 63, 94, 1)', 'rgba(251, 146, 60, 1)', 'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)', 'rgba(168, 85, 247, 1)', 'rgba(6, 182, 212, 1)',
                          'rgba(236, 72, 153, 1)', 'rgba(239, 68, 68, 1)'
                        ][index % 8]
                      ),
                      borderWidth: 2,
                      borderRadius: 6,
                      borderSkipped: false,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return value !== null ? `${label}: ${value}` : label;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(107, 114, 128, 1)', maxRotation: 45, minRotation: 45 }
                      },
                      y: {
                        grid: { color: 'rgba(243, 244, 246, 1)' },
                        ticks: { color: 'rgba(107, 114, 128, 1)' },
                        beginAtZero: true
                      },
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <div className='h-80 flex items-center justify-center text-gray-500'>
              No model popularity data available.
            </div>
          )}
        </div>
      </div>

        {/* Right Column: Chat Sidebar */}
        <div className='w-80 flex-shrink-0' data-tutorial="chat">
          <div className='fixed right-6 top-24 bottom-6 w-80'>
            {s3Filename && <ChatComponent filename={s3Filename} />}
          </div>
        </div>

        {/* Expanded Chart Modal */}
        {renderExpandedChart()}
      </div>
    </TutorialTour>
  );
}
