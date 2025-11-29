'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { AppLayout } from '../layout/AppLayout';
import { Box, CircularProgress } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login', '/register'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, initialize } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    initialize();
    setIsLoading(false);
  }, [initialize]);

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      } else if (isAuthenticated && isPublicRoute) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Public routes don't need auth wrapper
  const isPublicRoute = publicRoutes.includes(pathname);
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes need auth and layout
  if (isAuthenticated && user) {
    return (
      <AppLayout>
        {children}
      </AppLayout>
    );
  }

  // Show nothing while redirecting
  return null;
}