import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Grid, Divider } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { TrajectoryChart, TrajectoryDataPoint } from '../charts/TrajectoryChart';

export interface ProductProjection {
  sku: string;
  name: string;
  category: string;
  status: 'EXCESS' | 'OPTIMAL' | 'LOW STOCK' | 'STOCK OUT';
  metrics: {
    soh: number;
    coverage: number;
    nextDemand: number;
  };
  parameters: {
    safetyStock: number;
    reorderPoint: number;
    projectedM3Stock: number;
  };
  trajectory: TrajectoryDataPoint[];
}

interface ProductProjectionCardProps {
  product: ProductProjection;
}

export const ProductProjectionCard: React.FC<ProductProjectionCardProps> = ({ product }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCESS': return 'warning';
      case 'OPTIMAL': return 'success';
      case 'LOW STOCK': return 'error';
      case 'STOCK OUT': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ bgcolor: '#F2F4F7', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600, color: '#475467' }}>
                {product.sku}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {product.category}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {product.name}
            </Typography>
          </Box>
          <Chip 
            label={product.status} 
            color={getStatusColor(product.status)} 
            size="small" 
            icon={<TrendingUp />}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Key Metrics Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
              SOH
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {product.metrics.soh}
            </Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'center', borderLeft: '1px solid #EAECF0', borderRight: '1px solid #EAECF0' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
              COVERAGE
            </Typography>
            <Typography variant="h6" fontWeight={700} color={product.metrics.coverage > 60 ? 'warning.main' : 'text.primary'}>
              {product.metrics.coverage}d
            </Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
              NEXT DEMAND
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {product.metrics.nextDemand}
            </Typography>
          </Grid>
        </Grid>

        {/* Chart Area */}
        <Box sx={{ height: 160, mb: 2 }}>
          <TrajectoryChart data={product.trajectory} height={160} mini />
        </Box>
        
        {/* Legend / Chart Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: '#10B981' }} />
            <Typography variant="caption" color="text.secondary">Incoming</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 2, bgcolor: '#2563EB' }} />
            <Typography variant="caption" color="text.secondary">Proj. SOH</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Footer Parameters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px', fontWeight: 600 }}>
              SAFETY STOCK
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {product.parameters.safetyStock}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px', fontWeight: 600 }}>
              REORDER PT
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {product.parameters.reorderPoint}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px', fontWeight: 600 }}>
              PROJ. M3 STOCK
            </Typography>
            <Typography variant="body2" fontWeight={700} color={product.parameters.projectedM3Stock < product.parameters.safetyStock ? 'error.main' : 'text.primary'}>
              {product.parameters.projectedM3Stock}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
