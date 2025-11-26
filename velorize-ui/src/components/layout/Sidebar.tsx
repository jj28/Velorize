'use client';

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  People,
  LocalShipping,
  Assessment,
  TrendingUp,
  Schedule,
  Upload,
  Settings,
  ExpandLess,
  ExpandMore,
  AccountTree,
  Analytics,
  AutoGraph,
  OptimizeOutlined,
  CalendarToday,
  FileUpload,
  Category,
  Store,
  Business,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Image from 'next/image';

interface SidebarProps {
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Dashboard,
  },
  {
    label: 'Master Data',
    icon: Category,
    children: [
      {
        label: 'Products',
        path: '/products',
        icon: Inventory,
      },
      {
        label: 'Customers',
        path: '/customers',
        icon: People,
      },
      {
        label: 'Suppliers',
        path: '/suppliers',
        icon: LocalShipping,
      },
    ],
  },
  {
    label: 'Operations',
    icon: Settings,
    children: [
      {
        label: 'Bill of Materials',
        path: '/bom',
        icon: AccountTree,
      },
      {
        label: 'Inventory Management',
        path: '/inventory',
        icon: Store,
      },
      {
        label: 'Data Import',
        path: '/import',
        icon: FileUpload,
        roles: ['admin', 'sop_leader'],
      },
    ],
  },
  {
    label: 'Analytics & Forecasting',
    icon: Assessment,
    children: [
      {
        label: 'Analytics & Insights',
        path: '/analytics',
        icon: Analytics,
      },
      {
        label: 'Demand Forecasting',
        path: '/forecasting',
        icon: TrendingUp,
      },
      {
        label: 'Inventory Optimization',
        path: '/optimization',
        icon: OptimizeOutlined,
      },
    ],
  },
  {
    label: 'Planning',
    icon: CalendarToday,
    children: [
      {
        label: 'Marketing Calendar',
        path: '/marketing/calendar',
        icon: Schedule,
        roles: ['admin', 'sop_leader'],
      },
      {
        label: 'Annual Operating Plan',
        path: '/marketing/aop',
        icon: AutoGraph,
        roles: ['admin', 'sop_leader'],
      },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    children: [
      {
        label: 'User Management',
        path: '/users',
        icon: Business,
        roles: ['admin'],
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({ onMobileClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { user } = useAuthStore();
  const [openSections, setOpenSections] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Auto-expand section containing current path
    const currentSection = navigationItems.find(item => 
      item.children?.some(child => pathname.startsWith(child.path || ''))
    );
    
    if (currentSection && !openSections.includes(currentSection.label)) {
      setOpenSections(prev => [...prev, currentSection.label]);
    }
  }, [pathname, openSections]);

  const handleSectionToggle = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onMobileClose?.();
  };

  const isPathActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const hasPermission = (roles?: string[]) => {
    if (!roles || !user) return true;
    return roles.includes(user.role);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!hasPermission(item.roles)) {
      return null;
    }

    const isActive = item.path ? isPathActive(item.path) : false;
    const isOpen = openSections.includes(item.label);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <React.Fragment key={item.label}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleSectionToggle(item.label)}
              sx={{
                pl: 2 + depth * 2,
                py: 1,
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                <item.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.label} disablePadding>
        <ListItemButton
          onClick={() => item.path && handleNavigation(item.path)}
          sx={{
            pl: 2 + depth * 2,
            py: 1,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            backgroundColor: isActive ? 'primary.main' : 'transparent',
            color: isActive ? 'primary.contrastText' : 'text.primary',
            '&:hover': {
              backgroundColor: isActive ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ 
            color: 'inherit', 
            minWidth: 36,
          }}>
            <item.icon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {item.label}
                </Typography>
                {item.badge && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    color="secondary"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.25rem',
          }}
        >
          V
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Velorize
          </Typography>
          <Typography variant="caption" color="text.secondary">
            S&OP Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="body2" fontWeight="medium">
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role?.replace('_', ' ').toUpperCase()}
          </Typography>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ px: 0, py: 1 }}>
          {navigationItems.map(item => renderNavItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Velorize v0.1.0
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Malaysian F&B S&OP
        </Typography>
      </Box>
    </Box>
  );
}