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
  FormControlLabel,
  Checkbox,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { productsApi } from '../../utils/apiExtensions';

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductFormData {
  product_code: string;
  product_name: string;
  category: string;
  uom: string;
  selling_price: number | string;
  cost_price: number | string;
  reorder_level: number | string;
  is_perishable: boolean;
  shelf_life_days: number | string;
  has_bom: boolean;
}

export function AddProductDialog({ open, onClose, onSuccess }: AddProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    product_code: '',
    product_name: '',
    category: '',
    uom: 'KG',
    selling_price: '',
    cost_price: '',
    reorder_level: '',
    is_perishable: false,
    shelf_life_days: '',
    has_bom: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const categories = [
    'finished_goods',
    'raw_materials',
    'packaging',
    'supplies',
  ];

  const uomOptions = [
    'KG', 'G', 'L', 'ML', 'PCS', 'BOX', 'CARTON', 'DOZEN', 'UNIT'
  ];

  const handleChange = (field: keyof ProductFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.product_code.trim()) {
      newErrors.product_code = 'Product code is required';
    }
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.selling_price || Number(formData.selling_price) <= 0) {
      newErrors.selling_price = 'Selling price must be greater than 0';
    }
    if (!formData.cost_price || Number(formData.cost_price) <= 0) {
      newErrors.cost_price = 'Cost price must be greater than 0';
    }
    if (!formData.reorder_level || Number(formData.reorder_level) < 0) {
      newErrors.reorder_level = 'Reorder level must be 0 or greater';
    }
    if (formData.is_perishable && (!formData.shelf_life_days || Number(formData.shelf_life_days) <= 0)) {
      newErrors.shelf_life_days = 'Shelf life is required for perishable items';
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
        product_code: formData.product_code,
        product_name: formData.product_name,
        category: formData.category,
        uom: formData.uom,
        selling_price: Number(formData.selling_price),
        cost_price: Number(formData.cost_price),
        reorder_level: Number(formData.reorder_level),
        is_perishable: formData.is_perishable,
        shelf_life_days: formData.is_perishable ? Number(formData.shelf_life_days) : null,
        has_bom: formData.has_bom,
        status: 'active',
      };

      await productsApi.createProduct(payload);
      toast.success('Product created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        product_code: '',
        product_name: '',
        category: '',
        uom: 'KG',
        selling_price: '',
        cost_price: '',
        reorder_level: '',
        is_perishable: false,
        shelf_life_days: '',
        has_bom: false,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Add New Product
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Product Code */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Product Code"
              value={formData.product_code}
              onChange={handleChange('product_code')}
              error={!!errors.product_code}
              helperText={errors.product_code}
              required
              disabled={loading}
            />
          </Grid>

          {/* Product Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Product Name"
              value={formData.product_name}
              onChange={handleChange('product_name')}
              error={!!errors.product_name}
              helperText={errors.product_name}
              required
              disabled={loading}
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Category"
              value={formData.category}
              onChange={handleChange('category')}
              error={!!errors.category}
              helperText={errors.category}
              required
              disabled={loading}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* UOM */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Unit of Measure"
              value={formData.uom}
              onChange={handleChange('uom')}
              disabled={loading}
            >
              {uomOptions.map((uom) => (
                <MenuItem key={uom} value={uom}>
                  {uom}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Selling Price */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Selling Price"
              value={formData.selling_price}
              onChange={handleChange('selling_price')}
              error={!!errors.selling_price}
              helperText={errors.selling_price}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          {/* Cost Price */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Cost Price"
              value={formData.cost_price}
              onChange={handleChange('cost_price')}
              error={!!errors.cost_price}
              helperText={errors.cost_price}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          {/* Reorder Level */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Reorder Level"
              value={formData.reorder_level}
              onChange={handleChange('reorder_level')}
              error={!!errors.reorder_level}
              helperText={errors.reorder_level}
              required
              disabled={loading}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Perishable Checkbox */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_perishable}
                  onChange={handleChange('is_perishable')}
                  disabled={loading}
                />
              }
              label="Perishable Item"
            />
          </Grid>

          {/* Shelf Life (conditional) */}
          {formData.is_perishable && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Shelf Life (Days)"
                value={formData.shelf_life_days}
                onChange={handleChange('shelf_life_days')}
                error={!!errors.shelf_life_days}
                helperText={errors.shelf_life_days}
                required
                disabled={loading}
                inputProps={{ min: 1 }}
              />
            </Grid>
          )}

          {/* Has BOM Checkbox */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.has_bom}
                  onChange={handleChange('has_bom')}
                  disabled={loading}
                />
              }
              label="Has Bill of Materials"
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
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
