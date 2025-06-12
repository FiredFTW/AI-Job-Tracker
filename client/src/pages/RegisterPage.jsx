import React, { useState } from 'react';
import axios from 'axios';
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Flex,
  Link,
  Text,
} from '@chakra-ui/react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate(); // Initialize useNavigate
  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
      });
      localStorage.setItem('token', res.data.token); // Save token
      console.log('User registered successfully!', res.data);
      navigate('/dashboard'); // Redirect to dashboard
    } catch (err) {
      console.error(err.response?.data || err.message);
      localStorage.removeItem('token'); // Clear token on error
    }
  };

  return (
    <Flex align="center" justify="center" h="100vh" bg="gray.800" w="100vw">
      <Box
        p={8}
        width="full"
        maxWidth="500px"
        bg="white"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        <VStack spacing={4} as="form" onSubmit={onSubmit}>
          <Heading>Register</Heading>

          <FormControl isRequired>
            <FormLabel>Email Address</FormLabel>
            <Input
              type="email"
              placeholder="Enter your email"
              name="email"
              value={email}
              onChange={onChange}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Create a password (min. 6 characters)"
              name="password"
              value={password}
              onChange={onChange}
              minLength="6"
            />
          </FormControl>

          <Button type="submit" colorScheme="green" width="full">
            Register
          </Button>
          <Text pt={2}>
            Already have an account?{' '}
            <Link color="blue.500" onClick={() => navigate('/login')}>
              Login here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default RegisterPage;