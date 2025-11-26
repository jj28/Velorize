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
  Chip,
  Alert,
  CircularProgress,
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Event,
  Add,
  Edit,
  Delete,
  TrendingUp,
  Assessment,
  DateRange,
  Campaign,
  Refresh,
  Visibility,
  CalendarMonth,
  Timeline,
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
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { marketingApi } from '../../lib/api/apiClient';
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
      id={`marketing-tabpanel-${index}`}
      aria-labelledby={`marketing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface MarketingEvent {
  id: number;
  title: string;
  description: string;
  event_type: 'CAMPAIGN' | 'PROMOTION' | 'LAUNCH' | 'SEASONAL' | 'FESTIVAL';
  start_date: string;
  end_date: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  budget: number;
  expected_impact: number;
  actual_impact?: number;
  target_products: string[];
  channels: string[];
  created_at: string;
}

interface AOPPlan {
  id: number;
  year: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  total_budget: number;
  allocated_budget: number;
  target_revenue: number;
  actual_revenue?: number;
  quarter_targets: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  created_at: string;
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [aopPlans, setAopPlans] = useState<AOPPlan[]>([]);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [aopDialogOpen, setAopDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MarketingEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<MarketingEvent[]>([]);

  // Form states for event creation
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('CAMPAIGN');
  const [eventBudget, setEventBudget] = useState('');
  const [expectedImpact, setExpectedImpact] = useState('');

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      setLoading(true);
      
      const [calendarData, aopData, upcomingData] = await Promise.all([
        marketingApi.getCalendar(),
        marketingApi.getAOPPlans(),
        marketingApi.getUpcomingEvents(),
      ]);

      setEvents(calendarData || []);
      setAopPlans(aopData || []);
      setUpcomingEvents(upcomingData || []);
      
    } catch (error) {
      console.error('Failed to load marketing data:', error);
      toast.error('Failed to load marketing data');
      
      // Sample data fallback
      const sampleEvents: MarketingEvent[] = [
        {
          id: 1,
          title: 'Chinese New Year Promotion',
          description: 'Special promotion for CNY featuring traditional sauces',
          event_type: 'FESTIVAL',
          start_date: '2024-02-08',
          end_date: '2024-02-18',
          status: 'PLANNED',
          budget: 25000,
          expected_impact: 15.5,
          target_products: ['PRD-001', 'PRD-003'],
          channels: ['Digital', 'In-store'],
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          title: 'Ramadan Campaign',
          description: 'Halal product showcase during Ramadan',
          event_type: 'SEASONAL',
          start_date: '2024-03-10',
          end_date: '2024-04-10',
          status: 'ACTIVE',
          budget: 35000,
          expected_impact: 20.0,
          actual_impact: 18.5,
          target_products: ['PRD-001', 'PRD-002', 'PRD-003'],
          channels: ['Digital', 'TV', 'Radio'],
          created_at: '2024-02-01T00:00:00Z',
        },
      ];

      const sampleAOP: AOPPlan[] = [
        {
          id: 1,
          year: 2024,
          title: '2024 Annual Operating Plan',
          description: 'Strategic marketing plan for FY2024',
          status: 'ACTIVE',
          total_budget: 500000,
          allocated_budget: 325000,
          target_revenue: 2500000,
          actual_revenue: 1850000,
          quarter_targets: {
            q1: 600000,
            q2: 650000,
            q3: 600000,
            q4: 650000,
          },
          created_at: '2023-12-01T00:00:00Z',
        },
      ];

      setEvents(sampleEvents);
      setAopPlans(sampleAOP);
      setUpcomingEvents(sampleEvents.slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        event_type: eventType,
        budget: parseFloat(eventBudget),
        expected_impact: parseFloat(expectedImpact),
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await marketingApi.createEvent(eventData);
      toast.success('Marketing event created successfully');
      
      setEventDialogOpen(false);
      setEventTitle('');
      setEventDescription('');
      setEventBudget('');
      setExpectedImpact('');
      loadMarketingData();
      
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await marketingApi.deleteEvent(id);
      toast.success('Event deleted successfully');
      loadMarketingData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      'CAMPAIGN': 'primary',
      'PROMOTION': 'secondary',
      'LAUNCH': 'success',
      'SEASONAL': 'warning',
      'FESTIVAL': 'error',
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'PLANNED': 'info',
      'ACTIVE': 'success',
      'COMPLETED': 'default',
      'CANCELLED': 'error',
    };
    return colors[status] || 'default';
  };

  const eventColumns: GridColDef[] = [
    { field: 'title', headerName: 'Event Title', width: 200, flex: 1 },
    {
      field: 'event_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getEventTypeColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    { 
      field: 'start_date', 
      headerName: 'Start Date', 
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    { 
      field: 'end_date', 
      headerName: 'End Date', 
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
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
      field: 'budget', 
      headerName: 'Budget', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'expected_impact', 
      headerName: 'Expected Impact', 
      width: 140,
      renderCell: (params) => `${params.value}%`
    },
    { 
      field: 'actual_impact', 
      headerName: 'Actual Impact', 
      width: 130,
      renderCell: (params) => params.value ? `${params.value}%` : '-'
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
          onClick={() => setSelectedEvent(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => toast.info('Edit functionality coming soon')}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteEvent(params.row.id)}
          color="error"
        />,
      ],
    },
  ];

  const aopColumns: GridColDef[] = [
    { field: 'year', headerName: 'Year', width: 80 },
    { field: 'title', headerName: 'Plan Title', width: 200, flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    { 
      field: 'total_budget', 
      headerName: 'Total Budget', 
      width: 140,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'allocated_budget', 
      headerName: 'Allocated', 
      width: 120,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'target_revenue', 
      headerName: 'Target Revenue', 
      width: 150,
      renderCell: (params) => `RM ${params.value.toLocaleString()}`
    },
    { 
      field: 'actual_revenue', 
      headerName: 'Actual Revenue', 
      width: 150,
      renderCell: (params) => params.value ? `RM ${params.value.toLocaleString()}` : '-'
    },
  ];

  // Chart data
  const campaignPerformanceData = [
    { month: 'Jan', budget: 40000, revenue: 180000, impact: 12.5 },
    { month: 'Feb', budget: 35000, revenue: 220000, impact: 15.2 },
    { month: 'Mar', budget: 50000, revenue: 280000, impact: 18.7 },
    { month: 'Apr', budget: 45000, revenue: 260000, impact: 16.8 },
    { month: 'May', budget: 38000, revenue: 195000, impact: 13.9 },
    { month: 'Jun', budget: 42000, revenue: 225000, impact: 14.5 },
  ];

  const aopProgressData = [
    { quarter: 'Q1', target: 600000, actual: 580000 },
    { quarter: 'Q2', target: 650000, actual: 620000 },
    { quarter: 'Q3', target: 600000, actual: 0 },
    { quarter: 'Q4', target: 650000, actual: 0 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Marketing Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Campaign planning, marketing calendar, and Annual Operating Plan (AOP) management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadMarketingData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setEventDialogOpen(true)}
            >
              Create Event
            </Button>
          </Box>
        </Box>

        {/* Upcoming Events Alert */}
        {upcomingEvents.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Upcoming Marketing Events</Typography>
            <Typography variant="body2">
              {upcomingEvents.length} events planned in the next 30 days. Check the calendar for details.
            </Typography>
          </Alert>
        )}

        {/* Marketing Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event />
                    Marketing Calendar
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment />
                    Campaign Performance
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline />
                    AOP Management
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Impact Analysis
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Marketing Calendar Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Quick Stats */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Event sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {events.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Campaign sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {events.filter(e => e.status === 'ACTIVE').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Campaigns
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      RM {events.reduce((sum, e) => sum + e.budget, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Budget
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {upcomingEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Events
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Events Grid */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Marketing Events Calendar
                    </Typography>
                    <Box sx={{ height: 500, width: '100%' }}>
                      <DataGrid
                        rows={events}
                        columns={eventColumns}
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

              {/* Upcoming Events List */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Upcoming Events
                    </Typography>
                    <List>
                      {upcomingEvents.map((event) => (
                        <ListItem key={event.id}>
                          <Avatar sx={{ bgcolor: getEventTypeColor(event.event_type) + '.main', mr: 2 }}>
                            <Event />
                          </Avatar>
                          <ListItemText
                            primary={event.title}
                            secondary={`${event.event_type} • ${new Date(event.start_date).toLocaleDateString()}`}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={event.status}
                              color={getStatusColor(event.status)}
                              size="small"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Campaign Performance Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Track campaign performance with budget vs revenue analysis and ROI metrics.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Campaign Performance Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={campaignPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="budget" fill="#FF9800" name="Budget (RM)" />
                        <Line yAxisId="right" type="monotone" dataKey="impact" stroke="#4CAF50" name="Impact %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* AOP Management Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Manage Annual Operating Plans (AOP) with quarterly targets and budget allocation.
                </Alert>
              </Grid>

              {/* AOP Progress Chart */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quarterly AOP Progress
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={aopProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="target" fill="#2196F3" name="Target" />
                        <Bar dataKey="actual" fill="#4CAF50" name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* AOP Summary */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      2024 AOP Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Total Budget
                        </Typography>
                        <Typography variant="h5" color="primary.main">
                          RM 500K
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Budget Utilized
                        </Typography>
                        <Typography variant="h5" color="warning.main">
                          65%
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Revenue Progress
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          74%
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* AOP Plans Grid */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      AOP Plans
                    </Typography>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <DataGrid
                        rows={aopPlans}
                        columns={aopColumns}
                        loading={loading}
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
            </Grid>
          </TabPanel>

          {/* Impact Analysis Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Analyze the impact of marketing campaigns on sales and business metrics.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Marketing Impact Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Detailed impact analysis functionality coming soon - correlate marketing spend with revenue growth and customer acquisition.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>

        {/* Create Event Dialog */}
        <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Marketing Event</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Event Type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <MenuItem value="CAMPAIGN">Campaign</MenuItem>
                  <MenuItem value="PROMOTION">Promotion</MenuItem>
                  <MenuItem value="LAUNCH">Product Launch</MenuItem>
                  <MenuItem value="SEASONAL">Seasonal</MenuItem>
                  <MenuItem value="FESTIVAL">Festival</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  type="number"
                  fullWidth
                  label="Budget (RM)"
                  value={eventBudget}
                  onChange={(e) => setEventBudget(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  type="number"
                  fullWidth
                  label="Expected Impact (%)"
                  value={expectedImpact}
                  onChange={(e) => setExpectedImpact(e.target.value)}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateEvent}
              variant="contained"
              disabled={!eventTitle || !eventBudget}
            >
              Create Event
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
}