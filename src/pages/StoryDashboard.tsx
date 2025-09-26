import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@auth0/auth0-react";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

const StoryDashboard = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fredoka font-bold text-primary mb-2">
            📚 Story Time, {activeProfile?.name}!
          </h1>
          <p className="text-lg text-muted-foreground">Create your own story or choose one to read</p>
        </div>

        <div className="mb-6 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/games')}
            className="bg-white/80 hover:bg-white text-primary border-2 border-primary/30"
          >
            🎮 Switch to Games
          </Button>
        </div>

        {/* Story Creation Section */}
        <Card className="mb-8 bg-white/90 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-fredoka text-primary">
              ✍️ Create Your Own Story
            </CardTitle>
            <CardDescription>
              Record your voice or type to create an amazing story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 justify-center mb-4">
              {!isRecording ? (
                <Button
                  onClick={startVoiceRecording}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  size="lg"
                >
                  🎤 Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopVoiceRecording}
                  className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  size="lg"
                >
                  ⏹️ Stop Recording
                </Button>
              )}
            </div>
            
            {isListening && (
              <div className="text-center text-sm text-muted-foreground">
                🎙️ Listening... Speak your story!
              </div>
            )}

            <Textarea
              placeholder="Your story will appear here as you speak, or you can type directly..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="min-h-[200px] text-base"
            />

            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setStoryText("")}
                variant="outline"
                className="text-muted-foreground"
              >
                🗑️ Clear Story
              </Button>
              <Button
                onClick={generateStory}
                disabled={!storyText.trim()}
                className="bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                ✨ Generate Story
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pre-made Stories Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-fredoka font-bold text-primary text-center mb-6">
            📖 Or Choose a Ready Story
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="text-4xl mb-2">{story.icon}</div>
                <CardTitle className="text-xl font-fredoka text-primary">
                  {story.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {story.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {story.chapters} chapters • {story.completed ? 'Completed' : 'New Adventure'}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/story-viewer', { state: { storyId: story.id } })}
                  className="w-full bg-secondary hover:bg-secondary/90 text-white"
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