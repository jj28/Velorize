'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';

interface SalesData {
  period: string;
  date: string;
  revenue: number;
  quantity: number;
}

interface SalesTrendChartProps {
  data: SalesData[];
  loading?: boolean;
}

type ChartType = 'line' | 'bar' | 'area';
type TimePeriod = 'daily' | 'weekly' | 'monthly';

export function SalesTrendChart({ data, loading = false }: SalesTrendChartProps) {
  const theme = useTheme();
  const [chartType, setChartType] = React.useState<ChartType>('line');
  const [timePeriod, setTimePeriod] = React.useState<TimePeriod>('monthly');

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: ChartType,
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleTimePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod,
  ) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  const formatCurrency = (value: number) => {
    return `RM ${value.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (timePeriod) {
      case 'daily':
        return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `W${date.getWeek()}`;
      case 'monthly':
        return date.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
      default:
        return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            boxShadow: theme.shadows[4],
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            {formatDate(label)}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.dataKey === 'revenue' 
                ? `Revenue: ${formatCurrency(entry.value)}`
                : `Quantity: ${entry.value.toLocaleString()} units`
              }
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const chartElements = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="period" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(value) => {
            // Shorten labels for better display
            if (timePeriod === 'monthly') {
              return new Date(value).toLocaleDateString('en-MY', { month: 'short' });
            }
            return value;
          }}
        />
        <YAxis 
          yAxisId="revenue"
          orientation="left"
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <YAxis 
          yAxisId="quantity"
          orientation="right"
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(value) => `${value.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </>
    );

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chartElements}
            <Bar 
              yAxisId="revenue"
              dataKey="revenue" 
              fill={theme.palette.primary.main}
              name="Revenue (RM)"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="quantity"
              dataKey="quantity" 
              fill={theme.palette.secondary.main}
              name="Quantity (Units)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chartElements}
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.3}
              name="Revenue (RM)"
            />
            <Area
              yAxisId="quantity"
              type="monotone"
              dataKey="quantity"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.main}
              fillOpacity={0.3}
              name="Quantity (Units)"
            />
          </AreaChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {chartElements}
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 2 }}
              name="Revenue (RM)"
            />
            <Line
              yAxisId="quantity"
              type="monotone"
              dataKey="quantity"
              stroke={theme.palette.secondary.main}
              strokeWidth={3}
              dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: theme.palette.secondary.main, strokeWidth: 2 }}
              name="Quantity (Units)"
            />
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Sales Trends
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={timePeriod}
              exclusive
              onChange={handleTimePeriodChange}
              size="small"
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="line">Line</ToggleButton>
              <ToggleButton value="bar">Bar</ToggleButton>
              <ToggleButton value="area">Area</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Typography color="text.secondary">
              No sales data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </Box>
        )}

        {/* Summary Stats */}
        {!loading && data.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Period Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="secondary.main">
                  {data.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Units Sold
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0) / data.length)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average Revenue
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Extend Date prototype for week calculation
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};