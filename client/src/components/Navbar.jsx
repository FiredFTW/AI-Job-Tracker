import React from 'react';
import { Box, Flex, Button, Heading, Spacer } from '@chakra-ui/react'; // Add Spacer
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Flex
      as="nav"
      align="center"
      wrap="wrap"
      padding="1.5rem"
      bg="blue.600" // Changed background to a shade of blue
      color="white"
    >
      <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
        LifeDash
      </Heading>

      <Box ml={8}>
        {/* The link to your original dashboard (Task Manager) */}
        <Button as={RouterLink} to="/dashboard" variant="ghost" _hover={{ bg: 'blue.700' }} _active={{ bg: 'blue.800' }}>
          Dashboard
        </Button>

        {/* The NEW link to the Job Tracker */}
        <Button as={RouterLink} to="/jobs" variant="ghost" _hover={{ bg: 'blue.700' }} _active={{ bg: 'blue.800' }}>
          Job Tracker
        </Button>
      </Box>
      
      <Spacer /> {/* This pushes the logout button to the far right */}

      <Box>
        <Button onClick={handleLogout} colorScheme="red" variant="solid"> {/* Ensured solid variant for clear visibility */}
          Logout
        </Button>
      </Box>
    </Flex>
  );
};

export default Navbar;