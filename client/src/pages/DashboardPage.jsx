import React from 'react';

const DashboardPage = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <div>
      <h1>Welcome to Your Dashboard</h1>
      <p>This is a protected page. You can only see this if you are logged in.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default DashboardPage;