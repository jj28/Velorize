import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  ReferenceLine
} from 'recharts';
import { useTheme } from '@mui/material/styles';

export interface TrajectoryDataPoint {
  period: string; // 'M0', 'M1', etc.
  forecast: number;
  incoming: number;
  projectedSoh: number;
}

interface TrajectoryChartProps {
  data: TrajectoryDataPoint[];
  height?: number;
  mini?: boolean;
  safetyStock?: number;
  reorderPoint?: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ 
  data, 
  height = 300,
  mini = false,
  safetyStock,
  reorderPoint
}) => {
  const theme = useTheme();

  // Custom tooltip for mini chart to be less intrusive
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '8px', 
          border: '1px solid #EAECF0', 
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '12px' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginTop: '4px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
              <span style={{ color: '#667085' }}>{entry.name}:</span>
              <span style={{ fontWeight: 500 }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={mini ? { top: 20, right: 0, bottom: 0, left: 0 } : { top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke="#F2F4F7" 
        />
        <XAxis 
          dataKey="period" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#667085', fontSize: 12 }}
          dy={10}
        />
        {!mini && (
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#667085', fontSize: 12 }}
          />
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        {!mini && <Legend />}
        
        {safetyStock !== undefined && (
          <ReferenceLine 
            y={safetyStock} 
            stroke="#ef4444" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Safety Stock', 
              position: 'right', 
              fill: '#ef4444', 
              fontSize: 12 
            }} 
          />
        )}

        {reorderPoint !== undefined && (
          <ReferenceLine 
            y={reorderPoint} 
            stroke="#f97316" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Reorder Point', 
              position: 'right', 
              fill: '#f97316', 
              fontSize: 12 
            }} 
          />
        )}

        {/* Forecast (Demand) - Gray Bar */}
        <Bar 
          dataKey="forecast" 
          name="Forecast (Demand)" 
          barSize={mini ? 20 : 40} 
          fill="#D0D5DD" // Gray 300
          radius={[4, 4, 0, 0]}
        />
        
        {/* Incoming (Supply) - Green Bar */}
        <Bar 
          dataKey="incoming" 
          name="Incoming (Supply)" 
          barSize={mini ? 20 : 40} 
          fill="#10B981" // Emerald 500
          radius={[4, 4, 0, 0]}
        />
        
        {/* Projected SOH - Dotted Line */}
        <Line 
          type="monotone" 
          dataKey="projectedSoh" 
          name="Projected SOH" 
          stroke="#2563EB" // Blue 600
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 6 }}
        >
          {mini && (
            <LabelList 
              dataKey="projectedSoh" 
              position="top" 
              offset={10} 
              style={{ fontSize: '10px', fill: '#2563EB', fontWeight: 600 }} 
              formatter={(value: number) => `${(value / 1000).toFixed(1)}k`}
            />
          )}
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
};
