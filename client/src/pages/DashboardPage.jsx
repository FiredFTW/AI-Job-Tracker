import React from 'react';
import Tasks from '../components/Tasks';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Spacer,
  Container,
  VStack,
  Text
} from '@chakra-ui/react';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Use navigate for SPA-friendly redirection
  };

  return (
    <Box bg="gray.800" minH="100vh" w="100%" minW="100vw"> 
      <Flex 
        as="header" 
        bg="blue.600" /* Slightly darker blue for better contrast on gray.800 */
        color="white" 
        p={4} 
        alignItems="center"
        w="100%" /* Ensure header is full width */
      >
        <Heading size="md">Productivity Dashboard</Heading>
        <Spacer />
        <Button colorScheme="red" onClick={handleLogout}>
          Logout
        </Button>
      </Flex>

      {/* Container will center content and provide max-width for readability */}
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
            <Heading fontSize="xl" mb={4}>Welcome!</Heading>
            <Text>This is your personal dashboard. Manage your tasks below.</Text>
          </Box>
          
          {/* Tasks are already in their own distinguished box */}
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
            <Tasks /> 
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage;