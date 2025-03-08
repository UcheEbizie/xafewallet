import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ShareAnalyticsProps {
  emailShares: number;
  linkShares: number;
  qrShares: number;
  showLegend?: boolean;
  height?: number;
}

const ShareAnalytics: React.FC<ShareAnalyticsProps> = ({ 
  emailShares, 
  linkShares, 
  qrShares,
  showLegend = false,
  height = 200
}) => {
  const data = [
    { name: 'Email', value: emailShares, color: '#3b82f6' },
    { name: 'Link', value: linkShares, color: '#8b5cf6' },
    { name: 'QR Code', value: qrShares, color: '#10b981' }
  ].filter(item => item.value > 0);

  // If no data, show a message
  if (data.length === 0 || (emailShares === 0 && linkShares === 0 && qrShares === 0)) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No share data available</p>
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
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showLegend && <Legend />}
          <Tooltip 
            formatter={(value) => [`${value} shares`, 'Count']}
            labelFormatter={(name) => `${name} Shares`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShareAnalytics;