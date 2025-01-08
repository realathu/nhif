import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../services/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

export function PrivateRoute({ children, requiredRole = 'admin' }: PrivateRouteProps) {
  const location = useLocation();
  const token = auth.getToken();
  const userRole = auth.getRole();

  useEffect(() => {
    // Verify token on component mount
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:3000/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          auth.logout();
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  if (!token || !userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/form'} replace />;
  }

  return <>{children}</>;
}
