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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Box,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { bomApi } from '../../utils/apiExtensions';

interface AddBOMDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BOMItem {
  material_id: string;
  material_name: string;
  quantity: number | string;
  uom: string;
}

interface BOMFormData {
  product_id: string;
  product_name: string;
  bom_name: string;
  version: string;
  items: BOMItem[];
}

export function AddBOMDialog({ open, onClose, onSuccess }: AddBOMDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BOMFormData>({
    product_id: '',
    product_name: '',
    bom_name: '',
    version: '1.0',
    items: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BOMFormData, string>>>({});

  const handleChange = (field: keyof BOMFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { material_id: '', material_name: '', quantity: '', uom: 'KG' }
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof BOMItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BOMFormData, string>> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product selection is required';
    }
    if (!formData.bom_name.trim()) {
      newErrors.bom_name = 'BOM name is required';
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one material to the BOM');
      return false;
    }

    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.material_id) {
        toast.error(`Material ${i + 1}: Please select a material`);
        return false;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error(`Material ${i + 1}: Quantity must be greater than 0`);
        return false;
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
      const payload = {
        product_id: Number(formData.product_id),
        bom_name: formData.bom_name,
        version: formData.version,
        status: 'active',
        items: formData.items.map(item => ({
          material_id: Number(item.material_id),
          quantity: Number(item.quantity),
          uom: item.uom,
        })),
      };

      await bomApi.createBOM(payload);
      toast.success('BOM created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create BOM:', error);
      toast.error(error.response?.data?.detail || 'Failed to create BOM');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        product_id: '',
        product_name: '',
        bom_name: '',
        version: '1.0',
        items: [],
      });
      setErrors({});
      onClose();
    }
  };

  // Mock products with has_bom = true
  const bomEligibleProducts = [
    { id: '1', name: 'Nasi Lemak Sauce', code: 'PRD-001' },
    { id: '3', name: 'Rendang Curry Paste', code: 'PRD-003' },
  ];

  // Mock materials
  const availableMaterials = [
    { id: '10', name: 'Coconut Milk Powder', code: 'MAT-010', uom: 'KG' },
    { id: '11', name: 'Palm Oil', code: 'MAT-011', uom: 'L' },
    { id: '12', name: 'Chili Powder', code: 'MAT-012', uom: 'KG' },
    { id: '13', name: 'Tamarind Paste', code: 'MAT-013', uom: 'KG' },
    { id: '14', name: 'Garlic', code: 'MAT-014', uom: 'KG' },
    { id: '15', name: 'Shallots', code: 'MAT-015', uom: 'KG' },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Create Bill of Materials (BOM)
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Product Selection */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Select Product"
              value={formData.product_id}
              onChange={(e) => {
                const product = bomEligibleProducts.find(p => p.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  product_id: e.target.value,
                  product_name: product?.name || '',
                }));
              }}
              error={!!errors.product_id}
              helperText={errors.product_id || 'Only products with BOM enabled'}
              required
              disabled={loading}
            >
              <MenuItem value="">Select a product...</MenuItem>
              {bomEligibleProducts.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.code} - {product.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* BOM Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="BOM Name"
              value={formData.bom_name}
              onChange={handleChange('bom_name')}
              error={!!errors.bom_name}
              helperText={errors.bom_name}
              required
              disabled={loading}
              placeholder="e.g., Standard Recipe"
            />
          </Grid>

          {/* Version */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Version"
              value={formData.version}
              onChange={handleChange('version')}
              disabled={loading}
              helperText="Version number for this BOM"
            />
          </Grid>

          {/* Materials Table */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Materials / Ingredients
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={loading}
                size="small"
              >
                Add Material
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell width={50}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">
                          No materials added yet. Click "Add Material" to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={item.material_id}
                            onChange={(e) => {
                              const material = availableMaterials.find(m => m.id === e.target.value);
                              handleItemChange(index, 'material_id', e.target.value);
                              handleItemChange(index, 'material_name', material?.name || '');
                              handleItemChange(index, 'uom', material?.uom || 'KG');
                            }}
                            disabled={loading}
                          >
                            <MenuItem value="">Select material...</MenuItem>
                            {availableMaterials.map((material) => (
                              <MenuItem key={material.id} value={material.id}>
                                {material.code} - {material.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            disabled={loading}
                            inputProps={{ min: 0, step: 0.001 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.uom}
                            disabled
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                            disabled={loading}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
          disabled={loading || !formData.product_id || formData.items.length === 0}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Creating...' : 'Create BOM'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
