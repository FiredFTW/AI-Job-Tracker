import React, { useState, useEffect } from 'react';
import api from '../utils/api'; 
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  IconButton,
  Heading,
  useColorModeValue,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { FaTrash, FaCheckCircle, FaCircle } from 'react-icons/fa'; // Icons

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  // Colors for light/dark mode - assuming a dark theme for task items
  const taskBg = useColorModeValue('gray.600', 'gray.700');
  const taskCompletedBg = useColorModeValue('green.600', 'green.700');
  const taskTextColor = useColorModeValue('whiteAlpha.900', 'whiteAlpha.900');
  const completedTaskTextColor = useColorModeValue('gray.400', 'gray.400'); // Adjusted for better visibility on green

  // Define consistent dark theme colors for the input field
  const inputBg = useColorModeValue('gray.600', 'gray.600');
  const inputBorderColor = useColorModeValue('gray.500', 'gray.500');
  const inputHoverBorderColor = useColorModeValue('gray.400', 'gray.400');
  const placeholderTextColor = useColorModeValue('gray.400', 'gray.400');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks');
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
  }, []); // The empty array means this runs once when the component mounts

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return; // Prevent adding empty tasks
    try {
      const res = await api.post('/tasks', { title });
      setTasks([res.data, ...tasks]);
      setTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const taskToToggle = tasks.find(task => task.id === id);
      if (!taskToToggle) return;

      // Optimistically update UI
      const updatedTasks = tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      );
      setTasks(updatedTasks);

      // Make API call
      await api.put(`/tasks/${id}`, { isCompleted: !taskToToggle.isCompleted });
      // No need to setTasks again if API call is successful, UI is already updated
      // If API call fails, we might want to revert the optimistic update (more complex)
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      // This requires storing the original tasks state or re-fetching
      // For simplicity, we'll just log the error here
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      // Filter out the deleted task from the state
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Heading as="h2" size="lg" textAlign="center" color={taskTextColor}>
        My Tasks
      </Heading>
      <Box as="form" onSubmit={handleAddTask} w="100%">
        <HStack spacing={3}>
          <Input
            placeholder="Add a new task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            bg={inputBg} // Use consistently dark background
            borderColor={inputBorderColor} // Use consistently dark border
            color={taskTextColor} // Text color is already consistently light
            _hover={{ borderColor: inputHoverBorderColor }}
            _placeholder={{ color: placeholderTextColor }} // Set placeholder color for dark bg
          />
          <Button type="submit" colorScheme="blue" px={8}>
            Add Task
          </Button>
        </HStack>
      </Box>

      {tasks.length === 0 && (
        <Text textAlign="center" color={useColorModeValue('gray.500', 'gray.400')} pt={4}>
          No tasks yet. Add one above!
        </Text>
      )}

      <VStack spacing={4} align="stretch" w="100%">
        {tasks.map((task) => (
          <Box
            key={task.id}
            p={4}
            bg={task.isCompleted ? taskCompletedBg : taskBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
          >
            <Flex align="center">
              <IconButton
                icon={task.isCompleted ? <FaCheckCircle /> : <FaCircle />}
                onClick={() => handleToggleComplete(task.id)}
                isRound={true}
                variant="ghost"
                colorScheme={task.isCompleted ? 'green' : 'gray'}
                aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                mr={3}
              />
              <Text
                as={task.isCompleted ? 's' : 'span'}
                flexGrow={1}
                color={task.isCompleted ? completedTaskTextColor : taskTextColor}
                fontSize="lg"
              >
                {task.title}
              </Text>
              <IconButton
                icon={<FaTrash />}
                onClick={() => handleDeleteTask(task.id)}
                isRound={true}
                variant="ghost"
                colorScheme="red"
                aria-label="Delete task"
              />
            </Flex>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};

export default Tasks;