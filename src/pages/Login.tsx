import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/profile');
    } catch (error) {
      // Error is handled by AuthContext with toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-bounce-in">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-float animate-float">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-fredoka font-bold text-primary">
            Welcome Back! 🎉
          </h1>
          <p className="text-lg font-comic text-muted-foreground">
            Let's continue your amazing adventure!
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-soft border-2">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-fredoka">Sign In</CardTitle>
            <CardDescription className="font-comic">
              Enter your details to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-comic font-bold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-lg font-comic rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-comic font-bold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-lg font-comic rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="fun"
                size="kid"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '🔄 Signing In...' : '🚀 Let\'s Go!'}
              </Button>
            </form>

            <div className="text-center">
              <p className="font-comic text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary-glow font-bold transition-colors"
                >
                  Sign Up Here! ✨
                </Link>
              </p>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm font-comic text-muted-foreground">
                🎮 Demo Account: demo@storyteller.com / demo123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;