// client/src/pages/JobTrackerPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api'; // Our custom axios instance
import {
  Box,
  Container,
  VStack,
  Text,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';

const JobTrackerPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const contentBg = useColorModeValue('white', 'gray.700'); 
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications');
        setApplications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return <p>Loading applications...</p>;
  }

return (
    <Container centerContent maxW="container.xl">
        <Box 
            p={6}
            shadow="lg"
            borderWidth="1px" 
            borderRadius="xl"
            bg={contentBg} 
            borderColor={borderColor}
            w="120%"
        >
            <Heading fontSize="2xl" mb={4} color={textColor}>
                Job Application Tracker
            </Heading>
            <pre>{JSON.stringify(applications, null, 2)}</pre>
        </Box>
    </Container>
);
};

export default JobTrackerPage;