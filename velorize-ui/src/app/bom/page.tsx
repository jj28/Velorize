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
import { AccountTree, Add } from '@mui/icons-material';
import { AddBOMDialog } from '@/components/bom/AddBOMDialog';

export default function BOMPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAddSuccess = () => {
    // Reload BOM data here
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountTree sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              Bill of Materials
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => setAddDialogOpen(true)}
          >
            New BOM
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total BOMs
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active BOMs
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Content */}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AccountTree sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No BOMs Yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Create your first Bill of Materials to start managing product compositions
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            Create First BOM
          </Button>
        </Paper>

        {/* Add BOM Dialog */}
        <AddBOMDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </Box>
    </Container>
  );
}
