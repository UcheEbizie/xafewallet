import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CertificatePopularityChartProps {
  data: Array<{
    title: string;
    views: number;
    downloads: number;
  }>;
  height?: number;
}

const CertificatePopularityChart: React.FC<CertificatePopularityChartProps> = ({ data, height = 200 }) => {
  // Format data for display
  const formattedData = data.map(item => {
    // Truncate long titles
    const truncatedTitle = item.title.length > 20 
      ? item.title.substring(0, 20) + '...' 
      : item.title;
    
    return {
      ...item,
      title: truncatedTitle
    };
  });

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No certificate data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="title" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="views" name="Views" fill="#3b82f6" />
          <Bar dataKey="downloads" name="Downloads" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CertificatePopularityChart;