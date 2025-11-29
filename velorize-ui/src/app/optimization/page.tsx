'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import {
  ViewModule,
  ViewList,
  FileDownloadOutlined,
  FilterList
} from '@mui/icons-material';
import { optimizationApi } from '../../lib/api/apiClient';
import { ProductProjection, ProductProjectionCard } from '../../components/optimization/ProductProjectionCard';
import { ProjectionTable } from '../../components/optimization/ProjectionTable';
import { ProductAnalysisDrawer } from '../../components/optimization/ProductAnalysisDrawer';
import toast from 'react-hot-toast';

// Mock Trajectory Generator (Since backend doesn't provide full trajectory yet)
const generateMockTrajectory = (baseValue: number) => {
  const trajectory = [];
  let currentSoh = baseValue;
  for (let i = 0; i < 4; i++) {
    const forecast = Math.floor(Math.random() * 50) + 20;
    const incoming = i === 1 || i === 3 ? Math.floor(Math.random() * 100) + 50 : 0;
    currentSoh = currentSoh - forecast + incoming;
    trajectory.push({
      period: `M${i}`,
      forecast,
      incoming,
      projectedSoh: Math.max(0, currentSoh)
    });
  }
  return trajectory;
};

export default function OptimizationPage() {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductProjection[]>([]);
  const [allProducts, setAllProducts] = useState<ProductProjection[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProjection | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    category: [] as string[],
  });

  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = async () => {
    try {
      setLoading(true);
      
      // fetch existing endpoints
      const stockRec = await optimizationApi.getStockRecommendations();
      
      // Transform to new UI format
      const transformedProducts: ProductProjection[] = (stockRec?.recommendations || []).map((rec: any) => {
        // Determine status based on urgency/action
        let status: 'EXCESS' | 'OPTIMAL' | 'LOW STOCK' | 'STOCK OUT' = 'OPTIMAL';
        if (rec.urgency === 'CRITICAL' && rec.current_stock <= 0) status = 'STOCK OUT';
        else if (rec.urgency === 'HIGH' || rec.recommended_action === 'INCREASE') status = 'LOW STOCK';
        else if (rec.recommended_action === 'DECREASE') status = 'EXCESS';

        return {
          sku: rec.product_code,
          name: rec.product_name,
          category: 'General', // API doesn't provide category yet
          status: status,
          metrics: {
            soh: rec.current_stock,
            coverage: Math.floor(Math.random() * 120) + 10, // Mock coverage
            nextDemand: Math.floor(Math.random() * 100) + 20 // Mock next demand
          },
          parameters: {
            safetyStock: Math.floor(rec.current_stock * 0.2),
            reorderPoint: Math.floor(rec.current_stock * 0.3),
            projectedM3Stock: Math.floor(rec.current_stock * 0.8)
          },
          trajectory: generateMockTrajectory(rec.current_stock)
        };
      });

      // If no data (first run), add some mock data for UI visualization
      if (transformedProducts.length === 0) {
        transformedProducts.push(
          {
            sku: 'TEA-001',
            name: 'Earl Grey Premium',
            category: 'Tea',
            status: 'EXCESS',
            metrics: { soh: 100, coverage: 120, nextDemand: 20 },
            parameters: { safetyStock: 20, reorderPoint: 30, projectedM3Stock: 80 },
            trajectory: generateMockTrajectory(100)
          },
          {
            sku: 'COF-101',
            name: 'Arabica Dark Roast',
            category: 'Coffee',
            status: 'OPTIMAL',
            metrics: { soh: 800, coverage: 160, nextDemand: 150 },
            parameters: { safetyStock: 100, reorderPoint: 200, projectedM3Stock: 520 },
            trajectory: generateMockTrajectory(800)
          },
          {
            sku: 'HERB-005',
            name: 'Dried Basil',
            category: 'Herbs',
            status: 'LOW STOCK',
            metrics: { soh: 15, coverage: 5, nextDemand: 40 },
            parameters: { safetyStock: 20, reorderPoint: 50, projectedM3Stock: 5 },
            trajectory: generateMockTrajectory(15)
          }
        );
      }

      setProducts(transformedProducts);
      setAllProducts(transformedProducts);
    } catch (error) {
      console.error('Failed to load optimization data:', error);
      toast.error('Failed to load optimization data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterOpen = () => {
    setFilterDialogOpen(true);
  };

  const handleFilterApply = () => {
    let filtered = [...allProducts];
    
    if (filters.status.length > 0) {
      filtered = filtered.filter(p => filters.status.includes(p.status));
    }
    
    if (filters.category.length > 0) {
      filtered = filtered.filter(p => filters.category.includes(p.category));
    }
    
    setProducts(filtered);
    setFilterDialogOpen(false);
    toast.success(`Filtered to ${filtered.length} products`);
  };

  const handleFilterReset = () => {
    setFilters({ status: [], category: [] });
    setProducts(allProducts);
    setFilterDialogOpen(false);
    toast.success('Filters reset');
  };

  const handleExportCSV = () => {
    try {
      const headers = ['SKU', 'Product Name', 'Category', 'Status', 'SOH', 'Coverage (Days)', 'Next Demand', 'Safety Stock', 'Reorder Point'];
      const rows = products.map(p => [
        p.sku,
        p.name,
        p.category,
        p.status,
        p.metrics.soh,
        p.metrics.coverage,
        p.metrics.nextDemand,
        p.parameters.safetyStock,
        p.parameters.reorderPoint,
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `inventory-projection-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleProductClick = (product: ProductProjection) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const handleSaveParameters = async (sku: string, safetyStock: number, reorderPoint: number) => {
    // In a real app, call API to save
    // await optimizationApi.updateParameters(sku, { safetyStock, reorderPoint });
    
    // Update local state for immediate feedback
    setProducts(prev => prev.map(p => {
      if (p.sku === sku) {
        return {
          ...p,
          parameters: {
            ...p.parameters,
            safetyStock,
            reorderPoint
          }
        };
      }
      return p;
    }));
    
    toast.success(`Parameters updated for ${sku}`);
    setDrawerOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Row */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Inventory Projection Matrix
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize stock health, incoming supply, and projected inventory levels.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<FilterList />} onClick={handleFilterOpen}>
            Filters
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, v) => v && setViewMode(v)}
            size="small"
            sx={{ bgcolor: 'white' }}
          >
            <ToggleButton value="list">
              <ViewList />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModule />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {viewMode === 'card' ? (
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid 
                  item 
                  xs={12} 
                  md={6} 
                  lg={4} 
                  key={product.sku} 
                  onClick={() => handleProductClick(product)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ProductProjectionCard product={product} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ProjectionTable 
              products={products} 
              onProductClick={handleProductClick}
            />
          )}
        </>
      )}

      <ProductAnalysisDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        product={selectedProduct}
        onSave={handleSaveParameters}
      />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Products</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Status
            </Typography>
            <FormGroup>
              {['EXCESS', 'OPTIMAL', 'LOW STOCK', 'STOCK OUT'].map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                        } else {
                          setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                        }
                      }}
                    />
                  }
                  label={status}
                />
              ))}
            </FormGroup>
          </FormControl>

          <FormControl fullWidth>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Category
            </Typography>
            <FormGroup>
              {['Tea', 'Coffee', 'Herbs', 'General'].map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={filters.category.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, category: [...prev.category, category] }));
                        } else {
                          setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== category) }));
                        }
                      }}
                    />
                  }
                  label={category}
                />
              ))}
            </FormGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Reset</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFilterApply} variant="contained">Apply Filters</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}