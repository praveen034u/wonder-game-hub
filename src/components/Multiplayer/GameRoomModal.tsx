import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/contexts/Auth0Context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
}

interface GameRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  difficulty: string;
  onStartGame: (roomId: string) => void;
}

const AI_FRIENDS = [
  { name: "Luna Bot", avatar: "🤖", personality: "Friendly and encouraging" },
  { name: "Spark AI", avatar: "⚡", personality: "Quick and witty" },
  { name: "Buddy", avatar: "🐙", personality: "Helpful and patient" },
  { name: "Zara", avatar: "🌟", personality: "Creative and fun" }
];

const GameRoomModal = ({ isOpen, onClose, gameId, difficulty, onStartGame }: GameRoomModalProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (isOpen && selectedChild) {
      initializeRoom();
    }
  }, [isOpen, selectedChild]);

  const initializeRoom = () => {
    if (!selectedChild) return;
    
    setPlayers([{
      id: selectedChild.id,
      name: selectedChild.name,
      avatar: selectedChild.avatar || '👤',
      isAI: false
    }]);
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGameRoom = async () => {
    if (!selectedChild?.id) return;

    try {
      setIsCreatingRoom(true);
      const newRoomCode = generateRoomCode();
      
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: newRoomCode,
          host_child_id: selectedChild.id,
          game_id: gameId,
          difficulty: difficulty,
          max_players: 4,
          current_players: 1
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add host to participants
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          child_id: selectedChild.id,
          player_name: selectedChild.name,
          player_avatar: selectedChild.avatar || '👤',
          is_ai: false
        });

      if (participantError) throw participantError;

      setCurrentRoom(room.id);
      setRoomCode(newRoomCode);
      
      toast({
        title: "Room Created! 🎉",
        description: `Room code: ${newRoomCode}. Share this with friends!`,
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create game room",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const addAIPlayer = async () => {
    if (!currentRoom || players.length >= 4) return;

    const availableAI = AI_FRIENDS.filter(ai => 
      !players.some(p => p.name === ai.name)
    );

    if (availableAI.length === 0) return;

    const aiToAdd = availableAI[Math.floor(Math.random() * availableAI.length)];

    try {
      const { error } = await supabase
        .from('room_participants')
        .insert({
          room_id: currentRoom,
          child_id: null,
          player_name: aiToAdd.name,
          player_avatar: aiToAdd.avatar,
          is_ai: true
        });

      if (error) throw error;

      const newPlayer: Player = {
        id: `ai-${Date.now()}`,
        name: aiToAdd.name,
        avatar: aiToAdd.avatar,
        isAI: true
      };

      setPlayers(prev => [...prev, newPlayer]);
      
      // Update room player count
      await supabase
        .from('game_rooms')
        .update({ 
          current_players: players.length + 1,
          has_ai_player: true,
          ai_player_name: aiToAdd.name,
          ai_player_avatar: aiToAdd.avatar
        })
        .eq('id', currentRoom);

      toast({
        title: "AI Friend Added! 🤖",
        description: `${aiToAdd.name} joined the game!`,
      });
    } catch (error) {
      console.error('Error adding AI player:', error);
      toast({
        title: "Error",
        description: "Failed to add AI player",
        variant: "destructive",
      });
    }
  };

  const startGame = () => {
    if (currentRoom && players.length >= 1) {
      onStartGame(currentRoom);
      onClose();
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim() || !selectedChild?.id) return;

    try {
      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', joinCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (roomError || !room) {
        toast({
          title: "Room Not Found",
          description: "Invalid room code or room is not available",
          variant: "destructive",
        });
        return;
      }

      if (room.current_players >= room.max_players) {
        toast({
          title: "Room Full",
          description: "This room is already full",
          variant: "destructive",
        });
        return;
      }

      // Join room
      const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          child_id: selectedChild.id,
          player_name: selectedChild.name,
          player_avatar: selectedChild.avatar || '👤',
          is_ai: false
        });

      if (joinError) throw joinError;

      // Update room count
      await supabase
        .from('game_rooms')
        .update({ current_players: room.current_players + 1 })
        .eq('id', room.id);

      toast({
        title: "Joined Room! 🎉",
        description: "You've successfully joined the game room!",
      });

      onStartGame(room.id);
      onClose();
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            🎮 Multiplayer Game Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Join Existing Room */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-center">Join a Friend's Room</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button onClick={joinRoom} disabled={!joinCode.trim()}>
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Create New Room */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-center">
                {currentRoom ? "Your Room" : "Create New Room"}
              </h3>
              
              {!currentRoom ? (
                <Button 
                  onClick={createGameRoom} 
                  disabled={isCreatingRoom}
                  className="w-full"
                >
                  {isCreatingRoom ? "Creating..." : "Create Room"}
                </Button>
              ) : (
                <>
                  {/* Room Code Display */}
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Room Code</p>
                    <p className="text-2xl font-bold font-mono text-primary">{roomCode}</p>
                  </div>

                  {/* Players List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Players ({players.length}/4)</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addAIPlayer}
                        disabled={players.length >= 4}
                      >
                        + AI Friend
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-2 bg-secondary/20 rounded-lg"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm font-medium">
                            {player.name}
                          </span>
                          {player.isAI && (
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Start Game Button */}
                  <Button 
                    onClick={startGame}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={players.length === 0}
                  >
                    Start Game! 🚀
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRoomModal;