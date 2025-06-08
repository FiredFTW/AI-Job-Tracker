// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// --- CHAKRA IMPORT: We'll use Box for the main layout ---
import { Box } from '@chakra-ui/react';

// --- PAGE IMPORTS ---
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute';
import JobTrackerPage from './pages/JobTrackerPage';
import Layout from './components/Layout'; // Import the Layout component

function App() {
  return (
    <Router>
      <Box minH="100vh" bg="gray.800" w="100%" minW="100vw"> {/* Ensure minW is 100vw */}
        <Routes>
          {/* Public Routes without Layout/Navbar */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with Layout/Navbar */}
          <Route
            path="/dashboard"
            element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>}
          />
          <Route
            path="/jobs"
            element={<PrivateRoute><Layout><JobTrackerPage /></Layout></PrivateRoute>}
          />
          
          {/* Default route */}
          <Route
            path="/"
            element={
              localStorage.getItem('token') ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;