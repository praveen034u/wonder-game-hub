import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton } from '@/components/Auth/LoginButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthPage = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="text-2xl font-fredoka text-primary">Loading... 🎮</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fredoka text-primary">
            StoryTeller 📚
          </CardTitle>
          <CardDescription className="text-lg">
            Create magical AI-powered stories with voice cloning for your children
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Features:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✨ AI-powered story generation</li>
                <li>🎭 Multiple child profiles</li>
                <li>🎙️ Voice cloning technology</li>
                <li>📖 Personalized story library</li>
              </ul>
            </div>
            <LoginButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};