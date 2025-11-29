'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { People, Add } from '@mui/icons-material';
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';

export default function CustomersPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // Reload customers data here
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <People sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              Customer Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => setAddDialogOpen(true)}
          >
            New Customer
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Customers
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Content */}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <People sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Customers Yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Add your first customer to start managing customer relationships
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            Add First Customer
          </Button>
        </Paper>

        {/* Add Customer Dialog */}
        <AddCustomerDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </Box>
    </Container>
  );
}
