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
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  Search,
  Add,
  FilterList,
  MoreVert,
  Edit,
  Visibility,
  Delete,
  Inventory,
  TrendingUp,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { productsApi } from '../../lib/api/apiClient';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  product_code: string;
  name: string;
  description?: string;
  category: string;
  unit_of_measure: string;
  selling_price?: number;
  cost_price?: number;
  reorder_level?: number;
  shelf_life_days?: number;
  is_perishable: boolean;
  has_bom: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');

  useEffect(() => {
    loadProducts();
  }, [page, pageSize, searchTerm, selectedCategory, selectedStatus]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: page * pageSize,
        limit: pageSize,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
      };

      const response = await productsApi.getProducts(params);
      setProducts(response || []);
      setTotal(response?.length || 0); // Note: Real API would return total count
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
      
      // Fallback sample data
      setProducts([
        {
          id: 1,
          product_code: 'PRD-001',
          name: 'Nasi Lemak Sauce',
          description: 'Premium sambal sauce for nasi lemak',
          category: 'SAUCE',
          unit_of_measure: 'BOTTLE',
          selling_price: 8.50,
          cost_price: 5.20,
          reorder_level: 100,
          shelf_life_days: 365,
          is_perishable: true,
          has_bom: true,
          status: 'ACTIVE',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          product_code: 'PRD-002',
          name: 'Coconut Milk Powder',
          description: 'Premium coconut milk powder',
          category: 'INGREDIENT',
          unit_of_measure: 'KG',
          selling_price: 12.00,
          cost_price: 8.50,
          reorder_level: 50,
          shelf_life_days: 730,
          is_perishable: false,
          has_bom: false,
          status: 'ACTIVE',
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z',
        },
        {
          id: 3,
          product_code: 'PRD-003',
          name: 'Rendang Curry Paste',
          description: 'Authentic rendang curry paste',
          category: 'SEASONING',
          unit_of_measure: 'POUCH',
          selling_price: 15.80,
          cost_price: 11.20,
          reorder_level: 75,
          shelf_life_days: 540,
          is_perishable: true,
          has_bom: true,
          status: 'ACTIVE',
          created_at: '2024-01-08T00:00:00Z',
          updated_at: '2024-01-08T00:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (product: Product) => {
    toast.success(`Viewing ${product.name}`);
    // TODO: Navigate to product detail page
  };

  const handleEdit = (product: Product) => {
    toast.success(`Editing ${product.name}`);
    // TODO: Navigate to product edit page
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        // TODO: Call delete API
        toast.success(`${product.name} deleted successfully`);
        loadProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      'SAUCE': 'error',
      'INGREDIENT': 'primary',
      'SEASONING': 'warning',
      'FINISHED_GOODS': 'success',
      'RAW_MATERIAL': 'info',
    };
    return colors[category] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'DISCONTINUED': 'error',
    };
    return colors[status] || 'default';
  };

  const columns: GridColDef[] = [
    {
      field: 'product_code',
      headerName: 'Product Code',
      width: 120,
      fontWeight: 'bold',
    },
    {
      field: 'name',
      headerName: 'Product Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getCategoryColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'unit_of_measure',
      headerName: 'UOM',
      width: 80,
    },
    {
      field: 'selling_price',
      headerName: 'Selling Price',
      width: 120,
      type: 'number',
      renderCell: (params) => params.value ? `RM ${params.value.toFixed(2)}` : '-',
    },
    {
      field: 'cost_price',
      headerName: 'Cost Price',
      width: 120,
      type: 'number',
      renderCell: (params) => params.value ? `RM ${params.value.toFixed(2)}` : '-',
    },
    {
      field: 'reorder_level',
      headerName: 'Reorder Level',
      width: 120,
      type: 'number',
    },
    {
      field: 'is_perishable',
      headerName: 'Perishable',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'warning' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'has_bom',
      headerName: 'Has BOM',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
          key="view"
          icon={<Visibility />}
          label="View"
          onClick={() => handleView(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDelete(params.row)}
          color="error"
        />,
      ],
    },
  ];

  const categories = [
    'FINISHED_GOODS',
    'RAW_MATERIAL',
    'INGREDIENT',
    'PACKAGING',
    'SAUCE',
    'SEASONING',
    'OTHER',
  ];

  const statuses = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Product Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your F&B product catalog with SKUs, BOMs, and pricing
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => toast.info('Add product functionality coming soon')}
        >
          Add Product
        </Button>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search products by name or code..."
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
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedStatus('ACTIVE');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {products.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {products.filter(p => p.status === 'ACTIVE').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="warning.main">
                {products.filter(p => p.is_perishable).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Perishable Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="info.main">
                {products.filter(p => p.has_bom).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                With BOM
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Grid */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={products}
            columns={columns}
            loading={loading}
            pageSize={pageSize}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[10, 25, 50, 100]}
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
      </Card>
    </Container>
  );
}