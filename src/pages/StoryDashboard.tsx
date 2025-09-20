import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const StoryDashboard = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-accent/20 to-primary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fredoka font-bold text-primary mb-2">
            📚 Story Time, {activeProfile?.name}!
          </h1>
          <p className="text-lg text-muted-foreground">Choose an amazing story to read</p>
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
                  onClick={() => {/* Navigate to story player */}}
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