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
import { Car, DollarSign, TrendingUp, Clock, Award } from 'lucide-react';

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
}

export default function Home() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [s3Filename, setS3Filename] = useState<string>('');

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

  return (
    <div className='p-6 h-screen grid grid-cols-1 lg:grid-cols-4 gap-6'>
      {/* Left Column: Analytics */}
      <div className='lg:col-span-3 overflow-y-auto space-y-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          Dashboard
        </h1>

        {/* Summary Stats Section */}
        <div className='space-y-6'>
          <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
            Summary Data
          </h2>
          <div className='bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg'>
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
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Time-Based Trends */}
            <div className='bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Sales Trends Over Time
              </h3>
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
            <div className='bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Manufacturer Sales
              </h3>
              {insights?.manufacturer_sales ? (
                <div className='h-64'>
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
                          borderWidth: 2,
                          hoverBorderWidth: 4,
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
                              const label = context.label || '';
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '60%',
                    }}
                  />
                </div>
              ) : (
                <div className='h-64 flex items-center justify-center text-gray-500'>
                  No manufacturer sales data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Price Trends */}
          <div className='bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Price Trends by Year
            </h3>
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
          <div className='bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Profit Analysis by Manufacturer
            </h3>
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
        <div className='bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Fuel Type Distribution
          </h3>
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
      </div>

      {/* Right Column: Chat Sidebar */}
      <div className='lg:col-span-1'>
        {s3Filename && <ChatComponent filename={s3Filename} />}
      </div>
    </div>
  );
}
