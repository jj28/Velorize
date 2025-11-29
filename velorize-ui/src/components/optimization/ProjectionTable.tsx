import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography,
  Chip,
  Box,
  Tooltip
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { ProductProjection } from './ProductProjectionCard';

interface ProjectionTableProps {
  products: ProductProjection[];
  onProductClick: (product: ProductProjection) => void;
}

export const ProjectionTable: React.FC<ProjectionTableProps> = ({ products, onProductClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCESS': return 'warning';
      case 'OPTIMAL': return 'success';
      case 'LOW STOCK': return 'error';
      case 'STOCK OUT': return 'error';
      default: return 'default';
    }
  };

  const getTrajectoryColor = (value: number, safetyStock: number) => {
    if (value <= 0) return 'error.main';
    if (value < safetyStock) return 'warning.main';
    return 'primary.main';
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #EAECF0' }}>
      <Table sx={{ minWidth: 650 }} aria-label="inventory projection table">
        <TableHead>
          <TableRow>
            <TableCell colSpan={3} sx={{ borderRight: '1px solid #EAECF0', bgcolor: '#F9FAFB', fontWeight: 600, color: '#475467' }}>PRODUCT DETAILS</TableCell>
            <TableCell colSpan={3} sx={{ borderRight: '1px solid #EAECF0', bgcolor: '#F9FAFB', fontWeight: 600, color: '#475467', textAlign: 'center' }}>STOCK HEALTH</TableCell>
            <TableCell colSpan={4} sx={{ borderRight: '1px solid #EAECF0', bgcolor: '#F9FAFB', fontWeight: 600, color: '#475467', textAlign: 'center' }}>INCOMING STOCKS</TableCell>
            <TableCell colSpan={4} sx={{ borderRight: '1px solid #EAECF0', bgcolor: '#F9FAFB', fontWeight: 600, color: '#475467', textAlign: 'center' }}>ROLLING FORECAST</TableCell>
            <TableCell colSpan={3} sx={{ bgcolor: '#F9FAFB', fontWeight: 600, color: '#2563EB', textAlign: 'center' }}>INVENTORY PROJECTION</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>SKU</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#667085', borderRight: '1px solid #EAECF0' }}>Name</TableCell>
            
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>Coverage</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085', borderRight: '1px solid #EAECF0' }}>Action</TableCell>
            
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>M0</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>M1</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>M2</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085', borderRight: '1px solid #EAECF0' }}>M3</TableCell>
            
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>M0</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>M1</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085' }}>M2</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#667085', borderRight: '1px solid #EAECF0' }}>M3</TableCell>
            
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#2563EB' }}>M0</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#2563EB' }}>M1</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#2563EB' }}>M2</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((row) => (
            <TableRow
              key={row.sku}
              onClick={() => onProductClick(row)}
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F9FAFB', cursor: 'pointer' } }}
            >
              <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                {row.sku}
              </TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell sx={{ borderRight: '1px solid #EAECF0', fontWeight: 500 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {row.name}
                  <Typography variant="caption" fontWeight={600} sx={{ color: 'text.secondary' }}>SOH: {row.metrics.soh}</Typography>
                </Box>
              </TableCell>
              
              <TableCell align="center" sx={{ color: row.metrics.coverage > 60 ? 'warning.main' : 'text.primary', fontWeight: 600 }}>
                {row.metrics.coverage.toFixed(1)} d
              </TableCell>
              <TableCell align="center">
                <Chip 
                  label={row.status} 
                  color={getStatusColor(row.status)} 
                  size="small" 
                  sx={{ height: 20, fontSize: '10px', fontWeight: 600 }} 
                />
              </TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #EAECF0' }}>
                <Tooltip title="View Analysis">
                   <TrendingUp color="action" fontSize="small" />
                </Tooltip>
              </TableCell>
              
              {/* Incoming */}
              <TableCell align="center" sx={{ color: '#667085' }}>-</TableCell>
              <TableCell align="center" sx={{ color: '#667085' }}>{row.trajectory[1]?.incoming || '-'}</TableCell>
              <TableCell align="center" sx={{ color: '#667085' }}>{row.trajectory[2]?.incoming || '-'}</TableCell>
              <TableCell align="center" sx={{ color: '#667085', borderRight: '1px solid #EAECF0' }}>{row.trajectory[3]?.incoming || '-'}</TableCell>
              
              {/* Forecast */}
              <TableCell align="center" sx={{ color: '#667085' }}>{row.trajectory[0]?.forecast}</TableCell>
              <TableCell align="center" sx={{ color: '#667085' }}>{row.trajectory[1]?.forecast}</TableCell>
              <TableCell align="center" sx={{ color: '#667085' }}>{row.trajectory[2]?.forecast}</TableCell>
              <TableCell align="center" sx={{ color: '#667085', borderRight: '1px solid #EAECF0' }}>{row.trajectory[3]?.forecast}</TableCell>
              
              {/* Projection */}
              <TableCell align="center" sx={{ fontWeight: 700, color: getTrajectoryColor(row.trajectory[0]?.projectedSoh, row.parameters.safetyStock) }}>
                {row.trajectory[0]?.projectedSoh}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: getTrajectoryColor(row.trajectory[1]?.projectedSoh, row.parameters.safetyStock) }}>
                {row.trajectory[1]?.projectedSoh}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: getTrajectoryColor(row.trajectory[2]?.projectedSoh, row.parameters.safetyStock) }}>
                {row.trajectory[2]?.projectedSoh}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
