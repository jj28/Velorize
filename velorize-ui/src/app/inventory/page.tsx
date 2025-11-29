'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search,
  Add,
  Warning,
  Inventory as InventoryIcon,
  TrendingDown,
  Schedule,
  AttachMoney,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog';

interface StockItem {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  location: string;
  quantity_available: number;
  unit_cost: number;
  total_cost: number;
  lot_number?: string;
  expiry_date?: string;
  reorder_level: number;
  status: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'EXPIRED';
}

interface InventoryAlert {
  id: string;
  type: 'stock_out' | 'critical_low' | 'reorder' | 'expired' | 'expiring';
  product_code: string;
  product_name: string;
  location: string;
  current_stock: number;
  reorder_level?: number;
  expiry_date?: string;
  urgency: 'critical' | 'high' | 'medium';
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState<StockItem[]>([]);
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockStockItems: StockItem[] = [
        {
          id: 1,
          product_id: 1,
          product_code: 'PRD-001',
          product_name: 'Nasi Lemak Sauce',
          location: 'WAREHOUSE-A',
          quantity_available: 85,
          unit_cost: 5.20,
          total_cost: 442,
          lot_number: 'LOT-2024-001',
          expiry_date: '2024-12-31',
          reorder_level: 100,
          status: 'LOW',
        },
        {
          id: 2,
          product_id: 2,
          product_code: 'PRD-002',
          product_name: 'Coconut Milk Powder',
          location: 'WAREHOUSE-A',
          quantity_available: 150,
          unit_cost: 8.50,
          total_cost: 1275,
          lot_number: 'LOT-2024-002',
          reorder_level: 50,
          status: 'ADEQUATE',
        },
        {
          id: 3,
          product_id: 3,
          product_code: 'PRD-003',
          product_name: 'Rendang Curry Paste',
          location: 'WAREHOUSE-B',
          quantity_available: 15,
          unit_cost: 11.20,
          total_cost: 168,
          lot_number: 'LOT-2024-003',
          expiry_date: '2024-06-30',
          reorder_level: 75,
          status: 'CRITICAL',
        },
        {
          id: 4,
          product_id: 4,
          product_code: 'PRD-004',
          product_name: 'Palm Oil',
          location: 'WAREHOUSE-A',
          quantity_available: 0,
          unit_cost: 3.50,
          total_cost: 0,
          lot_number: 'LOT-2024-004',
          expiry_date: '2024-05-15',
          reorder_level: 200,
          status: 'EXPIRED',
        },
      ];

      const mockAlerts: InventoryAlert[] = [
        {
          id: '1',
          type: 'critical_low',
          product_code: 'PRD-003',
          product_name: 'Rendang Curry Paste',
          location: 'WAREHOUSE-B',
          current_stock: 15,
          reorder_level: 75,
          urgency: 'critical',
        },
        {
          id: '2',
          type: 'stock_out',
          product_code: 'PRD-004',
          product_name: 'Palm Oil',
          location: 'WAREHOUSE-A',
          current_stock: 0,
          reorder_level: 200,
          urgency: 'critical',
        },
        {
          id: '3',
          type: 'reorder',
          product_code: 'PRD-001',
          product_name: 'Nasi Lemak Sauce',
          location: 'WAREHOUSE-A',
          current_stock: 85,
          reorder_level: 100,
          urgency: 'high',
        },
        {
          id: '4',
          type: 'expiring',
          product_code: 'PRD-003',
          product_name: 'Rendang Curry Paste',
          location: 'WAREHOUSE-B',
          current_stock: 15,
          expiry_date: '2024-06-30',
          urgency: 'high',
        },
      ];

      setStockItems(mockStockItems);
      setAlerts(mockAlerts);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'ADEQUATE': 'success',
      'LOW': 'warning',
      'CRITICAL': 'error',
      'EXPIRED': 'error',
    };
    return colors[status] || 'default';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, any> = {
      'critical': 'error',
      'high': 'warning',
      'medium': 'info',
    };
    return colors[urgency] || 'default';
  };

  const stockColumns: GridColDef[] = [
    {
      field: 'product_code',
      headerName: 'Product Code',
      width: 120,
    },
    {
      field: 'product_name',
      headerName: 'Product Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 120,
    },
    {
      field: 'quantity_available',
      headerName: 'Available Qty',
      width: 120,
      type: 'number',
    },
    {
      field: 'unit_cost',
      headerName: 'Unit Cost',
      width: 100,
      renderCell: (params) => `RM ${params.value.toFixed(2)}`,
    },
    {
      field: 'total_cost',
      headerName: 'Total Value',
      width: 120,
      renderCell: (params) => `RM ${params.value.toFixed(2)}`,
    },
    {
      field: 'lot_number',
      headerName: 'Lot Number',
      width: 120,
    },
    {
      field: 'expiry_date',
      headerName: 'Expiry Date',
      width: 120,
      renderCell: (params) => {
        if (!params.value) return '-';
        const expiryDate = new Date(params.value);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          return <Chip label="Expired" color="error" size="small" />;
        } else if (daysUntilExpiry <= 30) {
          return <Chip label={`${daysUntilExpiry} days`} color="warning" size="small" />;
        }
        return expiryDate.toLocaleDateString();
      },
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
  ];

  const alertColumns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Alert Type',
      width: 120,
      renderCell: (params) => {
        const typeLabels: Record<string, string> = {
          'stock_out': 'Stock Out',
          'critical_low': 'Critical Low',
          'reorder': 'Reorder',
          'expired': 'Expired',
          'expiring': 'Expiring Soon',
        };
        return typeLabels[params.value] || params.value;
      },
    },
    {
      field: 'product_code',
      headerName: 'Product Code',
      width: 120,
    },
    {
      field: 'product_name',
      headerName: 'Product Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 120,
    },
    {
      field: 'current_stock',
      headerName: 'Current Stock',
      width: 120,
      type: 'number',
    },
    {
      field: 'reorder_level',
      headerName: 'Reorder Level',
      width: 120,
      type: 'number',
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'urgency',
      headerName: 'Urgency',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getUrgencyColor(params.value)}
          size="small"
        />
      ),
    },
  ];

  const filteredStockItems = stockItems.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlerts = alerts.filter(alert =>
    alert.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = stockItems.reduce((sum, item) => sum + item.total_cost, 0);
  const criticalItems = alerts.filter(alert => alert.urgency === 'critical').length;
  const lowStockItems = stockItems.filter(item => item.status === 'LOW' || item.status === 'CRITICAL').length;
  const expiredItems = stockItems.filter(item => item.status === 'EXPIRED').length;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Inventory Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track stock levels, monitor expiry dates, and manage inventory across locations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAdjustStockDialogOpen(true)}
        >
          Adjust Stock
        </Button>
      </Box>

      {/* Critical Alerts */}
      {criticalItems > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Critical Inventory Alerts
          </Typography>
          <Typography variant="body2">
            {criticalItems} items require immediate attention. Check the Alerts tab for details.
          </Typography>
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                RM {totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Inventory Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={criticalItems} color="error">
                <Warning sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {criticalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {lowStockItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low Stock Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {expiredItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by product name, code, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon />
                  Stock On Hand
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning />
                  Alerts
                  {criticalItems > 0 && (
                    <Chip 
                      label={criticalItems} 
                      color="error" 
                      size="small" 
                      sx={{ minWidth: 'auto', height: 20 }} 
                    />
                  )}
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Stock On Hand Tab */}
        {activeTab === 0 && (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredStockItems}
              columns={stockColumns}
              loading={loading}
              pageSize={25}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              sx={{
                border: 0,
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiDataGrid-row': {
                  '&.critical': {
                    backgroundColor: 'error.light',
                  },
                  '&.low': {
                    backgroundColor: 'warning.light',
                  },
                },
              }}
              getRowClassName={(params) => {
                if (params.row.status === 'CRITICAL' || params.row.status === 'EXPIRED') {
                  return 'critical';
                }
                if (params.row.status === 'LOW') {
                  return 'low';
                }
                return '';
              }}
            />
          </Box>
        )}

        {/* Alerts Tab */}
        {activeTab === 1 && (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredAlerts}
              columns={alertColumns}
              loading={loading}
              pageSize={25}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              sx={{
                border: 0,
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            />
          </Box>
        )}
      </Card>

      {/* Adjust Stock Dialog */}
      <AdjustStockDialog
        open={adjustStockDialogOpen}
        onClose={() => setAdjustStockDialogOpen(false)}
        onSuccess={loadInventoryData}
      />
    </Container>
  );
}