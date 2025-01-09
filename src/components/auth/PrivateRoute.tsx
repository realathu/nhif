import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CircleNotch } from '@phosphor-icons/react';
import { auth } from '../../services/auth';
import { API_ENDPOINTS } from '../../config';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Verify token on component mount
    const verifyToken = async () => {
      try {
        const token = auth.getToken();
        if (!token) throw new Error('No token found');

        const response = await fetch(API_ENDPOINTS.verify, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Token verification failed');
        }

        // Decode token to check role
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const role = tokenData.role;

        // Check role if required
        if (requiredRole && role !== requiredRole) {
          throw new Error('Invalid role');
        }

        setIsValid(true);
      } catch (error) {
        console.error('Token verification failed:', error);
        auth.logout();
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircleNotch size={32} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
