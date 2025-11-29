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
} from '@mui/material';
import toast from 'react-hot-toast';
import { marketingApi } from '../../utils/apiExtensions';

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EventFormData {
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  target_products: string;
  expected_lift: number | string;
  description: string;
}

export function AddEventDialog({ open, onClose, onSuccess }: AddEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    event_type: '',
    start_date: '',
    end_date: '',
    target_products: '',
    expected_lift: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  const handleChange = (field: keyof EventFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }
    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (formData.expected_lift && (Number(formData.expected_lift) < 0 || Number(formData.expected_lift) > 1000)) {
      newErrors.expected_lift = 'Expected lift must be between 0 and 1000%';
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
        event_name: formData.event_name,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        target_products: formData.target_products || null,
        expected_lift: formData.expected_lift ? Number(formData.expected_lift) / 100 : 0,
        description: formData.description || null,
        status: 'planned',
      };

      await marketingApi.createEvent(payload);
      toast.success('Marketing event created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create event:', error);
      toast.error(error.response?.data?.detail || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        event_name: '',
        event_type: '',
        start_date: '',
        end_date: '',
        target_products: '',
        expected_lift: '',
        description: '',
      });
      setErrors({});
      onClose();
    }
  };

  const eventTypes = [
    'Promotion',
    'Flash Sale',
    'Seasonal Campaign',
    'Product Launch',
    'Clearance Sale',
    'Bundle Offer',
    'Loyalty Program',
    'Festive Sale',
    'Trade Show',
    'Other',
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Create Marketing Event
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Event Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Event Name"
              value={formData.event_name}
              onChange={handleChange('event_name')}
              error={!!errors.event_name}
              helperText={errors.event_name}
              required
              disabled={loading}
              placeholder="e.g., Ramadan Promo 2024"
            />
          </Grid>

          {/* Event Type */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Event Type"
              value={formData.event_type}
              onChange={handleChange('event_type')}
              error={!!errors.event_type}
              helperText={errors.event_type}
              required
              disabled={loading}
            >
              {eventTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={formData.start_date}
              onChange={handleChange('start_date')}
              error={!!errors.start_date}
              helperText={errors.start_date}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={formData.end_date}
              onChange={handleChange('end_date')}
              error={!!errors.end_date}
              helperText={errors.end_date}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Target Products */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Target Products"
              value={formData.target_products}
              onChange={handleChange('target_products')}
              disabled={loading}
              placeholder="e.g., All Sauces, PRD-001"
              helperText="Leave empty for all products"
            />
          </Grid>

          {/* Expected Lift */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Expected Lift (%)"
              value={formData.expected_lift}
              onChange={handleChange('expected_lift')}
              error={!!errors.expected_lift}
              helperText={errors.expected_lift || 'Expected sales increase percentage'}
              disabled={loading}
              inputProps={{ min: 0, max: 1000, step: 1 }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              disabled={loading}
              placeholder="Describe the marketing event, target audience, and key activities..."
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
          {loading ? 'Creating...' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
