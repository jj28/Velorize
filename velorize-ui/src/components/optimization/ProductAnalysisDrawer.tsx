import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { Close, Refresh, Save, TrendingUp } from '@mui/icons-material';
import { TrajectoryChart } from '../charts/TrajectoryChart';
import { ProductProjection } from './ProductProjectionCard';

interface ProductAnalysisDrawerProps {
  open: boolean;
  onClose: () => void;
  product: ProductProjection | null;
  onSave: (sku: string, safetyStock: number, reorderPoint: number) => Promise<void>;
}

export const ProductAnalysisDrawer: React.FC<ProductAnalysisDrawerProps> = ({
  open,
  onClose,
  product,
  onSave
}) => {
  const [safetyStock, setSafetyStock] = useState<number>(0);
  const [reorderPoint, setReorderPoint] = useState<number>(0);
  const [simulatedTrajectory, setSimulatedTrajectory] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (product) {
      setSafetyStock(product.parameters.safetyStock);
      setReorderPoint(product.parameters.reorderPoint);
      setSimulatedTrajectory(product.trajectory);
      setIsDirty(false);
    }
  }, [product]);

  useEffect(() => {
    if (product && (safetyStock !== product.parameters.safetyStock || reorderPoint !== product.parameters.reorderPoint)) {
      setIsDirty(true);
      // Simple client-side simulation: 
      // Updating Reorder Point would realistically trigger earlier orders, 
      // but for visualization we'll just mark it as "Modified" for now
      // or we could adjust the "Incoming" bars logic if we had the full logic here.
    } else {
      setIsDirty(false);
    }
  }, [safetyStock, reorderPoint, product]);

  const handleSave = async () => {
    if (product) {
      await onSave(product.sku, safetyStock, reorderPoint);
      setIsDirty(false);
    }
  };

  if (!product) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', md: 600, lg: 800 } }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #EAECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" sx={{ bgcolor: '#F2F4F7', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600, color: '#475467' }}>
                {product.sku}
              </Typography>
              <Chip 
                label={product.status} 
                size="small" 
                color={product.status === 'OPTIMAL' ? 'success' : product.status === 'EXCESS' ? 'warning' : 'error'}
                sx={{ height: 24, fontWeight: 600 }}
              />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Category: {product.category}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    CURRENT STOCK
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                    {product.metrics.soh}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    COVERAGE
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }} color={product.metrics.coverage > 60 ? 'warning.main' : 'text.primary'}>
                    {product.metrics.coverage.toFixed(1)}d
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    NEXT DEMAND
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                    {product.metrics.nextDemand}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Trajectory Chart */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Inventory & Coverage Trajectory
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Projected inventory levels based on current forecast and incoming supply.
            </Typography>
            <Box sx={{ height: 400, bgcolor: '#F9FAFB', borderRadius: 2, p: 2, border: '1px solid #EAECF0' }}>
              <TrajectoryChart 
                data={simulatedTrajectory} 
                height={360} 
                safetyStock={safetyStock}
                reorderPoint={reorderPoint}
              />
            </Box>
          </Box>

          {/* Parameters & Simulation */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Planning Parameters
              </Typography>
              {isDirty && (
                <Chip label="Modified" color="warning" size="small" />
              )}
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Safety Stock"
                  type="number"
                  fullWidth
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(Number(e.target.value))}
                  helperText="Buffer stock to prevent stockouts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Reorder Point"
                  type="number"
                  fullWidth
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Number(e.target.value))}
                  helperText="Inventory level that triggers a new order"
                />
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              Adjusting these parameters will update the recommended order quantities in the next planning cycle.
            </Alert>
          </Box>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 3, borderTop: '1px solid #EAECF0', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#F9FAFB' }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
