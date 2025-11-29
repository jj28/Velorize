'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Business,
  Settings as SettingsIcon,
  Edit,
  Delete,
  Add,
  ChevronRight
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { AddUserDialog } from '@/components/settings/AddUserDialog';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'sop_leader' | 'viewer';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'admin',
      email: 'admin@velorize.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      last_login: '2024-01-15T10:30:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      username: 'sop_manager',
      email: 'sop@velorize.com',
      first_name: 'Sarah',
      last_name: 'Tan',
      role: 'sop_leader',
      is_active: true,
      last_login: '2024-01-14T15:45:00Z',
      created_at: '2024-01-05T00:00:00Z',
    },
    {
      id: 3,
      username: 'analyst',
      email: 'analyst@velorize.com',
      first_name: 'Michael',
      last_name: 'Lee',
      role: 'viewer',
      is_active: true,
      created_at: '2024-01-10T00:00:00Z',
    },
  ]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    department: '',
    position: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    inventory_alerts: true,
    forecast_alerts: true,
    marketing_updates: false,
    system_maintenance: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    language: 'en',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    date_format: 'DD/MM/YYYY',
    theme: 'light',
  });

  const [companySettings, setCompanySettings] = useState({
    company_name: 'Velorize Foods Sdn Bhd',
    business_registration: '123456789',
    tax_id: 'GST-123456',
    address: '123 Business Park, Kuala Lumpur',
    phone: '+60 3-1234 5678',
    email: 'contact@velorize.com',
    website: 'https://velorize.com',
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password updated successfully');
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  const handleSaveNotifications = () => {
    toast.success('Notification settings updated');
  };

  const handleSaveSystem = () => {
    toast.success('System preferences updated');
  };

  const handleSaveCompany = () => {
    toast.success('Company information updated');
  };

  const handleUserSuccess = () => {
    // Reload users data here
    setSelectedUser(null);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, any> = {
      'admin': 'error',
      'sop_leader': 'warning',
      'viewer': 'info',
    };
    return colors[role] || 'default';
  };

  const userColumns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 120 },
    { field: 'email', headerName: 'Email', width: 200, flex: 1 },
    { field: 'first_name', headerName: 'First Name', width: 120 },
    { field: 'last_name', headerName: 'Last Name', width: 120 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          color={getRoleColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    { 
      field: 'last_login', 
      headerName: 'Last Login', 
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'Never'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => handleEditUser(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteUser(params.row.id)}
          color="error"
          disabled={params.row.id === user?.id}
        />,
      ],
    },
  ];

  const navItems = [
    { id: 'profile', label: 'Profile', icon: <Person />, description: 'Personal information and contact details' },
    { id: 'security', label: 'Security', icon: <Security />, description: 'Password and account security' },
    { id: 'notifications', label: 'Notifications', icon: <Notifications />, description: 'Email and push notification preferences' },
    { id: 'system', label: 'System', icon: <SettingsIcon />, description: 'Language, timezone, and display settings' },
    { id: 'company', label: 'Company', icon: <Business />, description: 'Company details and business information' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'users', label: 'User Management', icon: <Person />, description: 'Manage users and permissions' });
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ overflow: 'hidden', bgcolor: 'background.paper' }}>
            <List component="nav" disablePadding>
              {navItems.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItemButton
                    selected={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
                    sx={{
                      py: 2,
                      borderLeft: activeSection === item.id ? '4px solid' : '4px solid transparent',
                      borderColor: 'primary.main',
                      bgcolor: activeSection === item.id ? 'primary.50' : 'transparent',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(37, 99, 235, 0.08)',
                      },
                      '&.Mui-selected:hover': {
                        bgcolor: 'rgba(37, 99, 235, 0.12)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: activeSection === item.id ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        fontWeight: activeSection === item.id ? 600 : 500,
                        color: activeSection === item.id ? 'primary.main' : 'text.primary'
                      }}
                    />
                    {activeSection === item.id && <ChevronRight color="primary" fontSize="small" />}
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9}>
          {/* Header for Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {navItems.find(i => i.id === activeSection)?.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {navItems.find(i => i.id === activeSection)?.description}
            </Typography>
          </Box>

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mx: 'auto', 
                        mb: 2, 
                        fontSize: '2.5rem',
                        bgcolor: 'primary.main'
                      }}
                    >
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {user?.first_name} {user?.last_name}
                    </Typography>
                    <Chip 
                      label={user?.role?.replace('_', ' ').toUpperCase()} 
                      color={getRoleColor(user?.role || '')}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Button variant="outlined" size="small" sx={{ mt: 2 }}>
                      Change Photo
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                      Personal Details
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          value={profileForm.department}
                          onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Position"
                          value={profileForm.position}
                          onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button variant="contained" onClick={handleSaveProfile}>
                            Save Changes
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                      Change Password
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="New Password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          helperText="Minimum 8 characters"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showPassword}
                              onChange={(e) => setShowPassword(e.target.checked)}
                            />
                          }
                          label="Show passwords"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button variant="contained" onClick={handleChangePassword}>
                            Update Password
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                      Login Activity
                    </Typography>
                    <List disablePadding>
                      <ListItemButton disableGutters divider>
                        <ListItemText
                          primary="Last Login"
                          secondary={user?.created_at ? new Date(user.created_at).toLocaleString() : 'Never'}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        />
                      </ListItemButton>
                      <ListItemButton disableGutters divider>
                        <ListItemText
                          primary="Account Created"
                          secondary={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        />
                      </ListItemButton>
                      <ListItemButton disableGutters>
                        <ListItemText
                          primary="Two-Factor Authentication"
                          secondary="Not enabled"
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        />
                        <ListItemSecondaryAction>
                          <Button size="small">Enable</Button>
                        </ListItemSecondaryAction>
                      </ListItemButton>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  Notification Preferences
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Channels
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.email_notifications}
                          onChange={(e) => setNotificationSettings({ 
                            ...notificationSettings, 
                            email_notifications: e.target.checked 
                          })}
                        />
                      }
                      label="Email notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.push_notifications}
                          onChange={(e) => setNotificationSettings({ 
                            ...notificationSettings, 
                            push_notifications: e.target.checked 
                          })}
                        />
                      }
                      label="Browser push notifications"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Alert Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.inventory_alerts}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              inventory_alerts: e.target.checked 
                            })}
                          />
                        }
                        label="Inventory alerts (Low stock, Stockouts)"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.forecast_alerts}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              forecast_alerts: e.target.checked 
                            })}
                          />
                        }
                        label="Forecast updates & accuracy alerts"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.marketing_updates}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              marketing_updates: e.target.checked 
                            })}
                          />
                        }
                        label="Marketing campaign updates"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.system_maintenance}
                            onChange={(e) => setNotificationSettings({ 
                              ...notificationSettings, 
                              system_maintenance: e.target.checked 
                            })}
                          />
                        }
                        label="System maintenance announcements"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" onClick={handleSaveNotifications}>
                        Save Preferences
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* System Section */}
          {activeSection === 'system' && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  System Configuration
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={systemSettings.language}
                        onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                        label="Language"
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="ms">Bahasa Malaysia</MenuItem>
                        <MenuItem value="zh">中文</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                        label="Timezone"
                      >
                        <MenuItem value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur</MenuItem>
                        <MenuItem value="Asia/Singapore">Asia/Singapore</MenuItem>
                        <MenuItem value="Asia/Bangkok">Asia/Bangkok</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={systemSettings.currency}
                        onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                        label="Currency"
                      >
                        <MenuItem value="MYR">Malaysian Ringgit (MYR)</MenuItem>
                        <MenuItem value="SGD">Singapore Dollar (SGD)</MenuItem>
                        <MenuItem value="USD">US Dollar (USD)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={systemSettings.date_format}
                        onChange={(e) => setSystemSettings({ ...systemSettings, date_format: e.target.value })}
                        label="Date Format"
                      >
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={systemSettings.theme}
                        onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                        label="Theme"
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" onClick={handleSaveSystem}>
                        Save Configuration
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Company Section */}
          {activeSection === 'company' && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  Company Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={companySettings.company_name}
                      onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Business Registration Number"
                      value={companySettings.business_registration}
                      onChange={(e) => setCompanySettings({ ...companySettings, business_registration: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tax ID / GST Number"
                      value={companySettings.tax_id}
                      onChange={(e) => setCompanySettings({ ...companySettings, tax_id: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Website"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" onClick={handleSaveCompany}>
                        Save Company Details
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* User Management Section */}
          {activeSection === 'users' && user?.role === 'admin' && (
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Users & Permissions
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      setSelectedUser(null);
                      setUserDialogOpen(true);
                    }}
                  >
                    Add User
                  </Button>
                </Box>

                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={users}
                    columns={userColumns}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
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
          )}
        </Grid>
      </Grid>

      {/* User Dialog */}
      <AddUserDialog
        open={userDialogOpen}
        onClose={() => {
          setUserDialogOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserSuccess}
        user={selectedUser}
      />
    </Container>
  );
}
