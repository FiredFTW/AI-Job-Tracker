// client/src/components/Layout.jsx
import React from 'react';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar'; // Import the navbar

const Layout = ({ children }) => {
  return (
    <Box minW={"100"}>
      <Navbar /> {/* Render the navbar at the top */}
      <Box p="4">{children}</Box> {/* Render the page content below with some padding */}
    </Box>
  );
};

export default Layout;