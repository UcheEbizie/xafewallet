import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AccessTrendsChartProps {
  data: Array<{
    date: string;
    views: number;
    downloads: number;
  }>;
  height?: number;
}

const AccessTrendsChart: React.FC<AccessTrendsChartProps> = ({ data, height = 200 }) => {
  // Format dates for display
  const formattedData = data.map(item => {
    const date = new Date(item.date);
    return {
      ...item,
      formattedDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No access data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="#3b82f6" 
            activeDot={{ r: 8 }} 
            name="Views"
          />
          <Line 
            type="monotone" 
            dataKey="downloads" 
            stroke="#10b981" 
            name="Downloads"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccessTrendsChart;