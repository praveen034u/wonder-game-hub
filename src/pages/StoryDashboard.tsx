import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/Auth0Context";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

const StoryDashboard = () => {
  const navigate = useNavigate();
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stories = [
    {
      id: "adventure-forest",
      title: "The Magical Forest",
      description: "Join Luna on her adventure through an enchanted forest",
      icon: "🌲",
      chapters: 5,
      completed: false
    },
    {
      id: "space-explorer",
      title: "Space Explorer",
      description: "Travel to distant planets and meet alien friends",
      icon: "🚀",
      chapters: 4,
      completed: false
    },
    {
      id: "underwater-kingdom",
      title: "Underwater Kingdom",
      description: "Dive deep and discover the secrets of the ocean",
      icon: "🐠",
      chapters: 6,
      completed: false
    }
  ];

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      
      if (finalTranscript) {
        setStoryText(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      toast({
        title: "Recording Error",
        description: "There was an error with voice recording",
        variant: "destructive"
      });
      setIsRecording(false);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsListening(false);
  };

  const generateStory = () => {
    if (!storyText.trim()) {
      toast({
        title: "No Story",
        description: "Please record or write a story first",
        variant: "destructive"
      });
      return;
    }

    // Navigate to story viewer with the story text
    navigate('/story-viewer', { state: { storyText: storyText.trim() } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-accent/20 to-primary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-fredoka font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4 drop-shadow-sm">
            📚 Story Time, {selectedChild?.name}!
          </h1>
          <p className="text-xl text-muted-foreground font-medium">Create your own story or choose one to read</p>
        </div>

        <div className="mb-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/games')}
            className="bg-gradient-to-r from-white/90 to-white hover:from-white hover:to-white/90 text-primary border-3 border-primary/40 hover:border-primary/60 shadow-lg transform hover:scale-105 transition-all duration-200 text-lg px-8 py-3"
          >
            🎮 Switch to Games
          </Button>
        </div>

        {/* Story Creation Section */}
        <Card className="mb-8 bg-gradient-to-br from-white/95 to-primary/5 shadow-xl border-2 border-primary/20">
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
            <CardTitle className="text-3xl font-fredoka text-primary flex items-center justify-center gap-3">
              ✍️ Create Your Own Story
            </CardTitle>
            <CardDescription className="text-lg">
              Record your voice or type to create an amazing story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="flex gap-3 justify-center mb-6">
              {!isRecording ? (
                <Button
                  onClick={startVoiceRecording}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                  size="lg"
                >
                  🎤 Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopVoiceRecording}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white animate-pulse shadow-lg"
                  size="lg"
                >
                  ⏹️ Stop Recording
                </Button>
              )}
            </div>
            
            {isListening && (
              <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
                <div className="text-2xl mb-2">🎙️</div>
                <p className="text-primary font-medium">Listening... Speak your story!</p>
              </div>
            )}

            <Textarea
              placeholder="Your story will appear here as you speak, or you can type directly..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="min-h-[200px] text-base border-2 border-primary/20 focus:border-primary/40 bg-white/90"
            />

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setStoryText("")}
                variant="outline"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive border-2"
              >
                🗑️ Clear Story
              </Button>
              <Button
                onClick={generateStory}
                disabled={!storyText.trim()}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                ✨ Generate Story
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pre-made Stories Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-fredoka font-bold text-primary text-center mb-8 flex items-center justify-center gap-3">
            📖 Or Choose a Ready Story
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <Card key={story.id} className="bg-gradient-to-br from-white/95 to-secondary/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-secondary/20 hover:border-secondary/40">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl mb-4 drop-shadow-lg">{story.icon}</div>
                <CardTitle className="text-2xl font-fredoka text-primary mb-2">
                  {story.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base leading-relaxed">
                  {story.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    {story.chapters} chapters • {story.completed ? 'Completed ✅' : 'New Adventure 🌟'}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/story-viewer', { state: { storyId: story.id } })}
                  className="w-full bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                  size="lg"
                >
                  {story.completed ? 'Read Again' : 'Start Reading'} 📖
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryDashboard;