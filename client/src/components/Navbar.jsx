import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Box, Flex, Button, Heading, Spacer, Text } from '@chakra-ui/react'; // Import Text for better semantics
import { Link as RouterLink } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import the new library

const Navbar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = jwtDecode(token);
        setUser(decodedToken.user); 
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
      handleLogout();
    }
  }, []);

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

      <Flex align="center">
        {user && ( 
          <Text mr={4}>
            Logged In As: <strong>{user.email.split("@")[0]}</strong>
          </Text>  
        )}
        <Button onClick={handleLogout} colorScheme="red" variant="solid">
          Logout
        </Button>
      </Flex>
    </Flex>
  );
};

export default Navbar;