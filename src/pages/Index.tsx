import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppAuth, useAppContext } from "@/contexts/Auth0Context";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAppAuth();
  const { parentProfile, childrenProfiles, isLoadingProfiles } = useAppContext();

  useEffect(() => {
    if (isLoading || isLoadingProfiles) return;

    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    // If no parent profile yet, proceed to child profile setup (we create parent profile automatically)
    if (!parentProfile) {
      navigate('/profile', { replace: true });
      return;
    }

    // Check if user has any child profiles - if not, redirect to create profile
    if (!childrenProfiles || childrenProfiles.length === 0) {
      navigate('/profile', { replace: true });
      return;
    }

    // If child profiles exist, redirect to game selection (modes)
    navigate('/modes', { replace: true });
  }, [childrenProfiles, parentProfile, isLoading, isLoadingProfiles, isAuthenticated, navigate]);

  if (isLoading || isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="text-2xl font-fredoka text-primary">Loading... 🎮</div>
      </div>
    );
  }

  return null;
};

export default Index;