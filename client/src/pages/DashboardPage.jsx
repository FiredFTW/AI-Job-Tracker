import React from 'react';
import Tasks from '../components/Tasks';
import {
  Box,
  Container,
  VStack,
  Text,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';

const DashboardPage = () => {
  const contentBg = useColorModeValue('gray.700', 'gray.700'); 
  const textColor = useColorModeValue('whiteAlpha.900', 'whiteAlpha.900');
  const borderColor = useColorModeValue('gray.600', 'gray.600');

  return (
    <Box w="100%" minW="100wh"> 
      <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          <Box 
            p={6}
            shadow="lg"
            borderWidth="1px" 
            borderRadius="xl"
            bg={contentBg} 
            borderColor={borderColor}
          >
            <Heading fontSize="2xl" mb={4} color={textColor}>Welcome Back!</Heading>
            <Text color={textColor}>This is your personal dashboard. Manage your tasks efficiently.</Text>
          </Box>
          
          <Box 
            p={6}
            shadow="lg"
            borderWidth="1px" 
            borderRadius="xl"
            bg={contentBg} 
            borderColor={borderColor}
          >
            <Tasks /> 
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage;