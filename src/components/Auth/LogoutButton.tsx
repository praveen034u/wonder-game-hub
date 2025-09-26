import { useAppAuth } from '@/contexts/Auth0Context';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const { logout, isLoading } = useAppAuth();

  const handleLogout = () => {
    const returnTo = `${window.location.origin}/`;
    (logout as any)({ 
      logoutParams: { returnTo },
      openUrl: (url: string) => {
        try {
          if (window.top) {
            (window.top as Window).location.assign(url);
          } else {
            window.location.assign(url);
          }
        } catch (e) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    });
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