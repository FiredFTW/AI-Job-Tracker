// client/src/pages/JobTrackerPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner, 
  Flex,
  Text,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import api from '../utils/api';
import ApplicationModal from '../components/ApplicationModal'; 

const JobTrackerPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const contentBg = useColorModeValue('white', 'gray.700'); 
    const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentApplication, setCurrentApplication] = useState(null);

    const handleApplicationAdded = (newApplication) => {
        setApplications([newApplication, ...applications]);
    };

    const handleAddNew = () => {
        setCurrentApplication(null); 
        onOpen();
    };

    const handleEdit = (app) => {
        setCurrentApplication(app); // Set the app to be edited
        onOpen();
    };

    const handleSave = (savedApplication) => {
        const exists = applications.find(app => app.id === savedApplication.id);
        if (exists) {
        // If it exists, we're updating: replace it in the array
        setApplications(applications.map(app => app.id === savedApplication.id ? savedApplication : app));
        } else {
        // If not, we're creating: add it to the start of the array
        setApplications([savedApplication, ...applications]);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this application?')) {
            try {
            await api.delete(`/applications/${id}`);
            setApplications(applications.filter((app) => app.id !== id));
            } catch (err) {
            console.error(err);
            }
        }
        };

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
    return (
      <Flex justify="center" align="center" h="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

return (
    <Box bg={contentBg} color={textColor} w="80%" mx="auto" p={4} borderWidth={1} borderRadius="lg" boxShadow="md" borderColor={borderColor}>
        <Box maxW="container.lg" mx="auto" p={4}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading>Job Application Tracker</Heading>
                <Button onClick={handleAddNew} colorScheme="blue">Add New Application</Button>
            </Flex>
            {applications.length === 0 ? (
                <Text>No applications found. Add one to get started!</Text>
            ) : (
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Company</Th>
                            <Th>Role</Th>
                            <Th>Status</Th>
                            <Th>Next Step</Th>
                            <Th>Last Contact</Th>
                            <Th>Date Applied</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {applications.map((app) => (
                            <Tr key={app.id}>
                                <Td>{app.company}</Td>
                                <Td>{app.role}</Td>
                                <Td>{app.status}</Td>
                                <Td>{app.nextStep || 'N/A'}</Td>
                                <Td>{app.lastContactedAt ? new Date(app.lastContactedAt).toLocaleDateString() : 'N/A'}</Td>
                                <Td>{new Date(app.appliedAt).toLocaleDateString()}</Td>
                                <Td>
                                    <Button size="sm" mr={2} onClick={() => handleEdit(app)}>Edit</Button>
                                    <Button size="sm" colorScheme="red" onClick={() => handleDelete(app.id)}>Delete</Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </Box>
        <ApplicationModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSave} // Use the new universal save handler
            existingApplication={currentApplication} // Pass the app to be edited
        />
    </Box>
);
};

export default JobTrackerPage;