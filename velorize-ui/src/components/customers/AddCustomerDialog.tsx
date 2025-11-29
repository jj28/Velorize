'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import toast from 'react-hot-toast';
import { customersApi } from '../../utils/apiExtensions';

interface AddCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomerFormData {
  customer_code: string;
  customer_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  credit_limit: number | string;
  payment_terms: string;
}

export function AddCustomerDialog({ open, onClose, onSuccess }: AddCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_code: '',
    customer_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    credit_limit: '',
    payment_terms: '30',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  const handleChange = (field: keyof CustomerFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!formData.customer_code.trim()) {
      newErrors.customer_code = 'Customer code is required';
    }
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    if (formData.credit_limit && Number(formData.credit_limit) < 0) {
      newErrors.credit_limit = 'Credit limit must be 0 or greater';
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
      const payload = {
        customer_code: formData.customer_code,
        customer_name: formData.customer_name,
        contact_person: formData.contact_person,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        credit_limit: formData.credit_limit ? Number(formData.credit_limit) : 0,
        payment_terms: Number(formData.payment_terms),
        status: 'active',
      };

      await customersApi.createCustomer(payload);
      toast.success('Customer created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      toast.error(error.response?.data?.detail || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        customer_code: '',
        customer_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        credit_limit: '',
        payment_terms: '30',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Add New Customer
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Customer Code */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Customer Code"
              value={formData.customer_code}
              onChange={handleChange('customer_code')}
              error={!!errors.customer_code}
              helperText={errors.customer_code}
              required
              disabled={loading}
            />
          </Grid>

          {/* Customer Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Customer Name"
              value={formData.customer_name}
              onChange={handleChange('customer_name')}
              error={!!errors.customer_name}
              helperText={errors.customer_name}
              required
              disabled={loading}
            />
          </Grid>

          {/* Contact Person */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.contact_person}
              onChange={handleChange('contact_person')}
              error={!!errors.contact_person}
              helperText={errors.contact_person}
              required
              disabled={loading}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading}
              placeholder="+60 12-345 6789"
            />
          </Grid>

          {/* Payment Terms */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Payment Terms (Days)"
              value={formData.payment_terms}
              onChange={handleChange('payment_terms')}
              disabled={loading}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Credit Limit */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Credit Limit (RM)"
              value={formData.credit_limit}
              onChange={handleChange('credit_limit')}
              error={!!errors.credit_limit}
              helperText={errors.credit_limit}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Address"
              value={formData.address}
              onChange={handleChange('address')}
              disabled={loading}
            />
          </Grid>

          {/* City */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={handleChange('city')}
              disabled={loading}
            />
          </Grid>

          {/* State */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="State"
              value={formData.state}
              onChange={handleChange('state')}
              disabled={loading}
            />
          </Grid>

          {/* Postal Code */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Postal Code"
              value={formData.postal_code}
              onChange={handleChange('postal_code')}
              disabled={loading}
            />
          </Grid>
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
          {loading ? 'Creating...' : 'Create Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
