import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import gamesConfig from "@/config/games.config.json";

const GameDashboard = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const [selectedDifficulties, setSelectedDifficulties] = useState<Record<string, string>>({});

  const enabledGames = gamesConfig.filter(game => game.enabled);

  const handlePlayGame = (gameId: string) => {
    const difficulty = selectedDifficulties[gameId] || 'easy';
    navigate(`/games/${gameId}?difficulty=${difficulty}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fredoka font-bold text-primary mb-2">
            🎮 Game Time, {activeProfile?.name}!
          </h1>
          <p className="text-lg text-muted-foreground">Choose a fun game to play</p>
        </div>

        <div className="mb-6 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/stories')}
            className="bg-white/80 hover:bg-white text-primary border-2 border-primary/30"
          >
            📚 Switch to Stories
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledGames.map((game) => (
            <Card key={game.id} className="bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="text-4xl mb-2">{game.icon}</div>
                <CardTitle className="text-xl font-fredoka text-primary">
                  {game.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Test your skills and earn stars!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Difficulty Level
                  </label>
                  <Select
                    value={selectedDifficulties[game.id] || 'easy'}
                    onValueChange={(value) => 
                      setSelectedDifficulties(prev => ({ ...prev, [game.id]: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {game.difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          <span className="capitalize">{difficulty}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => handlePlayGame(game.id)}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  Play Now! 🚀
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {enabledGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No games available at the moment.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later for more fun!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDashboard;