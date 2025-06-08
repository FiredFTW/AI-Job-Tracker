import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Container,
  Flex,
  Link, // Import Link
  Text, // Import Text
} from '@chakra-ui/react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate(); 
  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });
      
      // Save the token to localStorage
      localStorage.setItem('token', res.data.token);

      console.log('Login successful!', res.data);
      navigate('/dashboard'); 
      
    } catch (err) {
      console.error(err.response.data);
      // Remove any old token if login fails
      localStorage.removeItem('token');
    }
  };

return (
    // This Flex container will center the Box vertically and horizontally
    <Flex align="center" justify="center" h="100vh" bg="gray.800" w="100vw">
      <Box
        p={8}
        width="full" // Make the box take the full width of its container
        maxWidth="500px"
        bg="white" // Give the form a white background
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        <VStack spacing={4} as="form" onSubmit={onSubmit}>
          <Heading>Login</Heading>
          
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
              placeholder="Enter your password"
              name="password"
              value={password}
              onChange={onChange}
            />
          </FormControl>

          <Button type="submit" colorScheme="blue" width="full">
            Login
          </Button>
          <Text pt={2}>
            Don't have an account?{' '}
            <Link color="blue.500" onClick={() => navigate('/register')}>
              Make an account
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default LoginPage;