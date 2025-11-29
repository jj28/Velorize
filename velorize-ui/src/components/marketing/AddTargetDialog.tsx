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
  MenuItem,
  Box,
} from '@mui/material';
import toast from 'react-hot-toast';
import { aopApi } from '../../utils/apiExtensions';

interface AddTargetDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TargetFormData {
  target_year: string;
  target_period: string;
  product_category: string;
  target_revenue: number | string;
  target_volume: number | string;
  notes: string;
}

export function AddTargetDialog({ open, onClose, onSuccess }: AddTargetDialogProps) {
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<TargetFormData>({
    target_year: currentYear.toString(),
    target_period: 'Q1',
    product_category: '',
    target_revenue: '',
    target_volume: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TargetFormData, string>>>({});

  const handleChange = (field: keyof TargetFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TargetFormData, string>> = {};

    if (!formData.target_year) {
      newErrors.target_year = 'Target year is required';
    }
    if (!formData.target_period) {
      newErrors.target_period = 'Target period is required';
    }
    if (!formData.product_category) {
      newErrors.product_category = 'Product/category is required';
    }
    if (!formData.target_revenue || Number(formData.target_revenue) <= 0) {
      newErrors.target_revenue = 'Target revenue must be greater than 0';
    }
    if (!formData.target_volume || Number(formData.target_volume) <= 0) {
      newErrors.target_volume = 'Target volume must be greater than 0';
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
        target_year: Number(formData.target_year),
        target_period: formData.target_period,
        product_category: formData.product_category,
        target_revenue: Number(formData.target_revenue),
        target_volume: Number(formData.target_volume),
        notes: formData.notes || null,
        status: 'active',
      };

      await aopApi.createTarget(payload);
      toast.success('AOP target created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create target:', error);
      toast.error(error.response?.data?.detail || 'Failed to create target');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        target_year: currentYear.toString(),
        target_period: 'Q1',
        product_category: '',
        target_revenue: '',
        target_volume: '',
        notes: '',
      });
      setErrors({});
      onClose();
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Annual'];
  const categories = [
    'All Products',
    'Finished Goods',
    'Sauces',
    'Seasonings',
    'Ingredients',
    'Packaging',
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 0 }}>
        Create AOP Target
      </DialogTitle>
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Annual Operating Plan - Sales Target
        </Typography>
      </Box>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Target Year */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Target Year"
              value={formData.target_year}
              onChange={handleChange('target_year')}
              error={!!errors.target_year}
              helperText={errors.target_year}
              required
              disabled={loading}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year.toString()}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Target Period */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Period"
              value={formData.target_period}
              onChange={handleChange('target_period')}
              error={!!errors.target_period}
              helperText={errors.target_period}
              required
              disabled={loading}
            >
              {periods.map((period) => (
                <MenuItem key={period} value={period}>
                  {period}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Product/Category */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Product / Category"
              value={formData.product_category}
              onChange={handleChange('product_category')}
              error={!!errors.product_category}
              helperText={errors.product_category}
              required
              disabled={loading}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Target Revenue */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Target Revenue (RM)"
              value={formData.target_revenue}
              onChange={handleChange('target_revenue')}
              error={!!errors.target_revenue}
              helperText={errors.target_revenue}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 1000 }}
            />
          </Grid>

          {/* Target Volume */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Target Volume (Units)"
              value={formData.target_volume}
              onChange={handleChange('target_volume')}
              error={!!errors.target_volume}
              helperText={errors.target_volume}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              disabled={loading}
              placeholder="Add any additional notes or context for this target..."
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
          {loading ? 'Creating...' : 'Create Target'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
