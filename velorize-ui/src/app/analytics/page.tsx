'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  TrendingUp,
  Analytics as AnalyticsIcon,
  Assessment,
  PieChart,
  ShowChart,
  FilterList,
  Refresh,
  Download,
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
  PieChart as RechartsPie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { analyticsApi } from '../../lib/api/apiClient';
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ABCAnalysisItem {
  product_id: number;
  product_code: string;
  product_name: string;
  category: string;
  total_revenue: number;
  revenue_percentage: number;
  cumulative_percentage: number;
  classification: 'A' | 'B' | 'C';
  units_sold: number;
}

interface XYZAnalysisItem {
  product_id: number;
  product_code: string;
  product_name: string;
  coefficient_of_variation: number;
  classification: 'X' | 'Y' | 'Z';
  demand_variability: 'LOW' | 'MEDIUM' | 'HIGH';
  avg_demand: number;
  std_deviation: number;
}

interface MatrixItem {
  product_id: number;
  product_code: string;
  product_name: string;
  abc_classification: 'A' | 'B' | 'C';
  xyz_classification: 'X' | 'Y' | 'Z';
  matrix_classification: string;
  total_revenue: number;
  coefficient_of_variation: number;
  strategy_recommendation: string;
}

interface VelocityItem {
  product_id: number;
  product_code: string;
  product_name: string;
  turnover_ratio: number;
  velocity_classification: 'FAST' | 'MEDIUM' | 'SLOW';
  avg_inventory: number;
  total_usage: number;
  days_of_supply: number;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [period, setPeriod] = useState(90);

  const [abcData, setAbcData] = useState<ABCAnalysisItem[]>([]);
  const [xyzData, setXyzData] = useState<XYZAnalysisItem[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixItem[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityItem[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load all analytics data in parallel
      const [abc, xyz, matrix, velocity, profitability] = await Promise.all([
        analyticsApi.getABCAnalysis(period),
        analyticsApi.getXYZAnalysis(period),
        analyticsApi.getABCXYZMatrix(period),
        analyticsApi.getVelocityAnalysis(period),
        analyticsApi.getProfitabilityAnalysis(period),
      ]);

      setAbcData(abc?.items || []);
      setXyzData(xyz?.items || []);
      setMatrixData(matrix?.matrix_items || []);
      setVelocityData(velocity?.items || []);
      setProfitabilityData(profitability?.items || []);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
      
      // Fallback sample data
      const sampleABC: ABCAnalysisItem[] = [
        {
          product_id: 1, product_code: 'PRD-001', product_name: 'Nasi Lemak Sauce', category: 'SAUCE',
          total_revenue: 45000, revenue_percentage: 35, cumulative_percentage: 35, classification: 'A', units_sold: 5294
        },
        {
          product_id: 2, product_code: 'PRD-002', product_name: 'Coconut Milk Powder', category: 'INGREDIENT',
          total_revenue: 38000, revenue_percentage: 30, cumulative_percentage: 65, classification: 'A', units_sold: 3167
        },
        {
          product_id: 3, product_code: 'PRD-003', product_name: 'Rendang Curry Paste', category: 'SEASONING',
          total_revenue: 25000, revenue_percentage: 20, cumulative_percentage: 85, classification: 'B', units_sold: 1582
        }
      ];
      
      setAbcData(sampleABC);
    } finally {
      setLoading(false);
    }
  };

  const abcColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    { field: 'category', headerName: 'Category', width: 120 },
    { 
      field: 'total_revenue', 
      headerName: 'Revenue', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'revenue_percentage', 
      headerName: 'Revenue %', 
      width: 100,
      renderCell: (params) => `${params.value.toFixed(1)}%`
    },
    { 
      field: 'cumulative_percentage', 
      headerName: 'Cumulative %', 
      width: 120,
      renderCell: (params) => `${params.value.toFixed(1)}%`
    },
    {
      field: 'classification',
      headerName: 'Class',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'A' ? 'success' : 
            params.value === 'B' ? 'warning' : 'error'
          }
          size="small"
        />
      ),
    },
    { field: 'units_sold', headerName: 'Units Sold', width: 100, type: 'number' },
  ];

  const xyzColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    { 
      field: 'coefficient_of_variation', 
      headerName: 'CV', 
      width: 100,
      renderCell: (params) => `${(params.value * 100).toFixed(1)}%`
    },
    {
      field: 'classification',
      headerName: 'Class',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'X' ? 'success' : 
            params.value === 'Y' ? 'warning' : 'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'demand_variability',
      headerName: 'Variability',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'LOW' ? 'success' : 
            params.value === 'MEDIUM' ? 'warning' : 'error'
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    { field: 'avg_demand', headerName: 'Avg Demand', width: 120, type: 'number' },
  ];

  const matrixColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    {
      field: 'abc_classification',
      headerName: 'ABC',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'A' ? 'success' : 
            params.value === 'B' ? 'warning' : 'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'xyz_classification',
      headerName: 'XYZ',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'X' ? 'success' : 
            params.value === 'Y' ? 'warning' : 'error'
          }
          size="small"
        />
      ),
    },
    { field: 'matrix_classification', headerName: 'Matrix', width: 100 },
    { field: 'strategy_recommendation', headerName: 'Strategy', width: 200, flex: 1 },
  ];

  const velocityColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    { 
      field: 'turnover_ratio', 
      headerName: 'Turnover Ratio', 
      width: 120,
      renderCell: (params) => `${params.value.toFixed(2)}x`
    },
    {
      field: 'velocity_classification',
      headerName: 'Velocity',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'FAST' ? 'success' : 
            params.value === 'MEDIUM' ? 'warning' : 'error'
          }
          size="small"
        />
      ),
    },
    { field: 'days_of_supply', headerName: 'Days of Supply', width: 120, type: 'number' },
    { field: 'avg_inventory', headerName: 'Avg Inventory', width: 120, type: 'number' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const abcChartData = abcData.map(item => ({
    name: item.product_code,
    revenue: item.total_revenue,
    percentage: item.revenue_percentage,
    classification: item.classification
  }));

  const distributionData = [
    { name: 'Class A', value: abcData.filter(item => item.classification === 'A').length, color: '#4CAF50' },
    { name: 'Class B', value: abcData.filter(item => item.classification === 'B').length, color: '#FF9800' },
    { name: 'Class C', value: abcData.filter(item => item.classification === 'C').length, color: '#F44336' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Analytics & Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Advanced inventory analytics with ABC/XYZ classification and demand forecasting
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
            onClick={loadAnalyticsData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => toast.info('Export functionality coming soon')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Analytics Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp />
                  ABC Analysis
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShowChart />
                  XYZ Analysis
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment />
                  ABC-XYZ Matrix
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon />
                  Velocity Analysis
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PieChart />
                  Profitability
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* ABC Analysis Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* ABC Charts */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Distribution by Product
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={abcChartData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? `RM ${value.toLocaleString()}` : `${value}%`,
                          name === 'revenue' ? 'Revenue' : 'Percentage'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#2196F3" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ABC Classification Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Tooltip />
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* ABC Data Grid */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ABC Analysis Results
                  </Typography>
                  <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                      rows={abcData}
                      columns={abcColumns}
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

        {/* XYZ Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                XYZ analysis classifies products based on demand variability. X = predictable demand, Y = variable demand, Z = highly unpredictable demand.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    XYZ Analysis Results
                  </Typography>
                  <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                      rows={xyzData}
                      columns={xyzColumns}
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

        {/* ABC-XYZ Matrix Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                The ABC-XYZ matrix combines revenue importance with demand predictability to create strategic categories for inventory management.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ABC-XYZ Matrix Analysis
                  </Typography>
                  <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                      rows={matrixData}
                      columns={matrixColumns}
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

        {/* Velocity Analysis Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Velocity analysis measures how quickly inventory turns over. Higher velocity indicates faster-moving products.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Inventory Velocity Analysis
                  </Typography>
                  <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                      rows={velocityData}
                      columns={velocityColumns}
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

        {/* Profitability Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Profitability analysis helps identify which products contribute most to your bottom line.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Product Profitability Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coming soon - detailed profitability metrics and margin analysis
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