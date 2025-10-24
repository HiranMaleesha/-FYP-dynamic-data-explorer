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
    <div className='p-6 space-y-6'>
      <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
        Dashboard
      </h1>

      {/* Summary Stats Section */}
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

      {/* Time-Based Trends Section */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Time-Based Trends
        </h2>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
          {insights?.sales_volume ? (
            <Line
              data={{
                labels: insights.sales_volume.map((item) => item.Month),
                datasets: [
                  {
                    label: 'Vehicles Sold',
                    data: insights.sales_volume.map((item) => item.Count),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Vehicles Sold Over Time (Monthly)',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Month',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Number of Vehicles',
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No sales volume data available.
            </div>
          )}
        </div>
      </div>

      {/* Manufacturer Sales Distribution Section */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Manufacturer Sales Distribution
        </h2>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
          {insights?.manufacturer_sales ? (
            <Doughnut
              data={{
                labels: insights.manufacturer_sales.map(item => item.Manufacturer),
                datasets: [
                  {
                    label: 'Sales Count',
                    data: insights.manufacturer_sales.map(item => item.Count),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.8)',
                      'rgba(54, 162, 235, 0.8)',
                      'rgba(255, 205, 86, 0.8)',
                      'rgba(75, 192, 192, 0.8)',
                      'rgba(153, 102, 255, 0.8)',
                      'rgba(255, 159, 64, 0.8)',
                      'rgba(199, 199, 199, 0.8)',
                      'rgba(83, 102, 255, 0.8)',
                      'rgba(255, 99, 255, 0.8)',
                      'rgba(99, 255, 132, 0.8)',
                    ],
                    borderColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 205, 86, 1)',
                      'rgba(75, 192, 192, 1)',
                      'rgba(153, 102, 255, 1)',
                      'rgba(255, 159, 64, 1)',
                      'rgba(199, 199, 199, 1)',
                      'rgba(83, 102, 255, 1)',
                      'rgba(255, 99, 255, 1)',
                      'rgba(99, 255, 132, 1)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                  title: {
                    display: true,
                    text: 'Vehicle Sales by Manufacturer',
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
              }}
            />
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No manufacturer sales data available.
            </div>
          )}
        </div>
      </div>

      {/* Price Trends Section */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Price Trends by Year of Manufacture
        </h2>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
          {insights?.price_trend ? (
            <Line
              data={{
                labels: insights.price_trend.map(item => item["Year of manufacture"].toString()),
                datasets: [
                  {
                    label: 'Average Price',
                    data: insights.price_trend.map(item => item.Avg_Price),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Average Vehicle Price by Year of Manufacture',
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
                    title: {
                      display: true,
                      text: 'Year of Manufacture',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Average Price (LKR)',
                    },
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(Number(value));
                      }
                    }
                  },
                },
              }}
            />
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No price trend data available.
            </div>
          )}
        </div>
      </div>

      {/* Manufacturer Profit Analysis Section */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Manufacturer Profit Analysis
        </h2>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
          {insights?.manufacturer_profit ? (
            <Bar
              data={{
                labels: insights.manufacturer_profit.map(item => item.Manufacturer),
                datasets: [
                  {
                    label: 'Average Profit (LKR)',
                    data: insights.manufacturer_profit.map(item => item.Avg_Profit),
                    backgroundColor: insights.manufacturer_profit.map(item =>
                      item.Avg_Profit >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)'
                    ),
                    borderColor: insights.manufacturer_profit.map(item =>
                      item.Avg_Profit >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
                    ),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Average Profit by Manufacturer',
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
                    title: {
                      display: true,
                      text: 'Manufacturer',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Average Profit (LKR)',
                    },
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(Number(value));
                      }
                    }
                  },
                },
              }}
            />
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No manufacturer profit data available.
            </div>
          )}
        </div>
      </div>

      {/* Fuel Type Distribution Section */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Fuel Type Distribution
        </h2>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
          {insights?.fuel_sales ? (
            <div className='flex justify-center'>
              <div className='w-full max-w-4xl h-96'>
                <Doughnut
                  data={{
                    labels: insights.fuel_sales.map(item => item["Fuel type"]),
                    datasets: [
                      {
                        label: 'Sales Count',
                        data: insights.fuel_sales.map(item => item.Count),
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.8)',
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 205, 86, 0.8)',
                          'rgba(75, 192, 192, 0.8)',
                          'rgba(153, 102, 255, 0.8)',
                          'rgba(255, 159, 64, 0.8)',
                          'rgba(199, 199, 199, 0.8)',
                          'rgba(83, 102, 255, 0.8)',
                          'rgba(255, 99, 255, 0.8)',
                          'rgba(99, 255, 132, 0.8)',
                        ],
                        borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 205, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
                          'rgba(255, 159, 64, 1)',
                          'rgba(199, 199, 199, 1)',
                          'rgba(83, 102, 255, 1)',
                          'rgba(255, 99, 255, 1)',
                          'rgba(99, 255, 132, 1)',
                        ],
                        borderWidth: 2,
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
                          padding: 20,
                          usePointStyle: true,
                        }
                      },
                      title: {
                        display: true,
                        text: 'Vehicle Sales by Fuel Type',
                        font: {
                          size: 16,
                          weight: 'bold'
                        },
                        padding: 20
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
                  }}
                />
              </div>
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No fuel sales data available.
            </div>
          )}
        </div>
      </div>

      {/* Chat Component */}
      {s3Filename && <ChatComponent filename={s3Filename} />}

    </div>
  );
}
