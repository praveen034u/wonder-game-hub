import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/Auth0Context";
import gamesConfig from "@/config/games.config.json";
import GameRoomModal from "@/components/Multiplayer/GameRoomModal";
import FriendsPanel from "@/components/Multiplayer/FriendsPanel";

const GameDashboard = () => {
  const navigate = useNavigate();
  const { selectedChild, childrenProfiles, setSelectedChild } = useAppContext();
  const [selectedDifficulties, setSelectedDifficulties] = useState<Record<string, string>>({});
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ id: string; difficulty: string } | null>(null);
  const [isFriendsPanelExpanded, setIsFriendsPanelExpanded] = useState(true);

  const enabledGames = gamesConfig.filter(game => game.enabled);

  const handlePlayGame = (gameId: string, multiplayer = false) => {
    const difficulty = selectedDifficulties[gameId] || 'easy';
    
    if (multiplayer) {
      setSelectedGame({ id: gameId, difficulty });
      setShowMultiplayerModal(true);
    } else {
      navigate(`/games/${gameId}?difficulty=${difficulty}`);
    }
  };

  const handleStartMultiplayerGame = (roomId: string) => {
    if (selectedGame) {
      navigate(`/games/${selectedGame.id}?difficulty=${selectedGame.difficulty}&room=${roomId}`);
    }
  };

  const handleInviteFriend = (friendId: string) => {
    // Logic to invite friend to current game
    console.log('Inviting friend:', friendId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex flex-col lg:flex-row gap-6">
          {/* Main Content - Full Width */}
          <div className="flex-1">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-fredoka font-bold text-primary mb-2">
                🎮 Game Time, {selectedChild?.name}!
              </h1>
              <p className="text-lg text-muted-foreground">Choose a fun game to play</p>
            </div>

            {/* Child Profile Selector */}
            {childrenProfiles.length > 1 && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-3 bg-white/80 p-3 rounded-lg shadow-sm">
                  <label className="text-sm font-medium text-muted-foreground">
                    Playing as:
                  </label>
                  <Select
                    value={selectedChild?.id || ''}
                    onValueChange={(value) => {
                      const child = childrenProfiles.find(c => c.id === value);
                      if (child) setSelectedChild(child);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select child">
                        {selectedChild && (
                          <span className="flex items-center gap-2">
                            <span>{selectedChild.avatar || '👤'}</span>
                            {selectedChild.name}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {childrenProfiles.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          <span className="flex items-center gap-2">
                            <span>{child.avatar || '👤'}</span>
                            {child.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="mb-6 text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/stories')}
                className="bg-white/80 hover:bg-white text-primary border-2 border-primary/30 mr-3"
              >
                📚 Switch to Stories
              </Button>
            </div>

            <div className="flex justify-center">
              {enabledGames.map((game) => (
                <Card key={game.id} className="bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 max-w-md w-full">
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
                    
                    {/* Game Action Buttons */}
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handlePlayGame(game.id, false)}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        size="lg"
                      >
                        Play Solo 🚀
                      </Button>
                      <Button 
                        onClick={() => handlePlayGame(game.id, true)}
                        variant="outline"
                        className="w-full border-secondary text-secondary hover:bg-secondary/10"
                        size="lg"
                      >
                        Play with Friends 👥
                      </Button>
                    </div>
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

          {/* Friends Panel - Collapsible Right Edge */}
          <div className={`fixed right-0 top-0 h-full lg:w-80 bg-white/95 shadow-lg transition-transform duration-300 z-50 
            ${isFriendsPanelExpanded ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="relative h-full">
              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -left-10 top-4 bg-white/95 shadow-md rounded-l-lg h-20"
                onClick={() => setIsFriendsPanelExpanded(!isFriendsPanelExpanded)}
              >
                {isFriendsPanelExpanded ? '👉' : '👈'}
              </Button>
              
              {/* Friends Panel Content */}
              <div className="h-full p-4 overflow-y-auto">
                <FriendsPanel onInviteFriend={handleInviteFriend} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multiplayer Modal */}
      {showMultiplayerModal && selectedGame && (
        <GameRoomModal
          isOpen={showMultiplayerModal}
          onClose={() => {
            setShowMultiplayerModal(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.id}
          difficulty={selectedGame.difficulty}
          onStartGame={handleStartMultiplayerGame}
        />
      )}
    </div>
  );
};

export default GameDashboard;