import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');

  // If the user is authenticated, render the children directly.
  // Layout is now applied in App.jsx for these routes.
  // If not, redirect to the login page.
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;