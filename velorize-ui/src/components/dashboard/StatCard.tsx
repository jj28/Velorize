import React from 'react';
import { Box, Card, CardContent, Typography, SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  subtitle
}) => {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: '12px', 
              bgcolor: (theme) => `${theme.palette[color].main}15`, // 15% opacity
              color: (theme) => theme.palette[color].main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon />
          </Box>
        </Box>
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: trend.isPositive ? 'success.main' : 'error.main',
                bgcolor: trend.isPositive ? 'success.lighter' : 'error.lighter',
                borderRadius: 1,
                px: 0.5
              }}
            >
              {trend.isPositive ? (
                <TrendingUp fontSize="small" sx={{ fontSize: 16 }} />
              ) : (
                <TrendingDown fontSize="small" sx={{ fontSize: 16 }} />
              )}
              <Typography variant="caption" fontWeight={600}>
                {Math.abs(trend.value)}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs last month
            </Typography>
          </Box>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
