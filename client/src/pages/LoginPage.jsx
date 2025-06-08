import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

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
    <div>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <div>
          <input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required />
        </div>
        <div>
          <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required />
        </div>
        <input type="submit" value="Login" />
      </form>
    </div>
  );
};

export default LoginPage;