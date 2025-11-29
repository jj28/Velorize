'use client';

import React, { useState, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { FileUpload, Download, CheckCircle, CloudUpload } from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function ImportPage() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      // TODO: Replace with actual API call
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`File "${file.name}" uploaded successfully`);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = (templateType: string) => {
    // Generate CSV template based on type
    let csvContent = '';
    let filename = '';

    switch (templateType) {
      case 'products':
        csvContent = 'product_code,product_name,category,uom,selling_price,cost_price,reorder_level,is_perishable,shelf_life_days,has_bom\n';
        csvContent += 'PRD-001,Sample Product,finished_goods,KG,100.00,75.00,50,true,365,false\n';
        filename = 'products_template.csv';
        break;
      case 'customers':
        csvContent = 'customer_code,customer_name,contact_person,email,phone,address,city,state,postal_code,credit_limit,payment_terms\n';
        csvContent += 'CUST-001,Sample Customer,John Doe,john@example.com,+60123456789,123 Main St,Kuala Lumpur,Selangor,50000,10000,30\n';
        filename = 'customers_template.csv';
        break;
      case 'suppliers':
        csvContent = 'supplier_code,supplier_name,contact_person,email,phone,address,city,state,postal_code,lead_time_days,payment_terms\n';
        csvContent += 'SUP-001,Sample Supplier,Jane Smith,jane@supplier.com,+60198765432,456 Industrial Ave,Shah Alam,Selangor,40000,7,30\n';
        filename = 'suppliers_template.csv';
        break;
      case 'inventory':
        csvContent = 'product_code,location,quantity,lot_number,expiry_date\n';
        csvContent += 'PRD-001,WAREHOUSE-A,100,LOT-2024-001,2024-12-31\n';
        filename = 'inventory_template.csv';
        break;
      case 'sales':
        csvContent = 'date,product_code,customer_code,quantity,unit_price,total_amount\n';
        csvContent += '2024-01-15,PRD-001,CUST-001,10,100.00,1000.00\n';
        filename = 'sales_template.csv';
        break;
      default:
        toast.error('Unknown template type');
        return;
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(`Template "${filename}" downloaded`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FileUpload sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              Data Import & Export
            </Typography>
          </Box>
        </Box>

        {/* Import Options */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Data
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Upload CSV or Excel files to import your data
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Products" secondary="Import product master data" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Customers" secondary="Import customer information" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Sales Data" secondary="Import historical sales" />
                  </ListItem>
                </List>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                />
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={uploading ? <CloudUpload /> : <FileUpload />}
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Data
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Download your data in CSV or Excel format
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Download color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Products" secondary="Export all products" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Download color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Inventory" secondary="Export stock levels" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Download color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Forecasts" secondary="Export forecasts" />
                  </ListItem>
                </List>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Download />}
                      onClick={() => handleDownloadTemplate('products')}
                    >
                      Products Template
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Download />}
                      onClick={() => handleDownloadTemplate('customers')}
                    >
                      Customers Template
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Download />}
                      onClick={() => handleDownloadTemplate('suppliers')}
                    >
                      Suppliers Template
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Download />}
                      onClick={() => handleDownloadTemplate('inventory')}
                    >
                      Inventory Template
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Download />}
                      onClick={() => handleDownloadTemplate('sales')}
                    >
                      Sales Data Template
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
