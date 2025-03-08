import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DeviceBreakdownChartProps {
  data: Array<{
    device: string;
    count: number;
  }>;
  height?: number;
}

const DeviceBreakdownChart: React.FC<DeviceBreakdownChartProps> = ({ data, height = 200 }) => {
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No device data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="device"
            label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip 
            formatter={(value) => [`${value} accesses`, 'Count']}
            labelFormatter={(name) => `${name} Devices`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DeviceBreakdownChart;