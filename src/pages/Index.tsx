import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService } from "@/lib/storage";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, activeProfile, parentProfile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Check if user has completed profile
    if (!activeProfile) {
      navigate('/profile', { replace: true });
      return;
    }

    // Check if user has parent profile (for returning users)
    const userData = StorageService.getUserData();
    if (userData?.hasCompletedProfile && !parentProfile) {
      navigate('/parent-setup', { replace: true });
      return;
    }

    navigate('/modes', { replace: true });
  }, [isAuthenticated, activeProfile, parentProfile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="text-2xl font-fredoka text-primary">Loading... 🎮</div>
      </div>
    );
  }

  return null;
};

export default Index;