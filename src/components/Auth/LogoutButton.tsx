import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const { logout, isLoading } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <Button 
      onClick={handleLogout} 
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? 'Loading...' : 'Logout'}
    </Button>
  );
};