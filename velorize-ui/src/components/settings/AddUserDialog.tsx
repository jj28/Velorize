'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { usersApi } from '../../utils/apiExtensions';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

interface User {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'sop_leader' | 'viewer';
  password?: string;
}

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'sop_leader' | 'viewer';
  password: string;
  confirm_password: string;
}

export function AddUserDialog({ open, onClose, onSuccess, user }: AddUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  useEffect(() => {
    if (open && user) {
      // Edit mode - populate form
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        password: '',
        confirm_password: '',
      });
    } else if (open && !user) {
      // Create mode - reset form
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        password: '',
        confirm_password: '',
      });
    }
  }, [open, user]);

  const handleChange = (field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Password validation only for new users or if password is being changed
    if (!user || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      // Include password if creating new user or updating password
      if (!user || formData.password) {
        payload.password = formData.password;
      }

      if (user?.id) {
        // Update existing user
        await usersApi.updateUser(user.id, payload);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await usersApi.createUser(payload);
        toast.success('User created successfully');
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      const errorMessage = error.response?.data?.detail || 
        (user ? 'Failed to update user' : 'Failed to create user');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        password: '',
        confirm_password: '',
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {user ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Username */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={handleChange('username')}
              error={!!errors.username}
              helperText={errors.username}
              required
              disabled={loading || !!user} // Username cannot be changed after creation
            />
          </Grid>

          {/* First Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name}
              onChange={handleChange('first_name')}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
              disabled={loading}
            />
          </Grid>

          {/* Last Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name}
              onChange={handleChange('last_name')}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
              disabled={loading}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              required
              disabled={loading}
            />
          </Grid>

          {/* Role */}
          <Grid item xs={12}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, role: e.target.value as any }));
                  if (errors.role) {
                    setErrors(prev => ({ ...prev, role: '' }));
                  }
                }}
              >
                <MenuItem value="viewer">Viewer - Read-only access</MenuItem>
                <MenuItem value="sop_leader">S&OP Leader - Planning & forecasting</MenuItem>
                <MenuItem value="admin">Admin - Full system access</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Password */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label={user ? 'New Password (leave empty to keep current)' : 'Password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              required={!user}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Confirm Password */}
          {(!user || formData.password) && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                value={formData.confirm_password}
                onChange={handleChange('confirm_password')}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password}
                required={!user || !!formData.password}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? (user ? 'Updating...' : 'Creating...') : (user ? 'Update User' : 'Create User')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
