import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { useToast } from "@/hooks/use-toast";
import riddlesData from "@/config/riddles.json";
import type { Riddle, GameResult } from "@/types";

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
  
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameComplete, setGameComplete] = useState(false);

  // Flatten riddles from all categories and filter by difficulty
  const allRiddles: Riddle[] = [];
  Object.values(riddlesData).forEach(category => {
    if (category[difficulty as keyof typeof category]) {
      allRiddles.push(...category[difficulty as keyof typeof category]);
    }
  });
  
  const gameRiddles = allRiddles;
  const currentRiddle = gameRiddles[currentRiddleIndex];

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const correctAnswerText = currentRiddle.options[currentRiddle.correctAnswer];
    const isCorrect = answer === correctAnswerText;
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    };
    setScore(newScore);

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

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentRiddleIndex < gameRiddles.length - 1) {
        setCurrentRiddleIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        finishGame(newScore);
      }
    }, 2000);
  };

  const finishGame = (finalScore: typeof score) => {
    setGameComplete(true);
    
    // Calculate stars (1-3 based on percentage)
    const percentage = finalScore.correct / finalScore.total;
    let starsEarned = 1;
    if (percentage >= 0.8) starsEarned = 3;
    else if (percentage >= 0.6) starsEarned = 2;

    const gameResult: GameResult = {
      gameId: 'riddle',
      profileId: activeProfile?.id || '',
      difficulty,
      correct: finalScore.correct,
      total: finalScore.total,
      starsEarned,
      endedAt: new Date().toISOString()
    };

    updateGameResult(gameResult);
    
    toast({
      title: `Game Complete! ${starsEarned} ⭐`,
      description: `You got ${finalScore.correct}/${finalScore.total} correct!`,
    });
  };

  const handlePlayAgain = () => {
    setCurrentRiddleIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore({ correct: 0, total: 0 });
    setGameComplete(false);
  };

  if (!currentRiddle && !gameComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-lg">No riddles available for {difficulty} difficulty.</p>
            <Button onClick={() => navigate('/games')} className="mt-4">
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameComplete) {
    const percentage = (score.correct / score.total) * 100;
    let starsEarned = 1;
    if (percentage >= 80) starsEarned = 3;
    else if (percentage >= 60) starsEarned = 2;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
        <Card className="max-w-lg mx-auto bg-white/95 shadow-xl">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl font-fredoka text-primary">
              Great Job, {activeProfile?.name}!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-lg">Your Score:</p>
              <p className="text-3xl font-bold text-primary">
                {score.correct}/{score.total}
              </p>
              <div className="flex justify-center">
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
                className="w-full"
                size="lg"
              >
                Back to Games
              </Button>
              <Button 
                onClick={() => navigate('/progress')}
                variant="outline"
                className="w-full"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-fredoka font-bold text-primary mb-2">
            🧩 Riddle Time!
          </h1>
          <p className="text-lg text-muted-foreground">
            Question {currentRiddleIndex + 1} of {gameRiddles.length}
          </p>
          <Progress 
            value={((currentRiddleIndex + 1) / gameRiddles.length) * 100}
            className="w-full mt-2"
          />
        </div>

        {/* Score */}
        <div className="text-center mb-6">
          <p className="text-lg">
            Score: <span className="font-bold text-primary">{score.correct}/{score.total}</span>
          </p>
        </div>

        {/* Riddle Card */}
        <Card className="bg-white/95 shadow-xl mb-6">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🧩</div>
            <CardTitle className="text-xl font-fredoka text-primary">
              {currentRiddle.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                      : ""
                }`}
                size="lg"
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={() => navigate('/games')}
            variant="outline"
          >
            ← Back to Games
          </Button>
          
          {showFeedback && currentRiddleIndex < gameRiddles.length - 1 && (
            <Button
              onClick={() => {
                setCurrentRiddleIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setShowFeedback(false);
              }}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Next Question →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiddleGame;