import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  LocalOffer,
  Campaign,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface ExpirationLot {
  lotId: number;
  lotNumber: string;
  productCode: string;
  productName: string;
  category: string;
  expiryDate: string;
  quantityToClear: number;
  unit: string;
  daysLeft: number;
  trltReference: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  valueLoss: number;
  recommendedAction: 'DISPOSE' | 'URGENT_SALE' | 'RUN_PROMO' | 'MARKDOWN';
  location: string;
}

export function ActionRequiredTable() {
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<ExpirationLot[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ExpirationLot | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadActionItems();
  }, []);

  const loadActionItems = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/expiration/action-required');
      // const data = await response.json();
      // setLots(data.items);

      // Mock data
      const mockLots: ExpirationLot[] = [
        {
          lotId: 1,
          lotNumber: 'LOT-2024-001',
          productCode: 'PRD-004',
          productName: 'Palm Oil',
          category: 'OILS',
          expiryDate: '2024-12-05',
          quantityToClear: 50,
          unit: 'kg',
          daysLeft: 1,
          trltReference: 'TRLT: 8.8d',
          urgency: 'CRITICAL',
          valueLoss: 175,
          recommendedAction: 'DISPOSE',
          location: 'WAREHOUSE-A',
        },
        {
          lotId: 2,
          lotNumber: 'LOT-2024-003',
          productCode: 'PRD-003',
          productName: 'Rendang Curry Paste',
          category: 'SAUCE',
          expiryDate: '2024-12-07',
          quantityToClear: 120,
          unit: 'units',
          daysLeft: 3,
          trltReference: 'TRLT: 5.8d',
          urgency: 'CRITICAL',
          valueLoss: 338,
          recommendedAction: 'RUN_PROMO',
          location: 'WAREHOUSE-B',
        },
        {
          lotId: 3,
          lotNumber: 'LOT-2024-005',
          productCode: 'PRD-006',
          productName: 'Coconut Cream',
          category: 'DAIRY',
          expiryDate: '2024-12-10',
          quantityToClear: 80,
          unit: 'units',
          daysLeft: 6,
          trltReference: 'TRLT: 2.8d',
          urgency: 'HIGH',
          valueLoss: 240,
          recommendedAction: 'MARKDOWN',
          location: 'WAREHOUSE-A',
        },
        {
          lotId: 4,
          lotNumber: 'LOT-2024-007',
          productCode: 'PRD-010',
          productName: 'Fish Sauce Premium',
          category: 'SAUCE',
          expiryDate: '2024-12-12',
          quantityToClear: 45,
          unit: 'bottles',
          daysLeft: 8,
          trltReference: 'TRLT: 0.8d',
          urgency: 'HIGH',
          valueLoss: 185,
          recommendedAction: 'URGENT_SALE',
          location: 'WAREHOUSE-C',
        },
      ];

      setLots(mockLots);
    } catch (error) {
      console.error('Failed to load action items:', error);
      toast.error('Failed to load expiration action items');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (lot: ExpirationLot) => {
    setSelectedLot(lot);
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!selectedLot) return;

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/expiration/take-action', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     lotId: selectedLot.lotId,
      //     actionType: selectedLot.recommendedAction,
      //     quantity: selectedLot.quantityToClear,
      //     notes: actionNotes,
      //   }),
      // });

      toast.success(`Action "${selectedLot.recommendedAction}" recorded for ${selectedLot.productName}`);
      setActionDialogOpen(false);
      setActionNotes('');
      setSelectedLot(null);
      loadActionItems();
    } catch (error) {
      console.error('Failed to take action:', error);
      toast.error('Failed to record action');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DISPOSE':
        return <Delete />;
      case 'RUN_PROMO':
        return <Campaign />;
      case 'URGENT_SALE':
      case 'MARKDOWN':
        return <LocalOffer />;
      default:
        return null;
    }
  };

  const getActionButtonColor = (action: string) => {
    switch (action) {
      case 'DISPOSE':
        return 'error';
      case 'RUN_PROMO':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Batch Details</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>To Clear</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Countdown</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Value Loss</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    No items requiring immediate action
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              lots.map((lot) => (
                <TableRow
                  key={lot.lotId}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  {/* Product */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {lot.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lot.productCode} • {lot.category}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Batch Details */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {lot.lotNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exp: {new Date(lot.expiryDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* To Clear */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {lot.quantityToClear} {lot.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lot.location}
                    </Typography>
                  </TableCell>

                  {/* Countdown */}
                  <TableCell>
                    <Box>
                      <Chip
                        label={`${lot.daysLeft} ${lot.daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT`}
                        color={getUrgencyColor(lot.urgency)}
                        size="small"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {lot.trltReference}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Value Loss */}
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} color="error">
                      ${lot.valueLoss.toLocaleString()}
                    </Typography>
                  </TableCell>

                  {/* Action */}
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color={getActionButtonColor(lot.recommendedAction)}
                      size="small"
                      startIcon={getActionIcon(lot.recommendedAction)}
                      onClick={() => handleActionClick(lot)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {lot.recommendedAction.replace('_', ' ')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Action: {selectedLot?.recommendedAction.replace('_', ' ')}
        </DialogTitle>
        <DialogContent>
          {selectedLot && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Product:</strong> {selectedLot.productName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Lot:</strong> {selectedLot.lotNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Quantity:</strong> {selectedLot.quantityToClear} {selectedLot.unit}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Value at Risk:</strong> ${selectedLot.valueLoss}
              </Typography>
              <TextField
                label="Action Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Add any notes about this action..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleActionConfirm} variant="contained" color="primary">
            Confirm Action
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
