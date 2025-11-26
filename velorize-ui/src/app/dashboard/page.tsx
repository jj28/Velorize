'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../components/dashboard/DashboardOverview';
import { SalesTrendChart } from '../../components/dashboard/SalesTrendChart';
import { dashboardApi } from '../../lib/api/apiClient';

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

        // Add sample alerts based on inventory data
        const alerts = [];
        if (overview.inventory_metrics?.low_stock_items > 0) {
          alerts.push({
            id: 'low-stock',
            type: 'warning' as const,
            title: 'Low Stock Alert',
            message: `${overview.inventory_metrics.low_stock_items} items below reorder level`,
            timestamp: new Date(),
          });
        }

        if (overview.inventory_metrics?.expired_items > 0) {
          alerts.push({
            id: 'expired',
            type: 'error' as const,
            title: 'Expired Inventory',
            message: `${overview.inventory_metrics.expired_items} items have expired`,
            timestamp: new Date(),
          });
        }

        transformedData.alerts = alerts;

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
          alerts: [
            {
              id: '1',
              type: 'warning',
              title: 'Low Stock Alert',
              message: '12 items below reorder level',
              timestamp: new Date(),
            },
            {
              id: '2',
              type: 'error',
              title: 'Expired Inventory',
              message: '3 items have expired and need attention',
              timestamp: new Date(),
            },
          ],
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'sop_leader':
        return 'S&OP Leader';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user.first_name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's your S&OP dashboard overview for today
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} Showing sample data for demonstration.
        </Alert>
      )}

      {/* Dashboard Overview */}
      {dashboardData && (
        <Box sx={{ mb: 4 }}>
          <DashboardOverview data={dashboardData} loading={loading} />
        </Box>
      )}

      {/* Sales Trend Chart */}
      <Box sx={{ mb: 4 }}>
        <SalesTrendChart data={salesTrends} loading={loading} />
      </Box>

      {/* Phase 2 Complete Status */}
      <Alert severity="success" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          🎉 Phase 2 Complete - Full S&OP Backend Implemented!
        </Typography>
        <Typography variant="body2" paragraph>
          Your Velorize platform now includes:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>Complete master data management (Products, Customers, Suppliers)</li>
          <li>Advanced inventory management with BOM and stock tracking</li>
          <li>Comprehensive analytics engine with ABC/XYZ analysis</li>
          <li>AI-powered demand forecasting with multiple algorithms</li>
          <li>Inventory optimization with EOQ and reorder point calculations</li>
          <li>Marketing calendar and Annual Operating Plan management</li>
          <li>Real-time dashboard with KPIs and system health monitoring</li>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Now building the complete frontend interface for your S&OP operations!
        </Typography>
      </Alert>
    </Container>
  );
}