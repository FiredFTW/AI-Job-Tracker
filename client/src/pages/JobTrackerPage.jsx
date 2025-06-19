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
    useDisclosure,
    useToast,
    Collapse,
    IconButton,
    Icon,
    VStack,
    Input, // Add Input to imports
} from '@chakra-ui/react';
import api from '../utils/api';
import ApplicationModal from '../components/ApplicationModal'; 
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const JobTrackerPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const contentBg = useColorModeValue('gray.700', 'gray.700'); 
    const textColor = useColorModeValue('whiteAlpha.900', 'whiteAlpha.900');
    const borderColor = useColorModeValue('gray.600', 'gray.600');
    const tableHeaderColor = useColorModeValue('gray.200', 'gray.200'); 
    const iconButtonColor = useColorModeValue('whiteAlpha.900', 'whiteAlpha.900'); 
    const interactionBg = useColorModeValue('gray.700', 'gray.700'); 
    const interactionTextColor = useColorModeValue('whiteAlpha.900', 'whiteAlpha.900'); 
    const interactionSubjectColor = useColorModeValue('gray.400', 'gray.400'); 
    const rejectedRowBg = useColorModeValue('red.900', 'red.900'); // For rejected applications
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentApplication, setCurrentApplication] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false); 
    const [expandedAppId, setExpandedAppId] = useState(null); 
    const [searchQuery, setSearchQuery] = useState(''); // Add state for search query
    const toast = useToast(); 

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


    const handleConnectGoogle = async () => {
        try {
            // Step 1: Ask our back-end for the special Google URL
            const res = await api.get('/auth/google/url'); 
            const { url } = res.data;

            // Step 2: Redirect the browser window to the URL we received
            window.location.href = url;
        } catch (err) {
            console.error("Could not get Google auth URL", err);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        toast({ title: 'Syncing with Gmail...', status: 'info', duration: 9000, isClosable: true });
        try {
            const res = await api.post('/applications/sync');
            toast({ title: 'Sync Complete!', description: res.data.msg, status: 'success', duration: 5000, isClosable: true });
            
            // Re-fetch applications to show the new data, including new interactions
            const updatedApps = await api.get('/applications');
            setApplications(updatedApps.data);

        } catch (err) {
            toast({ title: 'Sync Failed', description: err.response?.data?.msg || 'An error occurred.', status: 'error', duration: 5000, isClosable: true });
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleToggleExpand = (appId) => {
        setExpandedAppId(expandedAppId === appId ? null : appId);
    };

    // Filter and then sort applications
    const filteredAndSortedApplications = React.useMemo(() => {
        return applications
            .filter(app => 
                app.company.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                if (a.status === 'REJECTED' && b.status !== 'REJECTED') return 1;
                if (a.status !== 'REJECTED' && b.status === 'REJECTED') return -1;
                const dateA = new Date(a.lastContactedAt || a.appliedAt);
                const dateB = new Date(b.lastContactedAt || b.appliedAt);
                return dateB - dateA;
            });
    }, [applications, searchQuery]); // Add searchQuery to dependency array

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
    <Box bg={contentBg} color={textColor} w="65%" mx="auto" p={4} borderWidth={1} borderRadius="lg" boxShadow="md" borderColor={borderColor}>
        <Box maxW="container.lg" mx="auto" p={4}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading>Job Application Tracker</Heading>
                 <Flex>
                    <Button onClick={handleConnectGoogle} colorScheme="teal" mr={4}>
                        Connect Gmail
                    </Button>
                    <Button 
                        onClick={handleSync} 
                        colorScheme="green" 
                        isLoading={isSyncing} 
                        loadingText="Syncing..."
                        mr={4}
                    >
                        Sync
                    </Button>
                    <Button onClick={handleAddNew} colorScheme="blue">
                        Add New
                    </Button>
                </Flex>
            </Flex>

            {/* Search Bar */}
            <Flex mb={4}>
                <Input
                    placeholder="Search by company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg={useColorModeValue('gray.600', 'gray.700')}
                    borderColor={borderColor}
                    _placeholder={{ color: 'gray.100' }}
                />
            </Flex>

            {filteredAndSortedApplications.length === 0 ? (
                <Text>No applications found. Add one to get started or clear your search.</Text>
            ) : (
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th w="5%" color={tableHeaderColor}></Th> {/* --- NEW: Empty header for expand button --- */}
                            <Th color={tableHeaderColor}>Company</Th>
                            <Th color={tableHeaderColor}>Role</Th>
                            <Th color={tableHeaderColor}>Status</Th>
                            <Th color={tableHeaderColor}>Next Step</Th>
                            <Th color={tableHeaderColor}>Last Contact</Th>
                            <Th color={tableHeaderColor}>Date Applied</Th>
                            <Th color={tableHeaderColor}>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredAndSortedApplications.map((app) => (
                            <React.Fragment key={app.id}>
                                <Tr bg={app.status === 'REJECTED' ? rejectedRowBg : 'transparent'}>
                                    <Td>
                                        <IconButton
                                            variant="ghost"
                                            onClick={() => handleToggleExpand(app.id)}
                                            icon={expandedAppId === app.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                            aria-label="Expand row"
                                            isDisabled={!app.interactions || app.interactions.length === 0}
                                            color={iconButtonColor} // Ensure icon is visible
                                            _hover={{ bg: 'gray.600' }} // Hover effect for icon button
                                        />
                                    </Td>
                                    <Td>{app.company}</Td>
                                    <Td>{app.role}</Td>
                                    <Td>{app.status}</Td>
                                    <Td>{app.nextStep || 'N/A'}</Td>
                                    <Td>{app.lastContactedAt ? new Date(app.lastContactedAt).toLocaleDateString() : 'N/A'}</Td>
                                    <Td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : new Date()}</Td>
                                    <Td>
                                        <Button size="sm" mr={2} onClick={() => handleEdit(app)}>Edit</Button>
                                        <Button size="sm" colorScheme="red" onClick={() => handleDelete(app.id)}>Delete</Button>
                                    </Td>
                                </Tr>
                                <Tr>
                                    <Td colSpan={8} p={0} border="none"> {/* Adjusted colSpan to 8 to include Actions */}
                                        <Collapse in={expandedAppId === app.id} animateOpacity>
                                            <Box p={4} bg={interactionBg} color={interactionTextColor}>
                                                <Heading size="sm" mb={2}>Interaction History</Heading>
                                                {app.interactions && app.interactions.length > 0 ? (
                                                    <VStack align="start" spacing={3}>
                                                        {app.interactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(inter => (
                                                            <Box key={inter.id} w="100%">
                                                                <Text fontWeight="bold">{new Date(inter.date).toLocaleString()}</Text>
                                                                <Text fontSize="sm" color={interactionSubjectColor}>Subject: {inter.subject}</Text>
                                                                <Text fontSize="sm" pl={2}>- {inter.summary}</Text>
                                                            </Box>
                                                        ))}
                                                    </VStack>
                                                ) : (
                                                    <Text>No interactions logged.</Text>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Td>
                                </Tr>
                            </React.Fragment>
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