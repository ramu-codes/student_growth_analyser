 import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user } = useAuth();

  // If user is logged in, show the child component (Outlet)
  // Otherwise, redirect to the login page
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;