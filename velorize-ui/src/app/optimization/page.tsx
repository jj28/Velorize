'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Tune,
  TrendingUp,
  Inventory,
  Assessment,
  Refresh,
  Download,
  Calculate,
  Speed,
  Insights,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { optimizationApi } from '../../lib/api/apiClient';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`optimization-tabpanel-${index}`}
      aria-labelledby={`optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface EOQResult {
  product_id: number;
  product_code: string;
  product_name: string;
  eoq_quantity: number;
  current_order_quantity: number;
  annual_demand: number;
  ordering_cost: number;
  holding_cost_per_unit: number;
  total_cost_current: number;
  total_cost_eoq: number;
  potential_savings: number;
  savings_percentage: number;
}

interface ReorderPoint {
  product_id: number;
  product_code: string;
  product_name: string;
  current_reorder_level: number;
  optimized_reorder_point: number;
  lead_time_days: number;
  safety_stock: number;
  average_demand: number;
  demand_variability: number;
  service_level: number;
  stockout_risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface StockRecommendation {
  product_id: number;
  product_code: string;
  product_name: string;
  current_stock: number;
  recommended_action: 'INCREASE' | 'DECREASE' | 'MAINTAIN';
  recommended_quantity: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  potential_impact: string;
  cost_impact: number;
}

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(90);

  const [eoqData, setEoqData] = useState<EOQResult[]>([]);
  const [reorderData, setReorderData] = useState<ReorderPoint[]>([]);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [optimizationSummary, setOptimizationSummary] = useState<any>(null);

  useEffect(() => {
    loadOptimizationData();
  }, [period]);

  const loadOptimizationData = async () => {
    try {
      setLoading(true);
      
      const [eoq, reorder, stockRec, summary] = await Promise.all([
        optimizationApi.getEOQAnalysis({ analysis_period_days: period }),
        optimizationApi.getReorderPoints({ analysis_period_days: period }),
        optimizationApi.getStockRecommendations(),
        optimizationApi.getSummary(),
      ]);

      setEoqData(eoq?.results || []);
      setReorderData(reorder?.results || []);
      setRecommendations(stockRec?.recommendations || []);
      setOptimizationSummary(summary);
      
    } catch (error) {
      console.error('Failed to load optimization data:', error);
      toast.error('Failed to load optimization data');
      
      // Sample data fallback
      const sampleEOQ: EOQResult[] = [
        {
          product_id: 1,
          product_code: 'PRD-001',
          product_name: 'Nasi Lemak Sauce',
          eoq_quantity: 150,
          current_order_quantity: 200,
          annual_demand: 3000,
          ordering_cost: 50,
          holding_cost_per_unit: 2.5,
          total_cost_current: 8500,
          total_cost_eoq: 7800,
          potential_savings: 700,
          savings_percentage: 8.2,
        },
        {
          product_id: 2,
          product_code: 'PRD-002',
          product_name: 'Coconut Milk Powder',
          eoq_quantity: 120,
          current_order_quantity: 100,
          annual_demand: 2400,
          ordering_cost: 45,
          holding_cost_per_unit: 3.2,
          total_cost_current: 7200,
          total_cost_eoq: 6950,
          potential_savings: 250,
          savings_percentage: 3.5,
        },
      ];

      const sampleReorder: ReorderPoint[] = [
        {
          product_id: 1,
          product_code: 'PRD-001',
          product_name: 'Nasi Lemak Sauce',
          current_reorder_level: 100,
          optimized_reorder_point: 120,
          lead_time_days: 7,
          safety_stock: 35,
          average_demand: 12,
          demand_variability: 0.25,
          service_level: 95,
          stockout_risk: 'LOW',
        },
      ];

      setEoqData(sampleEOQ);
      setReorderData(sampleReorder);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, any> = {
      'LOW': 'success',
      'MEDIUM': 'warning',
      'HIGH': 'error',
      'CRITICAL': 'error',
    };
    return colors[urgency] || 'default';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, any> = {
      'INCREASE': 'success',
      'DECREASE': 'warning',
      'MAINTAIN': 'info',
    };
    return colors[action] || 'default';
  };

  const eoqColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    { field: 'current_order_quantity', headerName: 'Current Order Qty', width: 140, type: 'number' },
    { field: 'eoq_quantity', headerName: 'EOQ Quantity', width: 120, type: 'number' },
    { field: 'annual_demand', headerName: 'Annual Demand', width: 120, type: 'number' },
    { 
      field: 'total_cost_current', 
      headerName: 'Current Cost', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'total_cost_eoq', 
      headerName: 'EOQ Cost', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'potential_savings', 
      headerName: 'Savings', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'savings_percentage', 
      headerName: 'Savings %', 
      width: 100,
      renderCell: (params) => `${params.value.toFixed(1)}%`
    },
  ];

  const reorderColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    { field: 'current_reorder_level', headerName: 'Current Level', width: 120, type: 'number' },
    { field: 'optimized_reorder_point', headerName: 'Optimized Point', width: 140, type: 'number' },
    { field: 'safety_stock', headerName: 'Safety Stock', width: 120, type: 'number' },
    { field: 'lead_time_days', headerName: 'Lead Time (Days)', width: 130, type: 'number' },
    { 
      field: 'service_level', 
      headerName: 'Service Level', 
      width: 120,
      renderCell: (params) => `${params.value}%`
    },
    {
      field: 'stockout_risk',
      headerName: 'Stockout Risk',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getUrgencyColor(params.value)}
          size="small"
        />
      ),
    },
  ];

  const recommendationColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    { field: 'current_stock', headerName: 'Current Stock', width: 120, type: 'number' },
    {
      field: 'recommended_action',
      headerName: 'Action',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getActionColor(params.value)}
          size="small"
        />
      ),
    },
    { field: 'recommended_quantity', headerName: 'Recommended Qty', width: 150, type: 'number' },
    {
      field: 'urgency',
      headerName: 'Urgency',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getUrgencyColor(params.value)}
          size="small"
        />
      ),
    },
    { field: 'reason', headerName: 'Reason', width: 300, flex: 1 },
    { 
      field: 'cost_impact', 
      headerName: 'Cost Impact', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
  ];

  // Chart data for EOQ visualization
  const eoqChartData = eoqData.slice(0, 10).map(item => ({
    name: item.product_code,
    current: item.current_order_quantity,
    eoq: item.eoq_quantity,
    savings: item.potential_savings,
  }));

  // Chart data for cost comparison
  const costChartData = eoqData.slice(0, 8).map(item => ({
    name: item.product_code,
    currentCost: item.total_cost_current,
    eoqCost: item.total_cost_eoq,
    savings: item.potential_savings,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Inventory Optimization
          </Typography>
          <Typography variant="body1" color="text.secondary">
            EOQ analysis, reorder point optimization, and intelligent stock recommendations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Analysis Period"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
            <MenuItem value={180}>Last 180 Days</MenuItem>
            <MenuItem value={365}>Last 1 Year</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadOptimizationData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => toast.info('Export functionality coming soon')}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {optimizationSummary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Calculate sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  RM {optimizationSummary.total_potential_savings?.toLocaleString() || '15,420'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Potential Savings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Speed sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {optimizationSummary.optimization_opportunities || 28}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Optimization Opportunities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Inventory sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {optimizationSummary.products_analyzed || 45}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Products Analyzed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Insights sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {optimizationSummary.average_efficiency_improvement || '12.5'}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Efficiency Improvement
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Optimization Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calculate />
                  EOQ Analysis
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory />
                  Reorder Points
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tune />
                  Stock Recommendations
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp />
                  Optimization Insights
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* EOQ Analysis Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Economic Order Quantity (EOQ) analysis helps minimize total inventory costs by finding the optimal order quantity.
              </Alert>
            </Grid>

            {/* EOQ Charts */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current vs EOQ Order Quantities
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eoqChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#FF9800" name="Current Order Qty" />
                      <Bar dataKey="eoq" fill="#2196F3" name="EOQ Quantity" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Comparison & Savings
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={costChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="currentCost" fill="#F44336" name="Current Cost" />
                      <Bar dataKey="eoqCost" fill="#4CAF50" name="EOQ Cost" />
                      <Line type="monotone" dataKey="savings" stroke="#FF9800" name="Savings" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* EOQ Data Grid */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    EOQ Analysis Results
                  </Typography>
                  <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                      rows={eoqData}
                      columns={eoqColumns}
                      loading={loading}
                      pageSize={25}
                      rowsPerPageOptions={[10, 25, 50]}
                      disableSelectionOnClick
                      sx={{
                        border: 0,
                        '& .MuiDataGrid-cell:focus': {
                          outline: 'none',
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Reorder Points Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Optimized reorder points consider lead time, demand variability, and desired service level to minimize stockouts.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Reorder Point Optimization
                  </Typography>
                  <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                      rows={reorderData}
                      columns={reorderColumns}
                      loading={loading}
                      pageSize={25}
                      rowsPerPageOptions={[10, 25, 50]}
                      disableSelectionOnClick
                      sx={{
                        border: 0,
                        '& .MuiDataGrid-cell:focus': {
                          outline: 'none',
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Stock Recommendations Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                AI-powered stock recommendations based on demand patterns, seasonality, and business constraints.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Intelligent Stock Recommendations
                  </Typography>
                  <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                      rows={recommendations}
                      columns={recommendationColumns}
                      loading={loading}
                      pageSize={25}
                      rowsPerPageOptions={[10, 25, 50]}
                      disableSelectionOnClick
                      sx={{
                        border: 0,
                        '& .MuiDataGrid-cell:focus': {
                          outline: 'none',
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Optimization Insights Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Comprehensive optimization insights combining EOQ, reorder points, and ABC-XYZ classification.
              </Alert>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Optimization Impact Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Overall impact of implementing optimization recommendations
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary.main">
                        15.2%
                      </Typography>
                      <Typography variant="body2">
                        Average Cost Reduction
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h4" color="success.main">
                        98.5%
                      </Typography>
                      <Typography variant="body2">
                        Target Service Level
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Optimization Metrics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Performance indicators for optimization effectiveness
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h4" color="warning.main">
                        28
                      </Typography>
                      <Typography variant="body2">
                        Products to Optimize
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h4" color="info.main">
                        45 days
                      </Typography>
                      <Typography variant="body2">
                        Avg Days of Supply
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Implementation Roadmap
                  </Typography>
                  <Typography variant="body1" paragraph>
                    To implement these optimization recommendations effectively:
                  </Typography>
                  <Typography variant="body2" component="ul">
                    <li>Start with Class A products (highest revenue impact)</li>
                    <li>Implement EOQ recommendations for products with highest savings potential</li>
                    <li>Adjust reorder points for products with high stockout risk</li>
                    <li>Monitor performance for 2-3 cycles before making additional adjustments</li>
                    <li>Review and update parameters quarterly based on actual performance</li>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Container>
  );
}