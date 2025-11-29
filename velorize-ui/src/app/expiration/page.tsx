'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Slider,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Warning,
  TrendingUp,
  Info,
  Refresh,
} from '@mui/icons-material';
import { RiskSummaryCard } from '@/components/expiration/RiskSummaryCard';
import { ActionRequiredTable } from '@/components/expiration/ActionRequiredTable';
import { StrategicOrderingChart } from '@/components/expiration/StrategicOrderingChart';
import toast from 'react-hot-toast';

interface ExpirationDashboardData {
  summary: {
    immediateRisk: {
      totalValue: number;
      itemCount: number;
    };
    projectedRisk: {
      totalValue: number;
      itemCount: number;
      horizonDays: number;
    };
    safetyBuffer: number;
  };
  riskCalculation: {
    avgReplenishmentTime: number;
    safetyBuffer: number;
    criticalThreshold: number;
  };
}

export default function ExpirationPage() {
  const [loading, setLoading] = useState(false);
  const [safetyBuffer, setSafetyBuffer] = useState(5);
  const [dashboardData, setDashboardData] = useState<ExpirationDashboardData>({
    summary: {
      immediateRisk: {
        totalValue: 498,
        itemCount: 3,
      },
      projectedRisk: {
        totalValue: 363,
        itemCount: 2,
        horizonDays: 7,
      },
      safetyBuffer: 5,
    },
    riskCalculation: {
      avgReplenishmentTime: 3.8,
      safetyBuffer: 5,
      criticalThreshold: -8.8,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, [safetyBuffer]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/expiration/dashboard?safetyBuffer=${safetyBuffer}`);
      // const data = await response.json();
      // setDashboardData(data);
      
      // Mock data with updated safety buffer
      setDashboardData(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          safetyBuffer,
        },
        riskCalculation: {
          ...prev.riskCalculation,
          safetyBuffer,
          criticalThreshold: -(prev.riskCalculation.avgReplenishmentTime + safetyBuffer),
        },
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load expiration dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSafetyBufferChange = (event: Event, newValue: number | number[]) => {
    setSafetyBuffer(newValue as number);
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              Priority Expiration Dashboard
            </Typography>
            <Chip 
              label="F&B CRITICAL" 
              color="error" 
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Real-time analysis of shelf life vs. replenishment lead times (TRLT)
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Safety Buffer Control & Risk Calculation */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Safety Buffer Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Adjust the safety buffer to change when items are flagged as at-risk
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={safetyBuffer}
                onChange={handleSafetyBufferChange}
                min={0}
                max={30}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 15, label: '15' },
                  { value: 30, label: '30 days' },
                ]}
                valueLabelDisplay="on"
                sx={{ flexGrow: 1 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Current: <strong>{safetyBuffer} days</strong>
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3,
              bgcolor: '#FFFBEB',
              border: '1px solid #FCD34D',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info sx={{ color: '#F59E0B' }} />
              <Typography variant="h6" fontWeight={600}>
                Risk Calculation Logic
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Replenishment Time (Avg):
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {dashboardData.riskCalculation.avgReplenishmentTime.toFixed(1)} Days
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Safety Buffer:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary">
                  +{dashboardData.riskCalculation.safetyBuffer} Days
                </Typography>
              </Box>
              <Box sx={{ height: 1, bgcolor: '#FCD34D', my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Critical Action Threshold:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="error">
                  {dashboardData.riskCalculation.criticalThreshold.toFixed(1)} Days
                </Typography>
              </Box>
            </Box>
            <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
              Items with shelf life below this threshold require immediate action
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      {/* Risk Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <RiskSummaryCard
            type="immediate"
            totalValue={dashboardData.summary.immediateRisk.totalValue}
            itemCount={dashboardData.summary.immediateRisk.itemCount}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <RiskSummaryCard
            type="projected"
            totalValue={dashboardData.summary.projectedRisk.totalValue}
            itemCount={dashboardData.summary.projectedRisk.itemCount}
            horizonDays={dashboardData.summary.projectedRisk.horizonDays}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Action Required Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          Action Required
        </Typography>
        <ActionRequiredTable />
      </Box>

      {/* Strategic Ordering Chart */}
      <Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          Strategic Ordering Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          TRLT (Total Replenishment Lead Time) vs. Shelf Life comparison
        </Typography>
        <StrategicOrderingChart />
      </Box>
    </Container>
  );
}
