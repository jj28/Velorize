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
  FormControl,
  InputLabel,
  Select,
  Box,
  Alert,
} from '@mui/material';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../utils/apiExtensions';

interface AdjustStockDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AdjustStockFormData {
  product_id: string;
  product_name: string;
  current_soh: number;
  adjustment_type: 'INCREASE' | 'DECREASE' | 'SET';
  quantity: number | string;
  reason: string;
  notes: string;
  date: string;
}

export function AdjustStockDialog({ open, onClose, onSuccess }: AdjustStockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AdjustStockFormData>({
    product_id: '',
    product_name: '',
    current_soh: 0,
    adjustment_type: 'INCREASE',
    quantity: '',
    reason: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AdjustStockFormData, string>>>({});

  const handleChange = (field: keyof AdjustStockFormData) => (
    event: any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AdjustStockFormData, string>> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product selection is required';
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate sufficient stock for decrease
    if (formData.adjustment_type === 'DECREASE') {
      const qty = Number(formData.quantity);
      if (qty > formData.current_soh) {
        newErrors.quantity = `Cannot decrease more than current SOH (${formData.current_soh})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNewSOH = (): number => {
    const qty = Number(formData.quantity);
    switch (formData.adjustment_type) {
      case 'INCREASE':
        return formData.current_soh + qty;
      case 'DECREASE':
        return formData.current_soh - qty;
      case 'SET':
        return qty;
      default:
        return formData.current_soh;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        product_id: Number(formData.product_id),
        adjustment_type: formData.adjustment_type,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || null,
        adjustment_date: formData.date,
        new_soh: calculateNewSOH(),
      };

      await inventoryApi.adjustStock(payload);
      toast.success('Stock adjusted successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      toast.error(error.response?.data?.detail || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        product_id: '',
        product_name: '',
        current_soh: 0,
        adjustment_type: 'INCREASE',
        quantity: '',
        reason: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      onClose();
    }
  };

  const reasonOptions = [
    'Stock Receipt',
    'Production Output',
    'Sales Return',
    'Damaged Goods',
    'Expired Items',
    'Theft/Loss',
    'Inventory Count Correction',
    'Transfer In',
    'Transfer Out',
    'Quality Issue',
    'Other',
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Adjust Stock
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Product Selection (Mock - in real app, use autocomplete) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Select Product"
              value={formData.product_id}
              onChange={(e) => {
                // In real app, fetch product details
                setFormData(prev => ({
                  ...prev,
                  product_id: e.target.value,
                  product_name: 'Sample Product', // Mock
                  current_soh: 100, // Mock - fetch from API
                }));
              }}
              error={!!errors.product_id}
              helperText={errors.product_id}
              required
              disabled={loading}
            >
              <MenuItem value="">Select a product...</MenuItem>
              <MenuItem value="1">Nasi Lemak Sauce (SOH: 100)</MenuItem>
              <MenuItem value="2">Coconut Milk Powder (SOH: 250)</MenuItem>
              <MenuItem value="3">Rendang Curry Paste (SOH: 75)</MenuItem>
            </TextField>
          </Grid>

          {/* Current SOH Display */}
          {formData.product_id && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Current Stock on Hand:</strong> {formData.current_soh} units
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Adjustment Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={formData.adjustment_type}
                label="Adjustment Type"
                onChange={handleChange('adjustment_type')}
              >
                <MenuItem value="INCREASE">Increase Stock</MenuItem>
                <MenuItem value="DECREASE">Decrease Stock</MenuItem>
                <MenuItem value="SET">Set Stock Level</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Quantity */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={formData.adjustment_type === 'SET' ? 'New Stock Level' : 'Quantity'}
              value={formData.quantity}
              onChange={handleChange('quantity')}
              error={!!errors.quantity}
              helperText={errors.quantity}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          {/* Projected New SOH */}
          {formData.product_id && formData.quantity && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.light',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  New Stock on Hand:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.dark">
                  {calculateNewSOH()} units
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Reason */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Reason"
              value={formData.reason}
              onChange={handleChange('reason')}
              error={!!errors.reason}
              helperText={errors.reason}
              required
              disabled={loading}
            >
              {reasonOptions.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Date */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Adjustment Date"
              value={formData.date}
              onChange={handleChange('date')}
              error={!!errors.date}
              helperText={errors.date}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              disabled={loading}
              placeholder="Enter any additional details about this adjustment..."
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
          disabled={loading || !formData.product_id}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Adjusting...' : 'Adjust Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
