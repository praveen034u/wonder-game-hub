import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppAuth, useAppContext } from "@/contexts/Auth0Context";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAppAuth();
  const { parentProfile, selectedChild } = useAppContext();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    // Check if user has completed profile setup
    if (!selectedChild) {
      navigate('/profile', { replace: true });
      return;
    }

    // Check if user has completed parent setup
    if (!parentProfile) {
      navigate('/parent-setup', { replace: true });
      return;
    }

    navigate('/modes', { replace: true });
  }, [isAuthenticated, selectedChild, parentProfile, isLoading, navigate]);

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