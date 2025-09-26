import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { useToast } from "@/hooks/use-toast";
import riddlesData from "@/config/riddles.json";
import type { Riddle, GameResult } from "@/types";

type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isAI?: boolean;
};

type GamePhase = 'setup' | 'countdown' | 'playing' | 'scoreboard' | 'complete';

const RiddleGame = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const { activeProfile } = useAuth();
  const { updateGameResult } = useProgress();
  const { toast } = useToast();

  const difficulty = searchParams.get('difficulty') || 'easy';

  // Only show riddle game if gameId matches
  if (gameId !== 'riddle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-lg">Game "{gameId}" not found.</p>
            <Button onClick={() => navigate('/games')} className="mt-4">
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('countdown');
  const [playerName] = useState(activeProfile?.name || 'Player');
  const [selectedCategory] = useState<string>('Zoo Animals');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0);

  useEffect(() => {
    // Automatically start the game when component mounts
    const newPlayers: Player[] = [
      {
        id: activeProfile?.id || 'player1',
        name: playerName,
        avatar: activeProfile?.avatar || '👤',
        score: 0
      },
      {
        id: 'ai1',
        name: 'Vini',
        avatar: '🐵',
        score: 0,
        isAI: true
      },
      {
        id: 'ai2', 
        name: 'Mimi',
        avatar: '🐘',
        score: 0,
        isAI: true
      }
    ];
    
    setPlayers(newPlayers);
    
    // Start countdown
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setGamePhase('playing');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Get riddles for selected category and difficulty
  const getCategoryRiddles = (category: string) => {
    const categoryData = riddlesData[category as keyof typeof riddlesData];
    if (categoryData && categoryData[difficulty as keyof typeof categoryData]) {
      return categoryData[difficulty as keyof typeof categoryData] as Riddle[];
    }
    return [];
  };
  
  const gameRiddles = getCategoryRiddles(selectedCategory);
  const currentRiddle = gameRiddles[currentRiddleIndex];

  const simulateAIAnswers = () => {
    // Simulate AI players answering with random delays
    const aiPlayers = players.filter(p => p.isAI);
    aiPlayers.forEach((aiPlayer, index) => {
      setTimeout(() => {
        const isCorrect = Math.random() > 0.4; // 60% chance of correct answer
        if (isCorrect) {
          setPlayers(prev => prev.map(p => 
            p.id === aiPlayer.id ? { ...p, score: p.score + 1 } : p
          ));
        }
      }, (index + 1) * 1500 + Math.random() * 1000);
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const correctAnswerText = currentRiddle.options[currentRiddle.correctAnswer];
    const isCorrect = answer === correctAnswerText;
    
    // Update player score
    if (isCorrect) {
      setPlayers(prev => prev.map(p => 
        p.id === (activeProfile?.id || 'player1') ? { ...p, score: p.score + 1 } : p
      ));
    }

    // Simulate AI answers
    simulateAIAnswers();

    if (isCorrect) {
      toast({
        title: "Correct! 🎉",
        description: "Well done! You got it right!",
      });
    } else {
      toast({
        title: "Not quite right 😊",
        description: `The correct answer was: ${correctAnswerText}`,
        variant: "destructive",
      });
    }

    // Show scoreboard after each question
    setTimeout(() => {
      setShowScoreboard(true);
    }, 2000);
  };

  const nextQuestion = () => {
    setShowScoreboard(false);
    if (currentRiddleIndex < gameRiddles.length - 1) {
      setCurrentRiddleIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setCountdown(3);
      setGamePhase('countdown');
      
      // Countdown for next question
      let count = 3;
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timer);
          setGamePhase('playing');
        }
      }, 1000);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGamePhase('complete');
    
    const playerScore = players.find(p => p.id === (activeProfile?.id || 'player1'))?.score || 0;
    const totalQuestions = currentRiddleIndex + 1;
    
    // Calculate stars (1-3 based on percentage)
    const percentage = playerScore / totalQuestions;
    let starsEarned = 1;
    if (percentage >= 0.8) starsEarned = 3;
    else if (percentage >= 0.6) starsEarned = 2;

    const gameResult: GameResult = {
      gameId: 'riddle',
      profileId: activeProfile?.id || '',
      difficulty,
      correct: playerScore,
      total: totalQuestions,
      starsEarned,
      endedAt: new Date().toISOString()
    };

    updateGameResult(gameResult);
    
    toast({
      title: `Game Complete! ${starsEarned} ⭐`,
      description: `You got ${playerScore}/${totalQuestions} correct!`,
    });
  };

  const handlePlayAgain = () => {
    setGamePhase('setup');
    setCurrentRiddleIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowScoreboard(false);
    setPlayers([]);
  };


  // Countdown Phase
  if (gamePhase === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white/90 shadow-xl">
          <CardContent className="text-center py-16">
            <h2 className="text-2xl font-fredoka text-primary mb-4">
              {selectedCategory} Riddle Challenge
            </h2>
            <div className="flex justify-center space-x-2 mb-6">
              <span className="text-3xl">🐄</span>
              <span className="text-3xl">🐵</span>
              <span className="text-3xl">🐘</span>
            </div>
            <p className="text-lg text-muted-foreground mb-4">Get ready! Starting in...</p>
            <div className="text-6xl font-bold text-primary">
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Scoreboard Phase
  if (showScoreboard) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
        <div className="max-w-md mx-auto">
          <Card className="bg-white/90 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-fredoka text-primary">
                {selectedCategory} Challenge
              </CardTitle>
              <div className="flex justify-center space-x-2 mt-2">
                <span className="text-2xl">🐄</span>
                <span className="text-2xl">🐵</span>
                <span className="text-2xl">🐘</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-primary mb-4">Current Scores</h3>
                <div className="space-y-3">
                  {sortedPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between bg-secondary/10 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-lg">{player.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-primary">{player.name}</span>
                      </div>
                      <span className="text-xl font-bold text-primary">{player.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={nextQuestion}
                className="w-full bg-primary hover:bg-primary/90 text-white mt-6"
                size="lg"
              >
                {currentRiddleIndex < gameRiddles.length - 1 ? "Next Question →" : "Finish Game 🏆"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Game Complete Phase
  if (gamePhase === 'complete') {
    const playerScore = players.find(p => p.id === (activeProfile?.id || 'player1'))?.score || 0;
    const totalQuestions = currentRiddleIndex + 1;
    const percentage = (playerScore / totalQuestions) * 100;
    let starsEarned = 1;
    if (percentage >= 80) starsEarned = 3;
    else if (percentage >= 60) starsEarned = 2;

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
        <Card className="max-w-lg mx-auto bg-white/90 shadow-xl">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl font-fredoka text-primary">
              Great Job, {playerName}!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">Final Scoreboard:</p>
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between bg-secondary/10 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{index === 0 ? '👑' : `${index + 1}.`}</div>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-lg">{player.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-primary">{player.name}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{player.score}</span>
                </div>
              ))}
              
              <div className="flex justify-center mt-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className={`text-2xl ${i < starsEarned ? 'text-yellow-500' : 'text-gray-300'}`}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handlePlayAgain}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                Play Again 🔄
              </Button>
              <Button 
                onClick={() => navigate('/games')}
                variant="outline"
                className="w-full border-input hover:bg-secondary/10"
                size="lg"
              >
                Back to Games
              </Button>
              <Button 
                onClick={() => navigate('/progress')}
                variant="outline"
                className="w-full border-input hover:bg-secondary/10"
                size="lg"
              >
                View Progress ⭐
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentRiddle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
        <Card className="max-w-md mx-auto bg-pink-100/90">
          <CardContent className="text-center py-8">
            <p className="text-lg text-pink-700">No riddles available for {selectedCategory} - {difficulty}.</p>
            <Button onClick={() => navigate('/games')} className="mt-4 bg-pink-600 hover:bg-pink-700 text-white">
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing Phase  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white/90 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-fredoka text-primary">
              {selectedCategory} Challenge
            </CardTitle>
            <div className="flex justify-center space-x-2 mt-2">
              <span className="text-2xl">🐄</span>
              <span className="text-2xl">🐵</span>
              <span className="text-2xl">🐘</span>
            </div>
            <Progress 
              value={((currentRiddleIndex + 1) / gameRiddles.length) * 100}
              className="w-full mt-4"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Question {currentRiddleIndex + 1} of {gameRiddles.length}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center bg-secondary/10 rounded-lg p-4">
              <h3 className="text-lg font-medium text-primary mb-3">
                {currentRiddle.question}
              </h3>
            </div>

            <div className="space-y-3">
              {currentRiddle.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showFeedback}
                  variant={
                    showFeedback 
                      ? option === currentRiddle.options[currentRiddle.correctAnswer]
                        ? "default"
                        : option === selectedAnswer
                          ? "destructive"
                          : "outline"
                      : "outline"
                  }
                  className={`w-full text-left justify-start p-4 h-auto ${
                    showFeedback && option === currentRiddle.options[currentRiddle.correctAnswer]
                      ? "bg-green-500 hover:bg-green-500 text-white border-green-500"
                      : showFeedback && option === selectedAnswer && option !== currentRiddle.options[currentRiddle.correctAnswer]
                        ? "bg-red-500 hover:bg-red-500 text-white border-red-500"
                        : "bg-white hover:bg-secondary/10 text-primary border-input"
                  }`}
                  size="lg"
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => navigate('/games')}
                variant="outline"
                className="border-pink-300 text-pink-700"
              >
                ← Back to Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiddleGame;