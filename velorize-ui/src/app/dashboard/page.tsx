'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Alert, Grid, Card, CardContent, ToggleButtonGroup, ToggleButton, Slider, Divider } from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { SalesTrendChart } from '../../components/dashboard/SalesTrendChart';
import { StatCard } from '../../components/dashboard/StatCard';
import { dashboardApi } from '../../lib/api/apiClient';
import { Inventory, Warning, Layers, Timeline, ViewModule, ViewList } from '@mui/icons-material';

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
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }>;
}

interface SalesData {
  period: string;
  date: string;
  revenue: number;
  quantity: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Projection Parameters State
  const [coverageUnit, setCoverageUnit] = useState('days');
  const [excessThreshold, setExcessThreshold] = useState<number>(60);
  const [calcBasis, setCalcBasis] = useState('next-month');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dashboard overview data
        const overview = await dashboardApi.getOverview();
        
        // Load sales trends data
        const trends = await dashboardApi.getSalesTrends();

        // Transform API data to component format
        const transformedData: DashboardData = {
          sales: {
            currentMonth: overview.sales_metrics?.current_month?.revenue || 0,
            growth: overview.sales_metrics?.current_month?.revenue_growth_percentage || 0,
            ytd: overview.sales_metrics?.ytd?.revenue || 0,
          },
          inventory: {
            totalValue: overview.inventory_metrics?.total_value_rm || 0,
            lowStock: overview.inventory_metrics?.low_stock_items || 0,
            expired: overview.inventory_metrics?.expired_items || 0,
          },
          customers: {
            total: overview.master_data?.customers?.total || 0,
            active: overview.master_data?.customers?.active || 0,
            newThisMonth: 0, // This would need to be calculated from API
          },
          forecasting: {
            accuracy: 0, // This would come from forecast accuracy endpoint
            coverage: overview.forecasting?.forecast_coverage_percentage || 0,
            activeForecasts: overview.forecasting?.active_forecasts_30_days || 0,
          },
          alerts: [],
        };

        setDashboardData(transformedData);
        setSalesTrends(trends.trends || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        
        // Set fallback data for development
        setDashboardData({
          sales: {
            currentMonth: 125000,
            growth: 8.5,
            ytd: 1250000,
          },
          inventory: {
            totalValue: 450000,
            lowStock: 12,
            expired: 3,
          },
          customers: {
            total: 156,
            active: 142,
            newThisMonth: 8,
          },
          forecasting: {
            accuracy: 87,
            coverage: 72,
            activeForecasts: 24,
          },
          alerts: [],
        });

        // Sample sales trend data
        setSalesTrends([
          { period: '2024-01', date: '2024-01-01', revenue: 95000, quantity: 1200 },
          { period: '2024-02', date: '2024-02-01', revenue: 110000, quantity: 1350 },
          { period: '2024-03', date: '2024-03-01', revenue: 125000, quantity: 1500 },
          { period: '2024-04', date: '2024-04-01', revenue: 118000, quantity: 1420 },
          { period: '2024-05', date: '2024-05-01', revenue: 132000, quantity: 1600 },
          { period: '2024-06', date: '2024-06-01', revenue: 145000, quantity: 1750 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ color: 'text.primary' }}>
            Velorize
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.first_name}. Here is your inventory overview.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="caption" sx={{ bgcolor: 'white', px: 1, py: 0.5, borderRadius: 1, border: '1px solid #EAECF0' }}>
            v1.1.0
          </Typography>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} Showing sample data for demonstration.
        </Alert>
      )}

      {/* Stats Grid */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <StatCard
              title="TOTAL STOCK ON HAND"
              value={`RM ${(dashboardData.inventory.totalValue / 1000).toFixed(1)}k`}
              icon={Inventory}
              color="primary"
              subtitle="Total inventory value"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="CRITICAL LOW STOCK"
              value={`${dashboardData.inventory.lowStock} SKUs`}
              icon={Warning}
              color="error"
              subtitle="Below reorder point"
              trend={{ value: 12, isPositive: false }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="EXCESS INVENTORY"
              value={`${dashboardData.inventory.expired} SKUs`}
              icon={Layers}
              color="warning"
              subtitle="Overstock / Expired"
              trend={{ value: 5, isPositive: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="STOCK HEALTH"
              value={`${dashboardData.forecasting.accuracy}%`}
              icon={Timeline}
              color="success"
              subtitle="Forecast Accuracy"
              trend={{ value: 2.4, isPositive: true }}
            />
          </Grid>
        </Grid>
      )}

      {/* Projection Parameters */}
      <Card sx={{ mb: 4, p: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>Projection Parameters</Typography>
          </Box>
          
          <Grid container spacing={4} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Coverage Unit
              </Typography>
              <ToggleButtonGroup
                value={coverageUnit}
                exclusive
                onChange={(e, v) => v && setCoverageUnit(v)}
                size="small"
                fullWidth
                sx={{ 
                  bgcolor: 'background.paper',
                  '& .MuiToggleButton-root': { 
                    textTransform: 'none', 
                    px: 3,
                    border: '1px solid #EAECF0'
                  },
                  '& .Mui-selected': {
                    bgcolor: 'primary.light !important',
                    color: 'white !important',
                    border: '1px solid transparent'
                  }
                }}
              >
                <ToggleButton value="days">Days</ToggleButton>
                <ToggleButton value="weeks">Weeks</ToggleButton>
                <ToggleButton value="months">Months</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Unit for displaying stock coverage.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Excess Threshold (Days)
              </Typography>
              <Box sx={{ px: 2, py: 0.5, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #EAECF0' }}>
                <Slider
                  value={excessThreshold}
                  onChange={(e, v) => setExcessThreshold(v as number)}
                  valueLabelDisplay="auto"
                  min={30}
                  max={180}
                  step={15}
                  sx={{ color: 'text.secondary' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Items with coverage &gt; {excessThreshold} days are flagged.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                Calculation Basis
              </Typography>
              <ToggleButtonGroup
                value={calcBasis}
                exclusive
                onChange={(e, v) => v && setCalcBasis(v)}
                size="small"
                fullWidth
                sx={{ 
                  bgcolor: 'background.paper',
                  '& .MuiToggleButton-root': { 
                    textTransform: 'none', 
                    px: 3,
                    border: '1px solid #EAECF0'
                  },
                  '& .Mui-selected': {
                    bgcolor: 'primary.light !important',
                    color: 'white !important',
                    border: '1px solid transparent'
                  }
                }}
              >
                <ToggleButton value="next-month">Next Month</ToggleButton>
                <ToggleButton value="avg-3-month">3-Month Avg</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Denominator for coverage formula.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sales Trend Chart */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Sales Trend</Typography>
        <SalesTrendChart data={salesTrends} loading={loading} />
      </Box>
      
    </Container>
  );
}