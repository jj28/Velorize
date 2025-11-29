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
import { AutoGraph, Add } from '@mui/icons-material';
import { AddTargetDialog } from '@/components/marketing/AddTargetDialog';

export default function AOPPage() {
  const [addTargetDialogOpen, setAddTargetDialogOpen] = useState(false);

  const handleAddSuccess = () => {
    // Reload targets data here
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoGraph sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              Annual Operating Plan
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => setAddTargetDialogOpen(true)}
          >
            New Target
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Annual Targets
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  YTD Achievement
                </Typography>
                <Typography variant="h4">0%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  On Track
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  At Risk
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Content */}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AutoGraph sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No AOP Targets
          </Typography>
          <Typography color="text.secondary" paragraph>
            Set up your Annual Operating Plan targets to track business performance
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddTargetDialogOpen(true)}>
            Create AOP Target
          </Button>
        </Paper>

        {/* Add Target Dialog */}
        <AddTargetDialog
          open={addTargetDialogOpen}
          onClose={() => setAddTargetDialogOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </Box>
    </Container>
  );
}
