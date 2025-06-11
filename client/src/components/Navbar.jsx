import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
  const navigate = useNavigate(); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    
    navigate('/login'); 
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = jwtDecode(token);
        // Important: Make sure the user object from the token has an email
        if (decodedToken.user && decodedToken.user.email) {
            setUser(decodedToken.user);
        } else {
            // If the token is malformed, log out
            handleLogout();
        }
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
      handleLogout();
    }
  }, [navigate]); 

  return (
    <Flex
      as="nav"
      align="center"
      wrap="wrap"
      padding="1.5rem"
      bg="blue.600"
      color="white"
    >
      <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
        LifeDash
      </Heading>

      <Box ml={8}>
        <Button as={RouterLink} to="/dashboard" variant="ghost" _hover={{ bg: 'blue.700' }} _active={{ bg: 'blue.800' }}>
          Dashboard
        </Button>
        <Button as={RouterLink} to="/jobs" variant="ghost" _hover={{ bg: 'blue.700' }} _active={{ bg: 'blue.800' }}>
          Job Tracker
        </Button>
      </Box>
      
      <Spacer />

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