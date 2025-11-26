'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  GetApp,
  Publish,
  CheckCircle,
  Error,
  Warning,
  Info,
  InsertDriveFile,
  TableView,
  Assessment,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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
      id={`import-export-tabpanel-${index}`}
      aria-labelledby={`import-export-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ImportResult {
  id: string;
  filename: string;
  type: string;
  status: 'processing' | 'completed' | 'failed' | 'warning';
  totalRows: number;
  successRows: number;
  errorRows: number;
  warnings: string[];
  errors: string[];
  timestamp: string;
}

interface ExportTask {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename?: string;
  downloadUrl?: string;
  progress: number;
  timestamp: string;
}

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Export form states
  const [exportType, setExportType] = useState('products');
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        handleFileImport(file);
      };

      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  const handleFileImport = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock import result
      const result: ImportResult = {
        id: Date.now().toString(),
        filename: file.name,
        type: detectImportType(file.name),
        status: Math.random() > 0.7 ? 'warning' : 'completed',
        totalRows: Math.floor(Math.random() * 1000) + 100,
        successRows: Math.floor(Math.random() * 900) + 90,
        errorRows: Math.floor(Math.random() * 10),
        warnings: ['Some rows had missing optional fields', 'Duplicate SKUs detected'],
        errors: ['Invalid date format in row 45', 'Missing required field in row 78'],
        timestamp: new Date().toISOString(),
      };

      result.successRows = result.totalRows - result.errorRows;

      setImportResults(prev => [result, ...prev]);
      setUploadProgress(100);
      
      if (result.status === 'completed') {
        toast.success(`Successfully imported ${result.successRows} records from ${file.name}`);
      } else {
        toast.warning(`Import completed with warnings: ${file.name}`);
      }

    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const detectImportType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('product')) return 'products';
    if (name.includes('inventory')) return 'inventory';
    if (name.includes('sales')) return 'sales';
    if (name.includes('forecast')) return 'forecasts';
    return 'unknown';
  };

  const handleExport = async () => {
    const taskId = Date.now().toString();
    const newTask: ExportTask = {
      id: taskId,
      type: exportType,
      format: exportFormat,
      status: 'processing',
      progress: 0,
      timestamp: new Date().toISOString(),
    };

    setExportTasks(prev => [newTask, ...prev]);
    setExportDialogOpen(false);

    // Simulate export process
    const progressInterval = setInterval(() => {
      setExportTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const newProgress = Math.min(task.progress + 15, 100);
          return {
            ...task,
            progress: newProgress,
            status: newProgress === 100 ? 'completed' : 'processing',
            filename: newProgress === 100 ? `${exportType}_export_${Date.now()}.${exportFormat}` : undefined,
            downloadUrl: newProgress === 100 ? `/exports/${exportType}_export_${Date.now()}.${exportFormat}` : undefined,
          };
        }
        return task;
      }));
    }, 500);

    setTimeout(() => {
      clearInterval(progressInterval);
      toast.success('Export completed successfully');
    }, 8000);
  };

  const handlePreview = (filename: string) => {
    // Mock preview data
    const mockData = [
      { id: 1, product_code: 'PRD-001', name: 'Nasi Lemak Sauce', category: 'SAUCE', price: 8.50 },
      { id: 2, product_code: 'PRD-002', name: 'Coconut Milk Powder', category: 'INGREDIENT', price: 12.00 },
      { id: 3, product_code: 'PRD-003', name: 'Rendang Curry Paste', category: 'SEASONING', price: 15.80 },
    ];
    setPreviewData(mockData);
    setPreviewDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'failed':
        return <Error color="error" />;
      case 'processing':
        return <Info color="info" />;
      default:
        return <Info color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'warning':
        return 'warning';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  };

  const importColumns: GridColDef[] = [
    { field: 'filename', headerName: 'Filename', width: 200, flex: 1 },
    { field: 'type', headerName: 'Type', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    { field: 'totalRows', headerName: 'Total Rows', width: 100, type: 'number' },
    { field: 'successRows', headerName: 'Success', width: 100, type: 'number' },
    { field: 'errorRows', headerName: 'Errors', width: 100, type: 'number' },
    { 
      field: 'timestamp', 
      headerName: 'Import Date', 
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleString()
    },
  ];

  const exportColumns: GridColDef[] = [
    { field: 'type', headerName: 'Export Type', width: 150 },
    { field: 'format', headerName: 'Format', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={params.value}
            sx={{ width: '80%', mr: 1 }}
          />
          <Typography variant="caption">{params.value}%</Typography>
        </Box>
      ),
    },
    { 
      field: 'timestamp', 
      headerName: 'Created', 
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        params.row.status === 'completed' && (
          <Button
            size="small"
            startIcon={<GetApp />}
            onClick={() => {
              toast.success('Download started');
              // Handle download
            }}
          >
            Download
          </Button>
        )
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Data Import & Export
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bulk import product data, inventory records, and export reports in multiple formats
        </Typography>
      </Box>

      {/* Import/Export Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Publish />
                  Import Data
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudDownload />
                  Export Data
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment />
                  Templates
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Import Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Upload Area */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  backgroundColor: isDragActive ? 'action.hover' : 'transparent',
                  cursor: 'pointer',
                  p: 4,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: CSV, XLS, XLSX (Max file size: 10MB)
                </Typography>
                
                {isUploading && (
                  <Box sx={{ mt: 3 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Uploading... {uploadProgress}%
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Import Guidelines */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Guidelines
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Ensure column headers match template format" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Use proper date format (YYYY-MM-DD)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Validate numeric fields for prices and quantities" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Remove empty rows to avoid import errors" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Supported Data Types */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Supported Data Types
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Chip label="Products" color="primary" variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label="Inventory" color="secondary" variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label="Sales Data" color="success" variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label="BOMs" color="warning" variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label="Suppliers" color="info" variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label="Customers" color="error" variant="outlined" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Import History */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import History
                  </Typography>
                  <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                      rows={importResults}
                      columns={importColumns}
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

        {/* Export Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Export Options */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Export
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CloudDownload />}
                    onClick={() => setExportDialogOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    Create Export
                  </Button>
                  
                  <Typography variant="body2" color="text.secondary">
                    Export your data in various formats including CSV, Excel, and JSON.
                    Choose from products, inventory, sales data, and more.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Export Tasks */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Export Queue
                  </Typography>
                  <Box sx={{ height: 300, width: '100%' }}>
                    <DataGrid
                      rows={exportTasks}
                      columns={exportColumns}
                      pageSize={10}
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

            {/* Export Statistics */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2">Export Statistics</Typography>
                <Typography variant="body2">
                  Total exports this month: 24 • Average export time: 45 seconds • Most exported: Products data
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Download template files to ensure proper data formatting for imports.
              </Alert>
            </Grid>

            {[
              { name: 'Products Template', description: 'Template for importing product master data', icon: <TableView /> },
              { name: 'Inventory Template', description: 'Template for importing inventory levels', icon: <InsertDriveFile /> },
              { name: 'Sales Data Template', description: 'Template for importing historical sales data', icon: <Assessment /> },
              { name: 'BOM Template', description: 'Template for importing bill of materials', icon: <TableView /> },
            ].map((template, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {template.icon}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {template.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<GetApp />}
                        onClick={() => {
                          toast.success(`Downloaded ${template.name}`);
                          handlePreview(template.name);
                        }}
                      >
                        Download CSV
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handlePreview(template.name)}
                      >
                        Preview
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Export</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  label="Data Type"
                >
                  <MenuItem value="products">Products</MenuItem>
                  <MenuItem value="inventory">Inventory</MenuItem>
                  <MenuItem value="sales">Sales Data</MenuItem>
                  <MenuItem value="forecasts">Forecasts</MenuItem>
                  <MenuItem value="analytics">Analytics Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="pdf">PDF Report</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Date Range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="all">All Data</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="1y">Last 1 Year</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained">Start Export</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product Code</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.product_code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}