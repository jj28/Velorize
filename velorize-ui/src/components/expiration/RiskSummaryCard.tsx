import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  TrendingUp,
} from '@mui/icons-material';

interface RiskSummaryCardProps {
  type: 'immediate' | 'projected';
  totalValue: number;
  itemCount: number;
  horizonDays?: number;
  loading?: boolean;
}

export function RiskSummaryCard({
  type,
  totalValue,
  itemCount,
  horizonDays = 7,
  loading = false,
}: RiskSummaryCardProps) {
  const isImmediate = type === 'immediate';

  return (
    <Card
      sx={{
        background: isImmediate
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
          : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        border: `2px solid ${isImmediate ? '#FCA5A5' : '#FCD34D'}`,
        boxShadow: isImmediate
          ? '0 4px 12px rgba(220, 38, 38, 0.15)'
          : '0 4px 12px rgba(245, 158, 11, 0.15)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Icon Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: -15,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: isImmediate ? '#DC2626' : '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {isImmediate ? (
            <Warning sx={{ color: '#FFFFFF', fontSize: 28 }} />
          ) : (
            <TrendingUp sx={{ color: '#FFFFFF', fontSize: 28 }} />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 700,
            color: isImmediate ? '#991B1B' : '#92400E',
            display: 'block',
            mb: 1,
          }}
        >
          {isImmediate ? 'Immediate Value at Risk' : `Projected Risk (Next ${horizonDays} Days)`}
        </Typography>

        {/* Value */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: isImmediate ? '#DC2626' : '#F59E0B',
                mb: 1,
              }}
            >
              ${totalValue.toLocaleString()}
            </Typography>

            {/* Item Count */}
            <Typography
              variant="body2"
              sx={{
                color: isImmediate ? '#991B1B' : '#92400E',
                fontWeight: 500,
              }}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'items'} require{itemCount === 1 ? 's' : ''} {isImmediate ? 'immediate clearance' : 'attention'}
            </Typography>

            {/* Status Bar */}
            <Box
              sx={{
                mt: 2,
                height: 4,
                borderRadius: 2,
                background: isImmediate
                  ? 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)'
                  : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
