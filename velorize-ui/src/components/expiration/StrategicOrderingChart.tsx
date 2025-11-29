import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';

interface ProductTRLTData {
  productId: number;
  productCode: string;
  productName: string;
  trlt: number; // Lead time in days
  shelfLife: number; // Total shelf life in days
  trltRatio: number; // TRLT / Shelf Life
  riskZone: 'RED' | 'YELLOW' | 'GREEN';
  nearExpiryValue: number;
}

export function StrategicOrderingChart() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductTRLTData[]>([]);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/expiration/strategic-ordering');
      // const data = await response.json();
      // setData(data.products);

      // Mock data
      const mockData: ProductTRLTData[] = [
        {
          productId: 1,
          productCode: 'PRD-001',
          productName: 'Nasi Lemak Sauce',
          trlt: 15,
          shelfLife: 180,
          trltRatio: 0.083,
          riskZone: 'GREEN',
          nearExpiryValue: 0,
        },
        {
          productId: 2,
          productCode: 'PRD-002',
          productName: 'Coconut Milk Powder',
          trlt: 10,
          shelfLife: 365,
          trltRatio: 0.027,
          riskZone: 'GREEN',
          nearExpiryValue: 0,
        },
        {
          productId: 3,
          productCode: 'PRD-003',
          productName: 'Rendang Curry Paste',
          trlt: 12,
          shelfLife: 90,
          trltRatio: 0.133,
          riskZone: 'YELLOW',
          nearExpiryValue: 338,
        },
        {
          productId: 4,
          productCode: 'PRD-004',
          productName: 'Palm Oil',
          trlt: 18,
          shelfLife: 120,
          trltRatio: 0.15,
          riskZone: 'YELLOW',
          nearExpiryValue: 175,
        },
        {
          productId: 5,
          productCode: 'PRD-005',
          productName: 'Laksa Paste',
          trlt: 14,
          shelfLife: 60,
          trltRatio: 0.233,
          riskZone: 'RED',
          nearExpiryValue: 450,
        },
        {
          productId: 6,
          productCode: 'PRD-006',
          productName: 'Coconut Cream',
          trlt: 8,
          shelfLife: 30,
          trltRatio: 0.267,
          riskZone: 'RED',
          nearExpiryValue: 240,
        },
        {
          productId: 7,
          productCode: 'PRD-007',
          productName: 'Tamarind Paste',
          trlt: 16,
          shelfLife: 240,
          trltRatio: 0.067,
          riskZone: 'GREEN',
          nearExpiryValue: 0,
        },
        {
          productId: 8,
          productCode: 'PRD-008',
          productName: 'Belacan (Shrimp Paste)',
          trlt: 20,
          shelfLife: 150,
          trltRatio: 0.133,
          riskZone: 'YELLOW',
          nearExpiryValue: 125,
        },
        {
          productId: 9,
          productCode: 'PRD-009',
          productName: 'Kecap Manis',
          trlt: 9,
          shelfLife: 300,
          trltRatio: 0.03,
          riskZone: 'GREEN',
          nearExpiryValue: 0,
        },
        {
          productId: 10,
          productCode: 'PRD-010',
          productName: 'Fish Sauce Premium',
          trlt: 13,
          shelfLife: 45,
          trltRatio: 0.289,
          riskZone: 'RED',
          nearExpiryValue: 185,
        },
      ];

      setData(mockData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      toast.error('Failed to load strategic ordering chart');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskZone: string) => {
    switch (riskZone) {
      case 'RED':
        return '#DC2626';
      case 'YELLOW':
        return '#F59E0B';
      case 'GREEN':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, boxShadow: 3, maxWidth: 300 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {data.productName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {data.productCode}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption">
              <strong>TRLT:</strong> {data.trlt} days
            </Typography>
            <Typography variant="caption">
              <strong>Shelf Life:</strong> {data.shelfLife} days
            </Typography>
            <Typography variant="caption">
              <strong>TRLT Ratio:</strong> {(data.trltRatio * 100).toFixed(1)}%
            </Typography>
            {data.nearExpiryValue > 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                <strong>At Risk:</strong> ${data.nearExpiryValue}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${data.riskZone} ZONE`}
            size="small"
            sx={{
              bgcolor: getRiskColor(data.riskZone),
              color: '#FFFFFF',
              fontWeight: 600,
              mt: 1,
            }}
          />
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#10B981' }} />
          <Typography variant="caption">
            <strong>Green Zone:</strong> Strategic ordering window available
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#F59E0B' }} />
          <Typography variant="caption">
            <strong>Yellow Zone:</strong> Requires careful planning
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#DC2626' }} />
          <Typography variant="caption">
            <strong>Red Zone:</strong> Operationally difficult items
          </Typography>
        </Box>
      </Box>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 60,
            left: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            type="number"
            dataKey="trlt"
            name="TRLT (Lead Time)"
            unit=" days"
            label={{
              value: 'Total Replenishment Lead Time (Days)',
              position: 'bottom',
              offset: 40,
              style: { fontSize: 12, fill: '#64748B', fontWeight: 600 },
            }}
            stroke="#64748B"
          />
          <YAxis
            type="number"
            dataKey="shelfLife"
            name="Shelf Life"
            unit=" days"
            label={{
              value: 'Shelf Life (Days)',
              angle: -90,
              position: 'left',
              offset: 40,
              style: { fontSize: 12, fill: '#64748B', fontWeight: 600 },
            }}
            stroke="#64748B"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Reference lines for risk zones */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 30, y: 200 }]}
            stroke="#F59E0B"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Warning Threshold',
              position: 'top',
              fill: '#F59E0B',
              fontSize: 10,
            }}
          />
          
          <Scatter name="Products" data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskZone)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 3, mt: 3, justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#DC2626">
            {data.filter((d) => d.riskZone === 'RED').length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            High Risk Items
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F59E0B">
            {data.filter((d) => d.riskZone === 'YELLOW').length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Medium Risk Items
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#10B981">
            {data.filter((d) => d.riskZone === 'GREEN').length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Safe Items
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
