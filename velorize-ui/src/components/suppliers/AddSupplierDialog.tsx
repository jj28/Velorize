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
import { suppliersApi } from '../../utils/apiExtensions';

interface AddSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SupplierFormData {
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  lead_time_days: number | string;
  payment_terms: string;
}

export function AddSupplierDialog({ open, onClose, onSuccess }: AddSupplierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    supplier_code: '',
    supplier_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    lead_time_days: '',
    payment_terms: '30',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({});

  const handleChange = (field: keyof SupplierFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SupplierFormData, string>> = {};

    if (!formData.supplier_code.trim()) {
      newErrors.supplier_code = 'Supplier code is required';
    }
    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = 'Supplier name is required';
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
    if (!formData.lead_time_days || Number(formData.lead_time_days) < 0) {
      newErrors.lead_time_days = 'Lead time must be 0 or greater';
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
        supplier_code: formData.supplier_code,
        supplier_name: formData.supplier_name,
        contact_person: formData.contact_person,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        lead_time_days: Number(formData.lead_time_days),
        payment_terms: Number(formData.payment_terms),
        status: 'active',
      };

      await suppliersApi.createSupplier(payload);
      toast.success('Supplier created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create supplier:', error);
      toast.error(error.response?.data?.detail || 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        supplier_code: '',
        supplier_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        lead_time_days: '',
        payment_terms: '30',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Add New Supplier
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Supplier Code */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Supplier Code"
              value={formData.supplier_code}
              onChange={handleChange('supplier_code')}
              error={!!errors.supplier_code}
              helperText={errors.supplier_code}
              required
              disabled={loading}
            />
          </Grid>

          {/* Supplier Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={formData.supplier_name}
              onChange={handleChange('supplier_name')}
              error={!!errors.supplier_name}
              helperText={errors.supplier_name}
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

          {/* Lead Time */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Lead Time (Days)"
              value={formData.lead_time_days}
              onChange={handleChange('lead_time_days')}
              error={!!errors.lead_time_days}
              helperText={errors.lead_time_days}
              required
              disabled={loading}
              inputProps={{ min: 0 }}
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
          {loading ? 'Creating...' : 'Create Supplier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
