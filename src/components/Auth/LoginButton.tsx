import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export const LoginButton = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect();
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      <LogIn className="w-5 h-5 mr-2" />
      {isLoading ? 'Loading...' : 'Log In / Sign Up'}
    </Button>
  );
};