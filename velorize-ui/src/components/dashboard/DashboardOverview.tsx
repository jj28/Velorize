'use client';

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  People,
  AttachMoney,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  icon: React.ElementType;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon: Icon, 
  color, 
  loading = false 
}: MetricCardProps) {
  const theme = useTheme();
  
  const getTrendColor = (direction: 'up' | 'down') => {
    return direction === 'up' ? theme.palette.success.main : theme.palette.error.main;
  };

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography color="text.secondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 40, height: 40 }}>
            <Icon />
          </Avatar>
        </Box>
        
        {loading ? (
          <Box sx={{ width: '100%', my: 2 }}>
            <LinearProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            
            {subtitle && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {subtitle}
              </Typography>
            )}
            
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: getTrendColor(trend.direction),
                    mr: 0.5 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ color: getTrendColor(trend.direction) }}
                >
                  {Math.abs(trend.value)}% {trend.period}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

function AlertsCard({ alerts }: { alerts: AlertItem[] }) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <Warning color="error" />;
      case 'warning':
        return <Schedule color="warning" />;
      default:
        return <CheckCircle color="info" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Alerts
        </Typography>
        
        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography color="text.secondary">
              All systems running smoothly
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <Box 
                key={alert.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2, 
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                {getAlertIcon(alert.type)}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {alert.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.message}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={alert.type.toUpperCase()} 
                      size="small" 
                      color={getAlertColor(alert.type) as any}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardData {
  sales: {
    currentMonth: number;
    growth: number;
    ytd: number;
  };
  inventory: {
    totalValue: number;
    lowStock: number;
    expired: number;
  };
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  forecasting: {
    accuracy: number;
    coverage: number;
    activeForecasts: number;
  };
  alerts: AlertItem[];
}

interface DashboardOverviewProps {
  data: DashboardData;
  loading?: boolean;
}

export function DashboardOverview({ data, loading = false }: DashboardOverviewProps) {
  return (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Monthly Revenue"
          value={`RM ${data.sales.currentMonth.toLocaleString()}`}
          subtitle="Current month sales"
          trend={{
            value: data.sales.growth,
            direction: data.sales.growth >= 0 ? 'up' : 'down',
            period: 'vs last month'
          }}
          icon={AttachMoney}
          color="success"
          loading={loading}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Inventory Value"
          value={`RM ${data.inventory.totalValue.toLocaleString()}`}
          subtitle={`${data.inventory.lowStock} items low stock`}
          icon={Inventory}
          color="primary"
          loading={loading}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Customers"
          value={data.customers.active}
          subtitle={`+${data.customers.newThisMonth} this month`}
          icon={People}
          color="info"
          loading={loading}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Forecast Accuracy"
          value={`${data.forecasting.accuracy}%`}
          subtitle={`${data.forecasting.coverage}% coverage`}
          icon={TrendingUp}
          color="warning"
          loading={loading}
        />
      </Grid>

      {/* YTD Performance */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Year-to-Date Performance
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Revenue Progress</Typography>
                <Typography variant="body2">
                  RM {data.sales.ytd.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={65} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                65% of annual target achieved
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    23%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Growth Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    8.2
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Inventory Turnover
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    95%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fill Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    4.2
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Days Sales Outstanding
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Alerts */}
      <Grid item xs={12} md={4}>
        <AlertsCard alerts={data.alerts} />
      </Grid>
    </Grid>
  );
}