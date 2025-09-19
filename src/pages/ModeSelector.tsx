import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Gamepad2, BookOpen, User } from 'lucide-react';

const ModeSelector = () => {
  const { activeProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-fredoka font-bold text-primary">
            Hello {activeProfile?.name}! 👋
          </h1>
          <p className="text-lg font-comic text-muted-foreground mt-2">
            What would you like to do today?
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/progress')}
            className="rounded-full"
          >
            <Star className="w-5 h-5 text-secondary" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/profile')}
            className="rounded-full"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Games Mode */}
        <Card 
          className="shadow-game border-2 hover:shadow-float transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/games')}
        >
          <CardHeader className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-game rounded-full flex items-center justify-center shadow-game group-hover:animate-bounce">
              <Gamepad2 className="w-12 h-12 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-fredoka text-game-riddle">
              Fun Games! 🎮
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg font-comic text-muted-foreground">
              Play riddles, word games, and brain teasers to earn stars and badges!
            </p>
            <div className="space-y-2 text-sm font-comic">
              <div className="flex items-center justify-center gap-2">
                <span>❓</span>
                <span>Riddle Time</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <span>📚</span>
                <span>Word Builder (Coming Soon)</span>
              </div>
            </div>
            <Button variant="game" size="kidXl" className="w-full mt-6">
              🚀 Let's Play Games!
            </Button>
          </CardContent>
        </Card>

        {/* Stories Mode */}
        <Card 
          className="shadow-story border-2 hover:shadow-float transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/stories')}
        >
          <CardHeader className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-story rounded-full flex items-center justify-center shadow-story group-hover:animate-bounce">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-fredoka text-game-story">
              Amazing Stories! 📚
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg font-comic text-muted-foreground">
              Explore magical adventures and interactive stories that you can help create!
            </p>
            <div className="space-y-2 text-sm font-comic">
              <div className="flex items-center justify-center gap-2">
                <span>🏰</span>
                <span>Fantasy Adventures</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>🌟</span>
                <span>Interactive Tales</span>
              </div>
            </div>
            <Button variant="story" size="kidXl" className="w-full mt-6">
              📖 Read Stories!
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModeSelector;