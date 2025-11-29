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
import { CalendarToday, Add } from '@mui/icons-material';
import { AddEventDialog } from '@/components/marketing/AddEventDialog';

export default function MarketingCalendarPage() {
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);

  const handleAddSuccess = () => {
    // Reload events data here
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarToday sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              Marketing Calendar
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => setAddEventDialogOpen(true)}
          >
            New Event
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Upcoming Events
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Promotions
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  This Month
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Content */}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CalendarToday sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Marketing Events
          </Typography>
          <Typography color="text.secondary" paragraph>
            Create your first marketing event to plan promotions and track their impact
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddEventDialogOpen(true)}>
            Create Marketing Event
          </Button>
        </Paper>

        {/* Add Event Dialog */}
        <AddEventDialog
          open={addEventDialogOpen}
          onClose={() => setAddEventDialogOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </Box>
    </Container>
  );
}
