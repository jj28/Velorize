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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  Add,
  Refresh,
  Download,
  PlayArrow,
  Assessment,
  Timeline,
  Delete,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { forecastingApi, productsApi } from '../../lib/api/apiClient';
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
      id={`forecast-tabpanel-${index}`}
      aria-labelledby={`forecast-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface Forecast {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  forecast_method: string;
  forecast_horizon_days: number;
  forecast_date: string;
  actual_demand?: number;
  predicted_demand: number;
  confidence_lower: number;
  confidence_upper: number;
  accuracy_score?: number;
  status: string;
  created_at: string;
}

interface ForecastAccuracy {
  product_id: number;
  product_code: string;
  product_name: string;
  forecast_method: string;
  mae: number;
  mape: number;
  rmse: number;
  accuracy_percentage: number;
  evaluation_periods: number;
}

export default function ForecastingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [accuracy, setAccuracy] = useState<ForecastAccuracy[]>([]);
  const [loading, setLoading] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form states for forecast generation
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecastMethod, setForecastMethod] = useState('SARIMA');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  useEffect(() => {
    loadForecastingData();
    loadProducts();
  }, []);

  const loadForecastingData = async () => {
    try {
      setLoading(true);
      
      const [forecastsData, accuracyData] = await Promise.all([
        forecastingApi.getForecasts(),
        forecastingApi.getAccuracy(),
      ]);

      setForecasts(forecastsData || []);
      setAccuracy(accuracyData || []);
      
    } catch (error) {
      console.error('Failed to load forecasting data:', error);
      toast.error('Failed to load forecasting data');
      
      // Sample data fallback
      const sampleForecasts: Forecast[] = [
        {
          id: 1,
          product_id: 1,
          product_code: 'PRD-001',
          product_name: 'Nasi Lemak Sauce',
          forecast_method: 'SARIMA',
          forecast_horizon_days: 30,
          forecast_date: '2024-02-01',
          actual_demand: 285,
          predicted_demand: 275,
          confidence_lower: 245,
          confidence_upper: 305,
          accuracy_score: 96.5,
          status: 'COMPLETED',
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          product_id: 2,
          product_code: 'PRD-002',
          product_name: 'Coconut Milk Powder',
          forecast_method: 'EXPONENTIAL_SMOOTHING',
          forecast_horizon_days: 30,
          forecast_date: '2024-02-01',
          predicted_demand: 180,
          confidence_lower: 165,
          confidence_upper: 195,
          status: 'ACTIVE',
          created_at: '2024-01-15T00:00:00Z',
        },
      ];
      
      setForecasts(sampleForecasts);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsApi.getProducts({ limit: 100 });
      setProducts(response || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      
      const forecastData = {
        product_id: parseInt(selectedProduct),
        forecast_method: forecastMethod,
        forecast_horizon_days: forecastHorizon,
        confidence_level: confidenceLevel / 100,
      };

      await forecastingApi.generateForecasts(forecastData);
      toast.success('Forecast generation started successfully');
      
      setGenerateDialogOpen(false);
      loadForecastingData();
      
    } catch (error) {
      console.error('Failed to generate forecast:', error);
      toast.error('Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForecast = async (id: number) => {
    try {
      await forecastingApi.deleteForecast(id);
      toast.success('Forecast deleted successfully');
      loadForecastingData();
    } catch (error) {
      toast.error('Failed to delete forecast');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'ACTIVE': 'primary',
      'COMPLETED': 'success',
      'EXPIRED': 'default',
      'FAILED': 'error',
    };
    return colors[status] || 'default';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, any> = {
      'SARIMA': 'primary',
      'EXPONENTIAL_SMOOTHING': 'secondary',
      'LINEAR_REGRESSION': 'info',
      'MOVING_AVERAGE': 'warning',
    };
    return colors[method] || 'default';
  };

  const forecastColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    {
      field: 'forecast_method',
      headerName: 'Method',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getMethodColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    { field: 'forecast_horizon_days', headerName: 'Horizon (Days)', width: 120, type: 'number' },
    { 
      field: 'forecast_date', 
      headerName: 'Forecast Date', 
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    { field: 'predicted_demand', headerName: 'Predicted Demand', width: 140, type: 'number' },
    { field: 'actual_demand', headerName: 'Actual Demand', width: 120, type: 'number' },
    { 
      field: 'accuracy_score', 
      headerName: 'Accuracy', 
      width: 100,
      renderCell: (params) => params.value ? `${params.value.toFixed(1)}%` : '-'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="delete"
          icon={<Assessment />}
          label="View Details"
          onClick={() => toast.info('Forecast details coming soon')}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteForecast(params.row.id)}
          color="error"
        />,
      ],
    },
  ];

  const accuracyColumns: GridColDef[] = [
    { field: 'product_code', headerName: 'Product Code', width: 120 },
    { field: 'product_name', headerName: 'Product Name', width: 200, flex: 1 },
    {
      field: 'forecast_method',
      headerName: 'Method',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getMethodColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    { 
      field: 'accuracy_percentage', 
      headerName: 'Accuracy', 
      width: 100,
      renderCell: (params) => `${params.value.toFixed(1)}%`
    },
    { 
      field: 'mae', 
      headerName: 'MAE', 
      width: 100,
      renderCell: (params) => params.value.toFixed(2)
    },
    { 
      field: 'mape', 
      headerName: 'MAPE', 
      width: 100,
      renderCell: (params) => `${(params.value * 100).toFixed(1)}%`
    },
    { 
      field: 'rmse', 
      headerName: 'RMSE', 
      width: 100,
      renderCell: (params) => params.value.toFixed(2)
    },
    { field: 'evaluation_periods', headerName: 'Eval Periods', width: 120, type: 'number' },
  ];

  // Sample chart data for visualization
  const chartData = [
    { date: '2024-01-01', actual: 250, predicted: 245, lower: 220, upper: 270 },
    { date: '2024-01-08', actual: 275, predicted: 280, lower: 255, upper: 305 },
    { date: '2024-01-15', actual: 290, predicted: 285, lower: 260, upper: 310 },
    { date: '2024-01-22', actual: 310, predicted: 315, lower: 290, upper: 340 },
    { date: '2024-01-29', actual: null, predicted: 320, lower: 295, upper: 345 },
    { date: '2024-02-05', actual: null, predicted: 330, lower: 305, upper: 355 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Demand Forecasting
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AI-powered demand forecasting with SARIMA, exponential smoothing, and trend analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadForecastingData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setGenerateDialogOpen(true)}
            >
              Generate Forecast
            </Button>
          </Box>
        </Box>

        {/* Forecasting Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline />
                    Active Forecasts
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment />
                    Forecast Accuracy
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Forecast Visualization
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Active Forecasts Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={forecasts}
                columns={forecastColumns}
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
          </TabPanel>

          {/* Forecast Accuracy Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Forecast accuracy metrics: MAE (Mean Absolute Error), MAPE (Mean Absolute Percentage Error), RMSE (Root Mean Square Error)
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={accuracy}
                    columns={accuracyColumns}
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
              </Grid>
            </Grid>
          </TabPanel>

          {/* Forecast Visualization Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Demand Forecast with Confidence Intervals
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="upper" 
                          stackId="confidence" 
                          stroke="transparent" 
                          fill="#E3F2FD"
                          name="Upper Confidence"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="lower" 
                          stackId="confidence" 
                          stroke="transparent" 
                          fill="#FFFFFF"
                          name="Lower Confidence"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#4CAF50" 
                          strokeWidth={3}
                          dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
                          name="Actual Demand"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#2196F3" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#2196F3', strokeWidth: 2, r: 4 }}
                          name="Predicted Demand"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>

        {/* Generate Forecast Dialog */}
        <Dialog 
          open={generateDialogOpen} 
          onClose={() => setGenerateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Generate New Forecast</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    label="Product"
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.product_code} - {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Forecast Method"
                  value={forecastMethod}
                  onChange={(e) => setForecastMethod(e.target.value)}
                >
                  <MenuItem value="SARIMA">SARIMA (Seasonal ARIMA)</MenuItem>
                  <MenuItem value="EXPONENTIAL_SMOOTHING">Exponential Smoothing</MenuItem>
                  <MenuItem value="LINEAR_REGRESSION">Linear Regression</MenuItem>
                  <MenuItem value="MOVING_AVERAGE">Moving Average</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  type="number"
                  fullWidth
                  label="Forecast Horizon (Days)"
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 365 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  type="number"
                  fullWidth
                  label="Confidence Level (%)"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  inputProps={{ min: 80, max: 99 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateForecast}
              variant="contained"
              startIcon={<PlayArrow />}
              disabled={!selectedProduct || loading}
            >
              Generate Forecast
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
}