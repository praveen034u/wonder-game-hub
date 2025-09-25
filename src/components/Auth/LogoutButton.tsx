import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const { logout, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
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